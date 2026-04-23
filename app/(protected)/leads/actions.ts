"use server"

import { revalidatePath } from "next/cache"

import { logActivity, sourceRefFor } from "@/lib/interactions/log-activity"
import { seedProjectTasks } from "@/lib/projects/seed-tasks"
import { createClient } from "@/lib/supabase/server"
import { Constants, type Database } from "@/lib/supabase/types"

type ClientSource = Database["public"]["Enums"]["client_source"]
type ClientKind = "lead" | "prospect"
type ProjectProductType = Database["public"]["Enums"]["project_product_type"]

const PROJECT_PRODUCT_TITLE: Record<ProjectProductType, string> = {
  business_website: "Website",
  mobile_app: "Mobile App",
  web_app: "SaaS Product",
  ai_integration: "AI Integration",
}

type SubscriptionPlanId = "presence" | "growth"
const SUBSCRIPTION_PLAN: Record<
  SubscriptionPlanId,
  { label: string; monthlyRate: number }
> = {
  presence: { label: "Presence", monthlyRate: 97 },
  growth: { label: "Growth", monthlyRate: 247 },
}

export type CreateLeadResult =
  | { ok: true; leadId: string }
  | { ok: false; error: string }

export type UpdateLeadResult = { ok: true } | { ok: false; error: string }

export type DeleteLeadResult = { ok: true } | { ok: false; error: string }

function titleCase(v: string) {
  return v.replace(/\b(\p{Ll})/gu, (c) => c.toUpperCase())
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function createLead(
  formData: FormData
): Promise<CreateLeadResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  const name = titleCase(String(formData.get("name") ?? "").trim())
  if (!name) return { ok: false, error: "Name is required" }

  const kindRaw = String(formData.get("kind") ?? "")
  const kind: ClientKind = kindRaw === "prospect" ? "prospect" : "lead"

  const sourceRaw = String(formData.get("source") ?? "")
  const sources = Constants.public.Enums.client_source as readonly string[]
  const source: ClientSource = sources.includes(sourceRaw)
    ? (sourceRaw as ClientSource)
    : kind === "prospect"
      ? "rep_field"
      : "contact_form"

  const str = (key: string) => {
    const v = String(formData.get(key) ?? "").trim()
    return v.length > 0 ? v : null
  }

  const rawCompany = str("company")
  const email = str("email")
  if (email && !EMAIL_RE.test(email)) {
    return { ok: false, error: "Enter a valid email address" }
  }

  // Sales reps auto-claim leads they enter themselves. Admin/editor-created
  // leads drop into the unassigned pool so any active rep can claim them.
  const { data: creatorProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle()
  const assignedTo = creatorProfile?.role === "sales_rep" ? auth.user.id : null

  const { data, error } = await supabase
    .from("clients")
    .insert({
      name,
      company: rawCompany ? titleCase(rawCompany) : null,
      email,
      phone: str("phone"),
      address: str("address"),
      social_url: str("social_url"),
      budget: str("budget"),
      intent: str("intent"),
      notes: str("notes"),
      source,
      status: "lead",
      kind,
      assigned_to: assignedTo,
    })
    .select("id")
    .single()

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to create lead" }
  }

  await logActivity({
    supabase,
    clientId: data.id,
    loggedBy: auth.user.id,
    type: "note",
    title: `${kind === "prospect" ? "New prospect" : "New lead"} — ${name}`,
    sourceRef: sourceRefFor(
      kind === "prospect" ? "prospect-created" : "lead-created",
      data.id,
    ),
  })

  revalidatePath("/leads")
  return { ok: true, leadId: data.id }
}

