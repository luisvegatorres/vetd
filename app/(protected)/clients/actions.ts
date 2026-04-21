"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { INDUSTRY_OPTIONS } from "@/lib/industries"
import { Constants, type Database } from "@/lib/supabase/types"

type ClientStatus = Database["public"]["Enums"]["client_status"]

export type CreateClientResult =
  | { ok: true; clientId: string }
  | { ok: false; error: string }

export type UpdateClientResult =
  | { ok: true }
  | { ok: false; error: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function titleCase(v: string) {
  return v.replace(
    /(^|\s)(\p{Ll})/gu,
    (_, pre, c) => pre + c.toLocaleUpperCase(),
  )
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function parseAssignedTo(formData: FormData): string | null | undefined {
  if (!formData.has("assigned_to")) return undefined
  const raw = String(formData.get("assigned_to") ?? "").trim()
  if (!raw || raw === "__unassigned__") return null
  return UUID_RE.test(raw) ? raw : undefined
}

export async function createNewClient(
  formData: FormData,
): Promise<CreateClientResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle()
  const canReassign = me?.role === "admin" || me?.role === "editor"

  const name = titleCase(String(formData.get("name") ?? "").trim())
  if (!name) return { ok: false, error: "Name is required" }

  const str = (key: string) => {
    const v = String(formData.get(key) ?? "").trim()
    return v.length > 0 ? v : null
  }

  const email = str("email")
  if (email && !EMAIL_RE.test(email)) {
    return { ok: false, error: "Enter a valid email address" }
  }

  const statusRaw = String(formData.get("status") ?? "")
  const statuses = Constants.public.Enums.client_status as readonly string[]
  const status: ClientStatus = statuses.includes(statusRaw)
    ? (statusRaw as ClientStatus)
    : "active_client"

  const rawCompany = str("company")
  const rawIndustry = str("industry")
  const industry =
    rawIndustry && (INDUSTRY_OPTIONS as readonly string[]).includes(rawIndustry)
      ? rawIndustry
      : null

  const assignedOverride = canReassign ? parseAssignedTo(formData) : undefined
  const assignedTo =
    assignedOverride !== undefined ? assignedOverride : auth.user.id

  const { data, error } = await supabase
    .from("clients")
    .insert({
      name,
      company: rawCompany ? titleCase(rawCompany) : null,
      email,
      phone: str("phone"),
      industry,
      location: str("location"),
      notes: str("notes"),
      status,
      assigned_to: assignedTo,
    })
    .select("id")
    .single()

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to create client" }
  }

  revalidatePath("/clients")
  return { ok: true, clientId: data.id }
}

export async function updateClient(
  clientId: string,
  formData: FormData,
): Promise<UpdateClientResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  const name = titleCase(String(formData.get("name") ?? "").trim())
  if (!name) return { ok: false, error: "Name is required" }

  const str = (key: string) => {
    const v = String(formData.get(key) ?? "").trim()
    return v.length > 0 ? v : null
  }

  const email = str("email")
  if (email && !EMAIL_RE.test(email)) {
    return { ok: false, error: "Enter a valid email address" }
  }

  const statusRaw = String(formData.get("status") ?? "")
  const statuses = Constants.public.Enums.client_status as readonly string[]
  const status: ClientStatus = statuses.includes(statusRaw)
    ? (statusRaw as ClientStatus)
    : "lead"

  const rawCompany = str("company")
  const rawIndustry = str("industry")
  const industry =
    rawIndustry && (INDUSTRY_OPTIONS as readonly string[]).includes(rawIndustry)
      ? rawIndustry
      : null

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle()
  const canReassign = me?.role === "admin" || me?.role === "editor"

  const assignedOverride = canReassign ? parseAssignedTo(formData) : undefined

  const updatePayload: {
    name: string
    company: string | null
    email: string | null
    phone: string | null
    industry: string | null
    location: string | null
    notes: string | null
    status: ClientStatus
    assigned_to?: string | null
  } = {
    name,
    company: rawCompany ? titleCase(rawCompany) : null,
    email,
    phone: str("phone"),
    industry,
    location: str("location"),
    notes: str("notes"),
    status,
  }
  if (assignedOverride !== undefined) {
    updatePayload.assigned_to = assignedOverride
  }

  const { data: existing } = await supabase
    .from("clients")
    .select("assigned_to")
    .eq("id", clientId)
    .maybeSingle()

  const { error } = await supabase
    .from("clients")
    .update(updatePayload)
    .eq("id", clientId)

  if (error) return { ok: false, error: error.message }

  // When an admin/editor reassigns the client, carry the ownership through to
  // the client's open deals so `sold_by` (and therefore commission) stays in
  // sync with the rep who now owns the relationship.
  if (
    assignedOverride !== undefined
    && existing?.assigned_to !== assignedOverride
  ) {
    const [projectsUpdate, subsUpdate] = await Promise.all([
      supabase
        .from("projects")
        .update({ sold_by: assignedOverride })
        .eq("client_id", clientId),
      supabase
        .from("subscriptions")
        .update({ sold_by: assignedOverride })
        .eq("client_id", clientId),
    ])
    if (projectsUpdate.error) {
      return { ok: false, error: projectsUpdate.error.message }
    }
    if (subsUpdate.error) {
      return { ok: false, error: subsUpdate.error.message }
    }
    revalidatePath("/pipeline")
    revalidatePath("/projects")
    revalidatePath("/commissions")
  }

  revalidatePath("/clients")
  return { ok: true }
}
