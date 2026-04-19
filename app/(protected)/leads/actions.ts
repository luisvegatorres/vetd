"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { Constants, type Database } from "@/lib/supabase/types"

type ClientSource = Database["public"]["Enums"]["client_source"]
type ProjectProductType =
  Database["public"]["Enums"]["project_product_type"]

const PROJECT_PRODUCT_TITLE: Record<ProjectProductType, string> = {
  business_website: "Website",
  mobile_app: "Mobile App",
  web_app: "SaaS Product",
  ai_integration: "AI Integration",
}

type SubscriptionPlan = "presence" | "growth"
const SUBSCRIPTION_PLAN_RATE: Record<SubscriptionPlan, number> = {
  presence: 97,
  growth: 247,
}

export type CreateLeadResult =
  | { ok: true; leadId: string }
  | { ok: false; error: string }

export type UpdateLeadResult =
  | { ok: true }
  | { ok: false; error: string }

function titleCase(v: string) {
  return v.replace(/\b(\p{Ll})/gu, (c) => c.toUpperCase())
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function createLead(
  formData: FormData,
): Promise<CreateLeadResult> {
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

  const { data, error } = await supabase
    .from("clients")
    .insert({
      name,
      company: rawCompany ? titleCase(rawCompany) : null,
      email,
      phone: str("phone"),
      budget: str("budget"),
      intent: str("intent"),
      notes: str("notes"),
      source,
      status: "lead",
      assigned_to: auth.user.id,
    })
    .select("id")
    .single()

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to create lead" }
  }

  revalidatePath("/leads")
  return { ok: true, leadId: data.id }
}

export async function updateLead(
  clientId: string,
  formData: FormData,
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
      budget: str("budget"),
      intent: str("intent"),
      notes: str("notes"),
      source,
    })
    .eq("id", clientId)

  if (error) return { ok: false, error: error.message }

  revalidatePath("/leads")
  return { ok: true }
}

function buildDealTitle(
  lead: { name: string | null; company: string | null; intent: string | null },
  productLabel: string,
) {
  const subject =
    [lead.company, lead.name].filter(Boolean).join(" ▪ ") || "New client"
  return `${subject} — ${productLabel}`
}

export type ConvertToProjectResult =
  | { ok: true; projectId: string }
  | { ok: false; error: string }

export async function convertLeadToProject(
  clientId: string,
  input: { productType: ProjectProductType; value: number },
): Promise<ConvertToProjectResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  const products = Constants.public.Enums
    .project_product_type as readonly string[]
  if (!products.includes(input.productType)) {
    return { ok: false, error: "Invalid product type" }
  }
  if (!Number.isFinite(input.value) || input.value <= 0) {
    return { ok: false, error: "Project value must be greater than 0" }
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

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      client_id: clientId,
      title,
      stage: "proposal",
      sold_by: auth.user.id,
      product_type: input.productType,
      value: input.value,
    })
    .select("id")
    .single()
  if (projectError || !project) {
    return {
      ok: false,
      error: projectError?.message ?? "Failed to create project",
    }
  }

  await supabase
    .from("clients")
    .update({ status: "qualified" })
    .eq("id", clientId)

  revalidatePath("/leads")
  revalidatePath("/pipeline")
  revalidatePath("/projects")
  return { ok: true, projectId: project.id }
}

export type ConvertToSubscriptionResult =
  | { ok: true; subscriptionId: string }
  | { ok: false; error: string }

export async function convertLeadToSubscription(
  clientId: string,
  input: { plan: SubscriptionPlan },
): Promise<ConvertToSubscriptionResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  if (!(input.plan in SUBSCRIPTION_PLAN_RATE)) {
    return { ok: false, error: "Invalid plan" }
  }
  const monthlyRate = SUBSCRIPTION_PLAN_RATE[input.plan]
  const planLabel = input.plan === "presence" ? "Presence" : "Growth"

  const today = new Date().toISOString().slice(0, 10)

  const { data: sub, error: subError } = await supabase
    .from("subscriptions")
    .insert({
      client_id: clientId,
      product: "growth-system",
      plan: planLabel,
      monthly_rate: monthlyRate,
      status: "active",
      started_at: today,
      sold_by: auth.user.id,
    })
    .select("id")
    .single()
  if (subError || !sub) {
    return {
      ok: false,
      error: subError?.message ?? "Failed to create subscription",
    }
  }

  await supabase
    .from("clients")
    .update({ status: "active_client" })
    .eq("id", clientId)

  revalidatePath("/leads")
  revalidatePath("/clients")
  return { ok: true, subscriptionId: sub.id }
}


export async function claimLead(clientId: string) {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error("Not authenticated")

  const { error } = await supabase
    .from("clients")
    .update({ assigned_to: auth.user.id })
    .eq("id", clientId)
  if (error) throw new Error(error.message)

  revalidatePath("/leads")
}
