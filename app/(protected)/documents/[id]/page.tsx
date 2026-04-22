import Link from "next/link"
import { notFound } from "next/navigation"

import { DocumentActions } from "@/components/documents/document-actions"
import {
  BreadcrumbCurrentPortal,
  BreadcrumbParentPortal,
} from "@/components/layout/breadcrumb-current-portal"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  signed: "Signed",
  void: "Void",
}

function fmt(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

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

  return (
    <div className="space-y-10">
      <BreadcrumbParentPortal>Generated</BreadcrumbParentPortal>
      <BreadcrumbCurrentPortal>{data.title}</BreadcrumbCurrentPortal>

      <div className="flex items-center justify-end">
        <DocumentActions
          documentId={data.id}
          status={data.status}
          hasPdf={Boolean(data.pdf_path)}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="border border-border/60 p-6">
          <p className="text-overline mb-4 font-medium uppercase text-muted-foreground">
            Details
          </p>
          <dl className="space-y-3 text-sm">
            <DetailRow label="Status">
              <Badge variant="outline" className="uppercase">
                {STATUS_LABEL[data.status] ?? data.status}
              </Badge>
            </DetailRow>
            <DetailRow label="Client">
              {client ? (
                <Link
                  href={`/clients/${client.id}`}
                  className="hover:underline"
                >
                  {client.company || client.name}
                </Link>
              ) : (
                "—"
              )}
            </DetailRow>
            <DetailRow label="Project">
              {project ? (
                <Link
                  href={`/projects/${project.id}`}
                  className="hover:underline"
                >
                  {project.title}
                </Link>
              ) : (
                "—"
              )}
            </DetailRow>
            <DetailRow label="Template">
              {template
                ? `${template.name} (v${template.version})`
                : "— (template deleted)"}
            </DetailRow>
            <DetailRow label="Created">{fmt(data.created_at)}</DetailRow>
            <DetailRow label="Sent">{fmt(data.sent_at)}</DetailRow>
            <DetailRow label="Signed">{fmt(data.signed_at)}</DetailRow>
          </dl>
        </section>

        <section className="border border-border/60 p-6">
          <p className="text-overline mb-4 font-medium uppercase text-muted-foreground">
            Snapshot data
          </p>
          <pre className="max-h-96 overflow-auto font-mono text-xs text-muted-foreground">
            {JSON.stringify(data.data, null, 2)}
          </pre>
        </section>
      </div>
    </div>
  )
}

function DetailRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-xs text-muted-foreground uppercase">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}
