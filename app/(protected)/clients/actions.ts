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
  return v.replace(/\b(\p{Ll})/gu, (c) => c.toUpperCase())
}

export async function createNewClient(
  formData: FormData,
): Promise<CreateClientResult> {
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
    : "active_client"

  const rawCompany = str("company")
  const rawIndustry = str("industry")
  const industry =
    rawIndustry && (INDUSTRY_OPTIONS as readonly string[]).includes(rawIndustry)
      ? rawIndustry
      : null

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
      assigned_to: auth.user.id,
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

  const { error } = await supabase
    .from("clients")
    .update({
      name,
      company: rawCompany ? titleCase(rawCompany) : null,
      email,
      phone: str("phone"),
      industry,
      location: str("location"),
      notes: str("notes"),
      status,
    })
    .eq("id", clientId)

  if (error) return { ok: false, error: error.message }

  revalidatePath("/clients")
  return { ok: true }
}
