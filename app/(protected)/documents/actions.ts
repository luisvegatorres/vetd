"use server"

import { revalidatePath } from "next/cache"

import { extractTokens, isDocumentBody } from "@/lib/documents/blocks"
import {
  getDocumentDownloadUrl,
  renderDocument,
} from "@/lib/documents/render"
import { createClient } from "@/lib/supabase/server"
import { Constants } from "@/lib/supabase/types"

type DocumentKind = (typeof Constants.public.Enums.document_kind)[number]
type DocumentStatus = (typeof Constants.public.Enums.document_status)[number]

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function parseKind(raw: string): DocumentKind {
  const kinds = Constants.public.Enums.document_kind as readonly string[]
  return kinds.includes(raw) ? (raw as DocumentKind) : "proposal"
}

function parseStatus(raw: string): DocumentStatus {
  const statuses =
    Constants.public.Enums.document_status as readonly string[]
  return statuses.includes(raw) ? (raw as DocumentStatus) : "draft"
}

export type SaveTemplateResult =
  | { ok: true; templateId: string }
  | { ok: false; error: string }

export async function saveTemplate(
  formData: FormData,
): Promise<SaveTemplateResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  const templateId = String(formData.get("template_id") ?? "").trim()
  const name = String(formData.get("name") ?? "").trim()
  const kind = parseKind(String(formData.get("kind") ?? ""))
  const isActive = String(formData.get("is_active") ?? "") === "on"
  const bodyRaw = String(formData.get("body") ?? "[]")

  if (!name) return { ok: false, error: "Name is required" }

  let body: unknown
  try {
    body = JSON.parse(bodyRaw)
  } catch {
    return { ok: false, error: "Body must be valid JSON" }
  }
  if (!isDocumentBody(body)) {
    return { ok: false, error: "Body is not a valid block array" }
  }

  const variables = extractTokens(body)

  if (templateId && UUID_RE.test(templateId)) {
    const { error } = await supabase
      .from("document_templates")
      .update({
        name,
        kind,
        body,
        variables,
        is_active: isActive,
      })
      .eq("id", templateId)
    if (error) return { ok: false, error: error.message }
    revalidatePath("/documents")
    revalidatePath(`/documents/templates/${templateId}`)
    return { ok: true, templateId }
  }

  const { data, error } = await supabase
    .from("document_templates")
    .insert({
      name,
      kind,
      body,
      variables,
      is_active: isActive,
      created_by: auth.user.id,
    })
    .select("id")
    .single()

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to save template" }
  }
  revalidatePath("/documents")
  return { ok: true, templateId: data.id }
}

export type GenerateDocumentResult =
  | { ok: true; documentId: string }
  | { ok: false; error: string }

export async function generateDocumentAction(input: {
  templateId: string
  clientId: string
  projectId?: string | null
  subscriptionId?: string | null
}): Promise<GenerateDocumentResult> {
  if (!UUID_RE.test(input.templateId) || !UUID_RE.test(input.clientId)) {
    return { ok: false, error: "Invalid template or client id" }
  }

  const result = await renderDocument({
    templateId: input.templateId,
    clientId: input.clientId,
    projectId: input.projectId ?? null,
    subscriptionId: input.subscriptionId ?? null,
  })

  if (!result.ok) return result

  revalidatePath("/documents")
  if (input.projectId) revalidatePath(`/projects/${input.projectId}`)
  return { ok: true, documentId: result.documentId }
}

export async function getDownloadUrlAction(
  documentId: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!UUID_RE.test(documentId)) {
    return { ok: false, error: "Invalid document id" }
  }
  return getDocumentDownloadUrl(documentId)
}

export async function updateDocumentStatus(
  documentId: string,
  status: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!UUID_RE.test(documentId)) {
    return { ok: false, error: "Invalid document id" }
  }
  const supabase = await createClient()
  const parsed = parseStatus(status)
  const now = new Date().toISOString()
  const patch: Record<string, unknown> = { status: parsed }
  if (parsed === "sent") patch.sent_at = now
  if (parsed === "signed") patch.signed_at = now

  const { error } = await supabase
    .from("documents")
    .update(patch)
    .eq("id", documentId)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/documents")
  return { ok: true }
}
