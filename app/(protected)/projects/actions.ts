"use server"

import { revalidatePath } from "next/cache"

import { logActivity, sourceRefFor } from "@/lib/interactions/log-activity"
import { seedProjectTasks } from "@/lib/projects/seed-tasks"
import { createClient } from "@/lib/supabase/server"
import { financing, websitePlans, type WebsitePlanId } from "@/lib/site"
import { Constants, type Database } from "@/lib/supabase/types"

type ProjectStage = Database["public"]["Enums"]["project_stage"]
type PaymentStatus = Database["public"]["Enums"]["payment_status"]
type ProjectProductType =
  Database["public"]["Enums"]["project_product_type"]

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export type CreateProjectResult =
  | { ok: true; projectId: string }
  | { ok: false; error: string }

export type UpdateProjectResult =
  | { ok: true }
  | { ok: false; error: string }

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const WEBSITE_PLAN_IDS = websitePlans.map((p) => p.id) as readonly WebsitePlanId[]

function str(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim()
  return v.length > 0 ? v : null
}

function num(formData: FormData, key: string): number | null {
  const raw = str(formData, key)
  if (raw == null) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function bool(formData: FormData, key: string): boolean {
  const v = String(formData.get(key) ?? "").trim()
  return v === "on" || v === "true"
}

function parseStage(raw: string): ProjectStage {
  const stages = Constants.public.Enums.project_stage as readonly string[]
  return stages.includes(raw) ? (raw as ProjectStage) : "proposal"
}

function parsePaymentStatus(raw: string): PaymentStatus {
  const statuses = Constants.public.Enums.payment_status as readonly string[]
  return statuses.includes(raw) ? (raw as PaymentStatus) : "unpaid"
}

function parseProductType(raw: string | null): ProjectProductType | null {
  if (!raw) return null
  const types =
    Constants.public.Enums.project_product_type as readonly string[]
  return types.includes(raw) ? (raw as ProjectProductType) : null
}

function parsePlanId(raw: string | null): WebsitePlanId | "none" {
  if (!raw || raw === "none") return "none"
  return (WEBSITE_PLAN_IDS as readonly string[]).includes(raw)
    ? (raw as WebsitePlanId)
    : "none"
}

/**
 * A project's deposit has cleared (payment_status='paid') or the stage has
 * advanced past proposal — the client is paying and should leave the leads
 * list. Guarded so we never downgrade active_client/at_risk/canceled.
 */
async function promoteClientToActive(
  supabase: SupabaseServerClient,
  clientId: string,
) {
  await supabase
    .from("clients")
    .update({ status: "active_client" })
    .eq("id", clientId)
    .in("status", ["lead", "qualified", "archived", "lost"])
}

/**
 * Sync the recurring plan attached to a website project.
 * - "none" → remove any attached subscription.
 * - presence/growth → upsert a subscription with the catalog rate.
 * - custom → upsert using the submitted monthly rate.
 */
async function syncWebsiteSubscription(
  supabase: SupabaseServerClient,
  projectId: string,
  clientId: string,
  soldBy: string | null,
  planId: WebsitePlanId | "none",
  customRate: number | null,
  startDate: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const existing = await supabase
    .from("subscriptions")
    .select("id")
    .eq("project_id", projectId)
    .maybeSingle()

  if (planId === "none") {
    if (existing.data) {
      const { error } = await supabase
        .from("subscriptions")
        .delete()
        .eq("id", existing.data.id)
      if (error) return { ok: false, error: error.message }
    }
    return { ok: true }
  }

  const catalog = websitePlans.find((p) => p.id === planId)
  if (!catalog) return { ok: false, error: "Unknown plan" }

  const monthlyRate =
    planId === "custom" ? customRate : (catalog.monthlyRate ?? 0)
  if (monthlyRate == null || !Number.isFinite(monthlyRate) || monthlyRate < 0) {
    return { ok: false, error: "Enter a monthly rate" }
  }

  if (existing.data) {
    const { error } = await supabase
      .from("subscriptions")
      .update({
        plan: catalog.label,
        product: "Website",
        monthly_rate: monthlyRate,
        sold_by: soldBy,
      })
      .eq("id", existing.data.id)
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  }

  const { error } = await supabase.from("subscriptions").insert({
    client_id: clientId,
    project_id: projectId,
    plan: catalog.label,
    product: "Website",
    monthly_rate: monthlyRate,
    sold_by: soldBy,
    started_at: startDate ?? new Date().toISOString().slice(0, 10),
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function createNewProject(
  formData: FormData,
): Promise<CreateProjectResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  const title = str(formData, "title")
  if (!title) return { ok: false, error: "Title is required" }

  const clientId = str(formData, "client_id")
  if (!clientId || !UUID_RE.test(clientId)) {
    return { ok: false, error: "Select a client" }
  }

  const soldByRaw = str(formData, "sold_by")
  const soldBy = soldByRaw && UUID_RE.test(soldByRaw) ? soldByRaw : null

  const stage = parseStage(String(formData.get("stage") ?? ""))
  const paymentStatus = parsePaymentStatus(
    String(formData.get("payment_status") ?? ""),
  )
  const productType = parseProductType(str(formData, "product_type"))

  const value = num(formData, "value")
  const depositRate = num(formData, "deposit_rate")
  const financingEnabled =
    bool(formData, "financing_enabled") &&
    value != null &&
    value >= financing.minAmount

  const startDate = str(formData, "start_date")
  const planId =
    productType === "business_website"
      ? parsePlanId(str(formData, "website_plan"))
      : "none"
  const customRate = num(formData, "website_plan_rate")

  const { data, error } = await supabase
    .from("projects")
    .insert({
      title,
      description: str(formData, "description"),
      client_id: clientId,
      sold_by: soldBy,
      stage,
      payment_status: paymentStatus,
      product_type: productType,
      value,
      deposit_rate: depositRate ?? undefined,
      financing_enabled: financingEnabled,
      start_date: startDate,
      deadline: str(formData, "deadline"),
    })
    .select("id")
    .single()

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to create project" }
  }

  await logActivity({
    supabase,
    clientId,
    loggedBy: auth.user.id,
    type: "follow_up",
    title: `New project — ${title}`,
    content:
      value != null ? `Value $${value.toLocaleString()}` : null,
    projectId: data.id,
    sourceRef: sourceRefFor("project-created", data.id),
  })

  await seedProjectTasks({
    projectId: data.id,
    productType,
    createdBy: auth.user.id,
  })

  const subSync = await syncWebsiteSubscription(
    supabase,
    data.id,
    clientId,
    soldBy,
    planId,
    customRate,
    startDate,
  )
  if (!subSync.ok) return { ok: false, error: subSync.error }

  if (
    paymentStatus === "paid" ||
    stage === "active" ||
    stage === "completed" ||
    planId !== "none"
  ) {
    await promoteClientToActive(supabase, clientId)
    revalidatePath("/leads")
    revalidatePath("/clients")
  }

  revalidatePath("/projects")
  return { ok: true, projectId: data.id }
}

export async function updateProject(
  projectId: string,
  formData: FormData,
): Promise<UpdateProjectResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  const title = str(formData, "title")
  if (!title) return { ok: false, error: "Title is required" }

  const clientId = str(formData, "client_id")
  if (!clientId || !UUID_RE.test(clientId)) {
    return { ok: false, error: "Select a client" }
  }

  const soldByRaw = str(formData, "sold_by")
  const soldBy = soldByRaw && UUID_RE.test(soldByRaw) ? soldByRaw : null

  const stage = parseStage(String(formData.get("stage") ?? ""))
  const paymentStatus = parsePaymentStatus(
    String(formData.get("payment_status") ?? ""),
  )
  const productType = parseProductType(str(formData, "product_type"))

  const value = num(formData, "value")
  const depositRate = num(formData, "deposit_rate")
  const financingEnabled =
    bool(formData, "financing_enabled") &&
    value != null &&
    value >= financing.minAmount

  const startDate = str(formData, "start_date")
  const planId =
    productType === "business_website"
      ? parsePlanId(str(formData, "website_plan"))
      : "none"
  const customRate = num(formData, "website_plan_rate")

  const { data: existingProject } = await supabase
    .from("projects")
    .select("stage")
    .eq("id", projectId)
    .maybeSingle()

  const { error } = await supabase
    .from("projects")
    .update({
      title,
      description: str(formData, "description"),
      client_id: clientId,
      sold_by: soldBy,
      stage,
      payment_status: paymentStatus,
      product_type: productType,
      value,
      deposit_rate: depositRate ?? undefined,
      financing_enabled: financingEnabled,
      start_date: startDate,
      deadline: str(formData, "deadline"),
    })
    .eq("id", projectId)

  if (error) return { ok: false, error: error.message }

  const today = new Date().toISOString().slice(0, 10)
  if (existingProject?.stage && existingProject.stage !== stage) {
    await logActivity({
      supabase,
      clientId,
      loggedBy: auth.user.id,
      type: "follow_up",
      title: `Stage → ${stage}`,
      content: title,
      projectId,
      sourceRef: sourceRefFor("project-stage", projectId, stage),
    })
  } else {
    await logActivity({
      supabase,
      clientId,
      loggedBy: auth.user.id,
      type: "note",
      title: `Updated project — ${title}`,
      projectId,
      sourceRef: sourceRefFor("project-edit", projectId, today),
    })
  }

  const subSync = await syncWebsiteSubscription(
    supabase,
    projectId,
    clientId,
    soldBy,
    planId,
    customRate,
    startDate,
  )
  if (!subSync.ok) return { ok: false, error: subSync.error }

  // Keep the project's rep aligned with the client's primary rep and any
  // attached subscription, so commission attribution (which reads
  // subscriptions.sold_by) and Stripe checkout (which reads
  // clients.assigned_to) don't drift when an admin fixes the rep here.
  if (soldBy) {
    await supabase
      .from("subscriptions")
      .update({ sold_by: soldBy })
      .eq("project_id", projectId)
    await supabase
      .from("clients")
      .update({ assigned_to: soldBy })
      .eq("id", clientId)
  }

  // Deposit cleared / project is running → promote the client off the leads
  // list. `active` stage implies the deposit gate trigger passed.
  if (paymentStatus === "paid" || stage === "active" || stage === "completed") {
    await promoteClientToActive(supabase, clientId)
    revalidatePath("/leads")
    revalidatePath("/clients")
  }

  revalidatePath("/projects")
  return { ok: true }
}
