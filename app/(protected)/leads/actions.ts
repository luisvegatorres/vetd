"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { Constants, type Database } from "@/lib/supabase/types"

type ClientSource = Database["public"]["Enums"]["client_source"]

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

export async function convertLeadToDeal(clientId: string) {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error("Not authenticated")

  const { data: lead, error: leadError } = await supabase
    .from("clients")
    .select("name, company, intent")
    .eq("id", clientId)
    .single()
  if (leadError || !lead) throw new Error(leadError?.message ?? "Lead not found")

  const title =
    lead.intent?.trim() ||
    [lead.company, lead.name].filter(Boolean).join(" · ") ||
    "New deal"

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      client_id: clientId,
      title,
      stage: "proposal",
      sold_by: auth.user.id,
    })
    .select("id")
    .single()
  if (projectError || !project)
    throw new Error(projectError?.message ?? "Failed to create project")

  await supabase
    .from("clients")
    .update({ status: "qualified" })
    .eq("id", clientId)

  revalidatePath("/leads")
  revalidatePath("/pipeline")
  redirect(`/pipeline?project=${project.id}`)
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
