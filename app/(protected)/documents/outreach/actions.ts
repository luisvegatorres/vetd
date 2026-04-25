"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type SaveOutreachTemplateResult =
  | { ok: true; templateId: string }
  | { ok: false; error: string }

export type ArchiveOutreachTemplateResult =
  | { ok: true }
  | { ok: false; error: string }

async function requireStaff() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false as const, error: "Not authenticated" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle()
  const role = profile?.role
  if (role !== "admin" && role !== "editor") {
    return { ok: false as const, error: "Only admins or editors can manage templates" }
  }
  return { ok: true as const, supabase, userId: auth.user.id }
}

function parseFields(formData: FormData) {
  const str = (key: string, max = 2000) => {
    const v = String(formData.get(key) ?? "").trim()
    return v.length > 0 ? v.slice(0, max) : null
  }

  const businessType = str("business_type", 80)
  const label = str("label", 120)
  const subject = str("subject", 200)
  const body = String(formData.get("body") ?? "").trim()
  const referenceUrl = str("reference_url", 500)
  const referenceLabel = str("reference_label", 120)
  const sortOrderRaw = String(formData.get("sort_order") ?? "0")
  const sortOrder = Number.parseInt(sortOrderRaw, 10)

  return {
    businessType,
    label,
    subject,
    body: body.length > 0 ? body : null,
    referenceUrl,
    referenceLabel,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
  }
}

export async function createOutreachTemplate(
  formData: FormData,
): Promise<SaveOutreachTemplateResult> {
  const gate = await requireStaff()
  if (!gate.ok) return gate

  const fields = parseFields(formData)
  if (!fields.businessType) return { ok: false, error: "Business type is required" }
  if (!fields.label) return { ok: false, error: "Label is required" }
  if (!fields.subject) return { ok: false, error: "Subject is required" }
  if (!fields.body) return { ok: false, error: "Body is required" }

  const { data, error } = await gate.supabase
    .from("outreach_templates")
    .insert({
      business_type: fields.businessType,
      label: fields.label,
      subject: fields.subject,
      body: fields.body,
      reference_url: fields.referenceUrl,
      reference_label: fields.referenceLabel,
      sort_order: fields.sortOrder,
      created_by: gate.userId,
    })
    .select("id")
    .single()

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to create template" }
  }

  revalidatePath("/documents")
  revalidatePath("/leads")
  return { ok: true, templateId: data.id }
}

export async function updateOutreachTemplate(
  id: string,
  formData: FormData,
): Promise<SaveOutreachTemplateResult> {
  if (!UUID_RE.test(id)) return { ok: false, error: "Invalid template id" }

  const gate = await requireStaff()
  if (!gate.ok) return gate

  const fields = parseFields(formData)
  if (!fields.businessType) return { ok: false, error: "Business type is required" }
  if (!fields.label) return { ok: false, error: "Label is required" }
  if (!fields.subject) return { ok: false, error: "Subject is required" }
  if (!fields.body) return { ok: false, error: "Body is required" }

  const { error } = await gate.supabase
    .from("outreach_templates")
    .update({
      business_type: fields.businessType,
      label: fields.label,
      subject: fields.subject,
      body: fields.body,
      reference_url: fields.referenceUrl,
      reference_label: fields.referenceLabel,
      sort_order: fields.sortOrder,
    })
    .eq("id", id)

  if (error) return { ok: false, error: error.message }

  revalidatePath("/documents")
  revalidatePath(`/documents/outreach/${id}`)
  revalidatePath("/leads")
  return { ok: true, templateId: id }
}

export async function archiveOutreachTemplate(
  id: string,
): Promise<ArchiveOutreachTemplateResult> {
  if (!UUID_RE.test(id)) return { ok: false, error: "Invalid template id" }

  const gate = await requireStaff()
  if (!gate.ok) return gate

  const { error } = await gate.supabase
    .from("outreach_templates")
    .update({ is_archived: true })
    .eq("id", id)

  if (error) return { ok: false, error: error.message }

  revalidatePath("/documents")
  revalidatePath("/leads")
  return { ok: true }
}

export async function restoreOutreachTemplate(
  id: string,
): Promise<ArchiveOutreachTemplateResult> {
  if (!UUID_RE.test(id)) return { ok: false, error: "Invalid template id" }

  const gate = await requireStaff()
  if (!gate.ok) return gate

  const { error } = await gate.supabase
    .from("outreach_templates")
    .update({ is_archived: false })
    .eq("id", id)

  if (error) return { ok: false, error: error.message }

  revalidatePath("/documents")
  revalidatePath("/leads")
  return { ok: true }
}
