import { notFound } from "next/navigation"

import { DocumentDetailView } from "@/components/documents/document-detail-view"
import {
  BreadcrumbCurrentPortal,
  BreadcrumbParentPortal,
} from "@/components/layout/breadcrumb-current-portal"
import { getDocumentWorkingBody } from "@/lib/documents/render"
import { createClient } from "@/lib/supabase/server"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()

  const supabase = await createClient()
  const { data } = await supabase
    .from("documents")
    .select(
      `
        id, title, kind, status, pdf_path, data, created_at, sent_at, signed_at,
        client:clients!documents_client_id_fkey (id, name, company),
        project:projects!documents_project_id_fkey (id, title),
        template:document_templates!documents_template_id_fkey (id, name, version)
      `,
    )
    .eq("id", id)
    .maybeSingle()

  if (!data) notFound()

  const client = Array.isArray(data.client) ? data.client[0] : data.client
  const project = Array.isArray(data.project) ? data.project[0] : data.project
  const template = Array.isArray(data.template)
    ? data.template[0]
    : data.template

  // Resolve the working body (edited-for-this-doc OR freshly resolved from
  // the template). Done here so the edit-mode editor can seed immediately
  // without a round-trip click.
  const working = await getDocumentWorkingBody(data.id)
  const initialBody = working.ok
    ? JSON.stringify(working.body, null, 2)
    : "[]"
  const bodySource = working.ok ? working.source : "template"

  return (
    <>
      <BreadcrumbParentPortal>Generated</BreadcrumbParentPortal>
      <BreadcrumbCurrentPortal>{data.title}</BreadcrumbCurrentPortal>

      <DocumentDetailView
        doc={{
          id: data.id,
          title: data.title,
          status: data.status,
          hasPdf: Boolean(data.pdf_path),
          templateLinked: Boolean(template?.id),
          initialBody,
          bodySource,
          createdAt: data.created_at,
          sentAt: data.sent_at,
          signedAt: data.signed_at,
          client: client
            ? { id: client.id, label: client.company || client.name }
            : null,
          project: project
            ? { id: project.id, label: project.title }
            : null,
          template: template
            ? {
                id: template.id,
                label: `${template.name} (v${template.version})`,
              }
            : null,
        }}
      />
    </>
  )
}
