import "server-only"

import { renderToBuffer } from "@react-pdf/renderer"

import { site } from "@/lib/site"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient as createServerClient } from "@/lib/supabase/server"

import { isDocumentBody, type DocumentBody } from "./blocks"
import { buildDocumentContext } from "./context"
import { DocumentPDF } from "./pdf"
import { resolveBody, resolveString } from "./tokens"

export type RenderDocumentInput = {
  templateId: string
  clientId: string
  projectId?: string | null
  subscriptionId?: string | null
  /** Optional title override; defaults to the template name. */
  titleOverride?: string | null
}

export type RenderDocumentResult =
  | { ok: true; documentId: string; pdfPath: string }
  | { ok: false; error: string }

/**
 * Generate a PDF from a template + client/project context, upload it to
 * Supabase Storage, and insert a row in public.documents snapshotting the
 * resolved data. Storage upload needs the service-role key; the insert runs
 * via the caller's RLS-bound client so visibility follows client scope.
 */
export async function renderDocument(
  input: RenderDocumentInput,
): Promise<RenderDocumentResult> {
  const supabase = await createServerClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  const templateRes = await supabase
    .from("document_templates")
    .select("id, name, kind, version, body, is_active")
    .eq("id", input.templateId)
    .maybeSingle()

  if (templateRes.error || !templateRes.data) {
    return { ok: false, error: "Template not found" }
  }
  if (!templateRes.data.is_active) {
    return { ok: false, error: "Template is inactive" }
  }

  const body = templateRes.data.body as unknown
  if (!isDocumentBody(body)) {
    return { ok: false, error: "Template body is malformed" }
  }

  const context = await buildDocumentContext({
    supabase,
    clientId: input.clientId,
    projectId: input.projectId ?? null,
    subscriptionId: input.subscriptionId ?? null,
  })

  const resolvedBody: DocumentBody = resolveBody(body, context)
  const title =
    input.titleOverride ??
    resolveString(templateRes.data.name, context) ??
    templateRes.data.name

  const clientObj = (context.client ?? {}) as Record<string, string>
  const subtitle = [clientObj.business, String(context.today_long ?? "")]
    .filter(Boolean)
    .join(" • ")

  const pdfBuffer = await renderToBuffer(
    DocumentPDF({ title, brand: site.name, subtitle, body: resolvedBody }),
  )

  const insertRes = await supabase
    .from("documents")
    .insert({
      template_id: templateRes.data.id,
      template_version: templateRes.data.version,
      kind: templateRes.data.kind,
      title,
      client_id: input.clientId,
      project_id: input.projectId ?? null,
      subscription_id: input.subscriptionId ?? null,
      data: context,
      status: "draft",
      created_by: auth.user.id,
    })
    .select("id")
    .single()

  if (insertRes.error || !insertRes.data) {
    return {
      ok: false,
      error: insertRes.error?.message ?? "Failed to create document record",
    }
  }

  const documentId = insertRes.data.id
  const pdfPath = `${input.clientId}/${documentId}.pdf`

  const admin = createAdminClient()
  const uploadRes = await admin.storage
    .from("documents")
    .upload(pdfPath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    })

  if (uploadRes.error) {
    // Clean up the orphaned row so the admin doesn't see a doc row with no PDF.
    await supabase.from("documents").delete().eq("id", documentId)
    return { ok: false, error: uploadRes.error.message }
  }

  const updateRes = await supabase
    .from("documents")
    .update({ pdf_path: pdfPath })
    .eq("id", documentId)

  if (updateRes.error) {
    return { ok: false, error: updateRes.error.message }
  }

  return { ok: true, documentId, pdfPath }
}

/**
 * Re-render an existing document with an already-resolved body. Used by the
 * detail-page fork-and-edit flow: the resolved body is edited in place and
 * the PDF regenerated against the original context snapshot (documents.data).
 *
 * Writes the edited body under `data._edits.body` so future regenerates can
 * tell "has this been customized" and optionally revert.
 */
export async function rerenderDocumentWithBody(input: {
  documentId: string
  body: DocumentBody
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createServerClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  const docRes = await supabase
    .from("documents")
    .select("id, title, client_id, pdf_path, data")
    .eq("id", input.documentId)
    .maybeSingle()
  if (docRes.error || !docRes.data) {
    return { ok: false, error: "Document not found" }
  }

  const context = (docRes.data.data ?? {}) as Record<string, unknown>
  const clientObj = (context.client ?? {}) as Record<string, string>
  const subtitle = [clientObj.business, String(context.today_long ?? "")]
    .filter(Boolean)
    .join(" • ")

  const pdfBuffer = await renderToBuffer(
    DocumentPDF({
      title: docRes.data.title,
      brand: site.name,
      subtitle,
      body: input.body,
    }),
  )

  const pdfPath =
    docRes.data.pdf_path ?? `${docRes.data.client_id}/${docRes.data.id}.pdf`

  const admin = createAdminClient()
  const uploadRes = await admin.storage
    .from("documents")
    .upload(pdfPath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    })
  if (uploadRes.error) return { ok: false, error: uploadRes.error.message }

  const existingEdits =
    typeof context._edits === "object" && context._edits !== null
      ? (context._edits as Record<string, unknown>)
      : {}
  const nextData = {
    ...context,
    _edits: { ...existingEdits, body: input.body },
  }

  const updateRes = await supabase
    .from("documents")
    .update({ pdf_path: pdfPath, data: nextData })
    .eq("id", input.documentId)
  if (updateRes.error) return { ok: false, error: updateRes.error.message }

  return { ok: true }
}

