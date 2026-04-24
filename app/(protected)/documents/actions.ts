"use server"

import { revalidatePath } from "next/cache"

import { extractTokens, isDocumentBody } from "@/lib/documents/blocks"
import {
  getDocumentDownloadUrl,
  getDocumentWorkingBody,
  regenerateDocumentFromTemplate,
  rerenderDocumentWithBody,
  renderDocument,
} from "@/lib/documents/render"
import {
  documentEmail,
  type DocumentEmailKind,
} from "@/lib/email/templates"
import { sendGmailAsRep } from "@/lib/google/gmail-send"
import { logActivity, sourceRefFor } from "@/lib/interactions/log-activity"
import { createAdminClient } from "@/lib/supabase/admin"
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

export async function updateDocumentBodyAction(
  documentId: string,
  bodyRaw: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!UUID_RE.test(documentId)) {
    return { ok: false, error: "Invalid document id" }
  }
  let body: unknown
  try {
    body = JSON.parse(bodyRaw)
  } catch {
    return { ok: false, error: "Body must be valid JSON" }
  }
  if (!isDocumentBody(body)) {
    return { ok: false, error: "Body is not a valid block array" }
  }
  const res = await rerenderDocumentWithBody({ documentId, body })
  if (!res.ok) return res
  revalidatePath(`/documents/${documentId}`)
  return { ok: true }
}

export async function regenerateDocumentAction(
  documentId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!UUID_RE.test(documentId)) {
    return { ok: false, error: "Invalid document id" }
  }
  const res = await regenerateDocumentFromTemplate(documentId)
  if (!res.ok) return res
  revalidatePath(`/documents/${documentId}`)
  return { ok: true }
}

export async function getDocumentWorkingBodyAction(
  documentId: string,
): Promise<
  | { ok: true; body: unknown; source: "edited" | "template" }
  | { ok: false; error: string }
> {
  if (!UUID_RE.test(documentId)) {
    return { ok: false, error: "Invalid document id" }
  }
  return getDocumentWorkingBody(documentId)
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

export type SendDocumentResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string; code?: "scope_missing" | "auth_expired" }

function sanitizeFilename(value: string): string {
  const trimmed = value.trim().slice(0, 80) || "Document"
  return trimmed.replace(/[\\/:*?"<>|]+/g, "-")
}

const DOCUMENT_EMAIL_KINDS: DocumentEmailKind[] = [
  "proposal",
  "contract",
  "sow",
  "nda",
  "invoice_terms",
]

export async function sendDocumentAction(input: {
  documentId: string
  message?: string | null
}): Promise<SendDocumentResult> {
  if (!UUID_RE.test(input.documentId)) {
    return { ok: false, error: "Invalid document id" }
  }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  const docRes = await supabase
    .from("documents")
    .select(
      `
        id, title, kind, status, pdf_path, client_id, project_id,
        client:clients!documents_client_id_fkey (id, name, email),
        project:projects!documents_project_id_fkey (id, title)
      `,
    )
    .eq("id", input.documentId)
    .maybeSingle()

  if (docRes.error || !docRes.data) {
    return { ok: false, error: "Document not found" }
  }
  const doc = docRes.data

  if (!doc.pdf_path) {
    return { ok: false, error: "This document has no PDF yet. Generate it first." }
  }
  if (doc.status === "sent") {
    return {
      ok: false,
      error: "This document was already sent. Regenerate it to send again.",
    }
  }
  if (!DOCUMENT_EMAIL_KINDS.includes(doc.kind)) {
    return { ok: false, error: `Cannot email documents of kind "${doc.kind}"` }
  }

  const client = Array.isArray(doc.client) ? doc.client[0] : doc.client
  if (!client?.email) {
    return {
      ok: false,
      error: "Client has no email. Add one before sending.",
    }
  }

  const repId = auth.user.id

  // Resolve rep name + their Google email to stamp the From header. The
  // `google_email` on rep_integrations is what Google will actually send as
  // (it ignores any other From address). Fall back to profile name.
  const admin = createAdminClient()
  const [repProfileRes, repIntegrationRes] = await Promise.all([
    admin
      .from("profiles")
      .select("full_name")
      .eq("id", repId)
      .maybeSingle(),
    admin
      .from("rep_integrations")
      .select("google_email")
      .eq("rep_id", repId)
      .eq("provider", "google")
      .maybeSingle(),
  ])

  const repName =
    repProfileRes.data?.full_name ?? auth.user.email ?? "Your Vetd rep"
  const fromEmail =
    repIntegrationRes.data?.google_email ?? auth.user.email ?? ""
  if (!fromEmail) {
    return {
      ok: false,
      error: "Connect Google from Settings before sending documents.",
      code: "scope_missing",
    }
  }

  // Download the PDF buffer directly from the private bucket via the admin
  // client (RLS-bound clients can't read storage.objects for this bucket).
  const pdfDownload = await admin.storage
    .from("documents")
    .download(doc.pdf_path)
  if (pdfDownload.error || !pdfDownload.data) {
    return {
      ok: false,
      error: pdfDownload.error?.message ?? "Could not load PDF",
    }
  }
  const pdfBuffer = Buffer.from(await pdfDownload.data.arrayBuffer())

  const attachmentFilename = `${sanitizeFilename(doc.title)}.pdf`

  const projectObj = Array.isArray(doc.project) ? doc.project[0] : doc.project
  const projectTitle = projectObj?.title ?? null

  const rendered = await documentEmail({
    kind: doc.kind as DocumentEmailKind,
    documentTitle: doc.title,
    clientName: client.name,
    repName,
    projectTitle,
    message: input.message,
  })

  const sendResult = await sendGmailAsRep({
    repId,
    to: client.email,
    fromEmail,
    fromName: repName,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    attachments: [
      {
        filename: attachmentFilename,
        content: pdfBuffer,
        mimeType: "application/pdf",
      },
    ],
  })

  if (!sendResult.ok) {
    return {
      ok: false,
      error: sendResult.error,
      ...(sendResult.code ? { code: sendResult.code } : {}),
    }
  }

  const now = new Date().toISOString()
  const { error: updateError } = await supabase
    .from("documents")
    .update({ status: "sent", sent_at: now })
    .eq("id", doc.id)
  if (updateError) {
    console.error("[sendDocumentAction] mark sent failed", updateError)
  }

  await logActivity({
    supabase,
    clientId: doc.client_id,
    loggedBy: repId,
    type: "email",
    title: `Emailed ${doc.kind.replace(/_/g, " ")}: ${doc.title}`,
    content: `Sent to ${client.email} from ${fromEmail}`,
    projectId: doc.project_id,
    sourceRef: sourceRefFor("gmail-send", "document", doc.id, sendResult.messageId),
  })

  revalidatePath("/documents")
  revalidatePath(`/documents/${doc.id}`)
  if (doc.project_id) revalidatePath(`/projects/${doc.project_id}`)
  revalidatePath(`/clients/${doc.client_id}`)

  return { ok: true, messageId: sendResult.messageId }
}