export async function updateLead(
  clientId: string,
  formData: FormData
): Promise<UpdateLeadResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  const name = titleCase(String(formData.get("name") ?? "").trim())
  if (!name) return { ok: false, error: "Name is required" }

  const sourceRaw = String(formData.get("source") ?? "")
  const sources = Constants.public.Enums.client_source as readonly string[]
  const source: ClientSource = sources.includes(sourceRaw)
    ? (sourceRaw as ClientSource)
    : "contact_form"

  const str = (key: string) => {
    const v = String(formData.get(key) ?? "").trim()
    return v.length > 0 ? v : null
  }

  const rawCompany = str("company")
  const email = str("email")
  if (email && !EMAIL_RE.test(email)) {
    return { ok: false, error: "Enter a valid email address" }
  }

  const { error } = await supabase
    .from("clients")
    .update({
      name,
      company: rawCompany ? titleCase(rawCompany) : null,
      email,
      phone: str("phone"),
      address: str("address"),
      social_url: str("social_url"),
      budget: str("budget"),
      intent: str("intent"),
      notes: str("notes"),
      source,
    })
    .eq("id", clientId)

  if (error) return { ok: false, error: error.message }

  // Per-day dedupe: multiple edits to the same lead on the same day log once.
  const today = new Date().toISOString().slice(0, 10)
  await logActivity({
    supabase,
    clientId,
    loggedBy: auth.user.id,
    type: "note",
    title: `Updated lead — ${name}`,
    sourceRef: sourceRefFor("lead-edit", clientId, today),
  })

  revalidatePath("/leads")
  return { ok: true }
}

export async function promoteProspect(
  clientId: string
): Promise<UpdateLeadResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  const { data: existing, error: fetchError } = await supabase
    .from("clients")
    .select("name, kind")
    .eq("id", clientId)
    .maybeSingle()
  if (fetchError) return { ok: false, error: fetchError.message }
  if (!existing) return { ok: false, error: "Prospect not found" }
  if (existing.kind !== "prospect") {
    return { ok: false, error: "Already a lead" }
  }

  const { error } = await supabase
    .from("clients")
    .update({ kind: "lead" })
    .eq("id", clientId)
  if (error) return { ok: false, error: error.message }

  await logActivity({
    supabase,
    clientId,
    loggedBy: auth.user.id,
    type: "note",
    title: `Promoted to lead — ${existing.name}`,
    sourceRef: sourceRefFor("prospect-promoted", clientId),
  })

  revalidatePath("/leads")
  return { ok: true }
}

export async function archiveLead(
  clientId: string
): Promise<UpdateLeadResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  const { data: existing, error: fetchError } = await supabase
    .from("clients")
    .select("name, status")
    .eq("id", clientId)
    .maybeSingle()
  if (fetchError) return { ok: false, error: fetchError.message }
  if (!existing) return { ok: false, error: "Lead not found" }
  if (existing.status !== "lead") {
    return { ok: false, error: "Only leads can be archived here" }
  }

  const { error } = await supabase
    .from("clients")
    .update({ status: "archived" })
    .eq("id", clientId)
  if (error) return { ok: false, error: error.message }

  await logActivity({
    supabase,
    clientId,
    loggedBy: auth.user.id,
    type: "note",
    title: `Archived lead — ${existing.name}`,
    sourceRef: sourceRefFor("lead-archived", clientId),
  })

  revalidatePath("/leads")
  return { ok: true }
}

export async function deleteLead(
  clientId: string
): Promise<DeleteLeadResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  const { data: existing, error: fetchError } = await supabase
    .from("clients")
    .select("status")
    .eq("id", clientId)
    .maybeSingle()
  if (fetchError) return { ok: false, error: fetchError.message }
  if (!existing) return { ok: false, error: "Lead not found" }
  if (existing.status !== "lead" && existing.status !== "archived") {
    return {
      ok: false,
      error: "This lead has been converted and can't be removed",
    }
  }

  const { error } = await supabase.from("clients").delete().eq("id", clientId)
  if (error) {
    if (error.code === "23503") {
      return {
        ok: false,
        error: "This lead has linked records — archive it instead",
      }
    }
    return { ok: false, error: error.message }
  }

  revalidatePath("/leads")
  return { ok: true }
}

function buildDealTitle(
  lead: { name: string | null; company: string | null; intent: string | null },
  productLabel: string
) {
  const subject =
    [lead.company, lead.name].filter(Boolean).join(" ▪ ") || "New client"
  return `${subject} — ${productLabel}`
}

export type ConvertLeadInput = {
  productType: ProjectProductType
  soldBy: string
  build: { value: number } | null
  plan: { id: SubscriptionPlanId } | null
}