/**
 * Re-render a document from the current template body. Picks up template
 * edits made since the doc was first generated. Clears any per-doc body edits.
 */
export async function regenerateDocumentFromTemplate(
  documentId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createServerClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  const docRes = await supabase
    .from("documents")
    .select(
      "id, title, client_id, pdf_path, data, template_id, template_version",
    )
    .eq("id", documentId)
    .maybeSingle()
  if (docRes.error || !docRes.data) {
    return { ok: false, error: "Document not found" }
  }
  if (!docRes.data.template_id) {
    return { ok: false, error: "Document has no linked template to regenerate from" }
  }

  const templateRes = await supabase
    .from("document_templates")
    .select("id, body, version")
    .eq("id", docRes.data.template_id)
    .maybeSingle()
  if (templateRes.error || !templateRes.data) {
    return { ok: false, error: "Linked template not found" }
  }
  const rawBody = templateRes.data.body as unknown
  if (!isDocumentBody(rawBody)) {
    return { ok: false, error: "Template body is malformed" }
  }

  const context = (docRes.data.data ?? {}) as Record<string, unknown>
  const resolvedBody = resolveBody(rawBody, context)
  const clientObj = (context.client ?? {}) as Record<string, string>
  const subtitle = [clientObj.business, String(context.today_long ?? "")]
    .filter(Boolean)
    .join(" • ")

  const pdfBuffer = await renderToBuffer(
    DocumentPDF({
      title: docRes.data.title,
      brand: site.name,
      subtitle,
      body: resolvedBody,
    }),
  )

  const pdfPath =
    docRes.data.pdf_path ?? `${docRes.data.client_id}/${docRes.data.id}.pdf`

  const admin = createAdminClient()
  const uploadRes = await admin.storage
    .from("documents")
    .upload(pdfPath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    })
  if (uploadRes.error) return { ok: false, error: uploadRes.error.message }

  // Drop any per-doc body edits; the user just asked for the template's version.
  const { _edits: _ignored, ...contextWithoutEdits } = context
  void _ignored

  const updateRes = await supabase
    .from("documents")
    .update({
      pdf_path: pdfPath,
      data: contextWithoutEdits,
      template_version: templateRes.data.version,
    })
    .eq("id", documentId)
  if (updateRes.error) return { ok: false, error: updateRes.error.message }

  return { ok: true }
}

/**
 * The current working body for a document: either the per-doc edited body
 * stored under `data._edits.body`, or the template body resolved against
 * `data`. Callers use this to seed the edit-mode code editor.
 */
export async function getDocumentWorkingBody(
  documentId: string,
): Promise<{ ok: true; body: DocumentBody; source: "edited" | "template" } | { ok: false; error: string }> {
  const supabase = await createServerClient()

  const docRes = await supabase
    .from("documents")
    .select("data, template_id")
    .eq("id", documentId)
    .maybeSingle()
  if (docRes.error || !docRes.data) {
    return { ok: false, error: "Document not found" }
  }

  const context = (docRes.data.data ?? {}) as Record<string, unknown>
  const edits =
    typeof context._edits === "object" && context._edits !== null
      ? (context._edits as Record<string, unknown>)
      : null
  const editedBody = edits?.body as unknown
  if (isDocumentBody(editedBody)) {
    return { ok: true, body: editedBody, source: "edited" }
  }

  if (!docRes.data.template_id) {
    return { ok: false, error: "Document has no template and no edited body" }
  }
  const templateRes = await supabase
    .from("document_templates")
    .select("body")
    .eq("id", docRes.data.template_id)
    .maybeSingle()
  if (templateRes.error || !templateRes.data) {
    return { ok: false, error: "Linked template not found" }
  }
  const rawBody = templateRes.data.body as unknown
  if (!isDocumentBody(rawBody)) {
    return { ok: false, error: "Template body is malformed" }
  }
  return { ok: true, body: resolveBody(rawBody, context), source: "template" }
}

/**
 * Returns a short-lived signed URL for an existing document's PDF.
 * Storage is private. We never expose the raw bucket path client-side.
 */
export async function getDocumentDownloadUrl(
  documentId: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("documents")
    .select("pdf_path")
    .eq("id", documentId)
    .maybeSingle()

  if (error || !data?.pdf_path) {
    return { ok: false, error: "Document not found" }
  }

  const admin = createAdminClient()
  const signed = await admin.storage
    .from("documents")
    .createSignedUrl(data.pdf_path, 60 * 10)

  if (signed.error || !signed.data) {
    return { ok: false, error: signed.error?.message ?? "Sign failed" }
  }
  return { ok: true, url: signed.data.signedUrl }
}