export type ConvertLeadResult =
  | {
      ok: true
      projectId: string
      subscriptionId: string | null
    }
  | { ok: false; error: string }

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function convertLead(
  clientId: string,
  input: ConvertLeadInput
): Promise<ConvertLeadResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  const products = Constants.public.Enums
    .project_product_type as readonly string[]
  if (!products.includes(input.productType)) {
    return { ok: false, error: "Invalid product type" }
  }

  if (!input.soldBy || !UUID_RE.test(input.soldBy)) {
    return { ok: false, error: "Pick a sales rep for this deal" }
  }

  const { data: rep, error: repError } = await supabase
    .from("profiles")
    .select("id, role, employment_status")
    .eq("id", input.soldBy)
    .maybeSingle()
  if (repError || !rep) {
    return { ok: false, error: repError?.message ?? "Rep not found" }
  }
  if (
    rep.role !== "sales_rep" &&
    rep.role !== "admin" &&
    rep.role !== "editor"
  ) {
    return { ok: false, error: "Selected user cannot be a sales rep" }
  }
  if (rep.employment_status !== "active") {
    return { ok: false, error: "Selected rep is not active" }
  }

  if (!input.build && !input.plan) {
    return {
      ok: false,
      error: "Pick a one-time build, a monthly plan, or both",
    }
  }

  if (input.build) {
    if (!Number.isFinite(input.build.value) || input.build.value <= 0) {
      return { ok: false, error: "One-time value must be greater than 0" }
    }
  }

  if (input.plan && !(input.plan.id in SUBSCRIPTION_PLAN)) {
    return { ok: false, error: "Invalid plan" }
  }

  const { data: lead, error: leadError } = await supabase
    .from("clients")
    .select("name, company, intent")
    .eq("id", clientId)
    .single()
  if (leadError || !lead) {
    return { ok: false, error: leadError?.message ?? "Lead not found" }
  }

  const productLabel = PROJECT_PRODUCT_TITLE[input.productType]
  const title = buildDealTitle(lead, productLabel)

  // Build-only → proposal (deposit gate). Plan-only → active (nothing to build).
  // Both → proposal; subscription is still created but project awaits deposit.
  const stage = input.build ? "proposal" : "active"

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      client_id: clientId,
      title,
      stage,
      sold_by: input.soldBy,
      product_type: input.productType,
      value: input.build ? input.build.value : null,
    })
    .select("id")
    .single()
  if (projectError || !project) {
    return {
      ok: false,
      error: projectError?.message ?? "Failed to create project",
    }
  }

  await seedProjectTasks({
    projectId: project.id,
    productType: input.productType,
    createdBy: auth.user.id,
  })

  let subscriptionId: string | null = null
  if (input.plan) {
    const planConfig = SUBSCRIPTION_PLAN[input.plan.id]
    const today = new Date().toISOString().slice(0, 10)

    const { data: sub, error: subError } = await supabase
      .from("subscriptions")
      .insert({
        client_id: clientId,
        project_id: project.id,
        product: "Website",
        plan: planConfig.label,
        monthly_rate: planConfig.monthlyRate,
        status: "active",
        started_at: today,
        sold_by: input.soldBy,
      })
      .select("id")
      .single()
    if (subError || !sub) {
      return {
        ok: false,
        error: subError?.message ?? "Failed to create subscription",
      }
    }
    subscriptionId = sub.id
  }

  // Client becomes active as soon as a recurring plan is attached; otherwise
  // they're in proposal for a one-time build and count as qualified. Also
  // claim the client for the selected rep so downstream flows (Stripe
  // checkout metadata, commissions) have a concrete owner.
  await supabase
    .from("clients")
    .update({
      status: input.plan ? "active_client" : "qualified",
      assigned_to: input.soldBy,
    })
    .eq("id", clientId)

  await logActivity({
    supabase,
    clientId,
    loggedBy: auth.user.id,
    type: "follow_up",
    title: `Converted lead — ${productLabel}`,
    content: input.build
      ? `One-time build at $${input.build.value.toLocaleString()}${input.plan ? ` + ${SUBSCRIPTION_PLAN[input.plan.id].label} plan` : ""}`
      : input.plan
        ? `${SUBSCRIPTION_PLAN[input.plan.id].label} plan ($${SUBSCRIPTION_PLAN[input.plan.id].monthlyRate}/mo)`
        : null,
    projectId: project.id,
    sourceRef: sourceRefFor("lead-converted", project.id),
  })

  revalidatePath("/leads")
  revalidatePath("/pipeline")
  revalidatePath("/projects")
  if (input.plan) revalidatePath("/clients")
  return { ok: true, projectId: project.id, subscriptionId }
}

