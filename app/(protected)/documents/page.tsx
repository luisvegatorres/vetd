import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableEmpty,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
} from "@/components/dashboard/data-table"
import { DocumentsTabs } from "@/components/documents/documents-tabs"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"

const KIND_LABEL: Record<string, string> = {
  proposal: "Proposal",
  contract: "Contract",
  sow: "SOW",
  nda: "NDA",
  invoice_terms: "Invoice terms",
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  signed: "Signed",
  void: "Void",
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default async function DocumentsPage() {
  const supabase = await createClient()

  const { data: auth } = await supabase.auth.getUser()
  const { data: profile } = auth.user
    ? await supabase
        .from("profiles")
        .select("role")
        .eq("id", auth.user.id)
        .maybeSingle()
    : { data: null }
  const canManageOutreach =
    profile?.role === "admin" || profile?.role === "editor"

  const [templatesRes, documentsRes, outreachRes] = await Promise.all([
    supabase
      .from("document_templates")
      .select("id, name, kind, version, is_active, updated_at")
      .order("updated_at", { ascending: false }),
    supabase
      .from("documents")
      .select(
        `
          id, title, kind, status, created_at, sent_at, signed_at,
          client:clients!documents_client_id_fkey (id, name, company),
          project:projects!documents_project_id_fkey (id, title)
        `,
      )
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("outreach_templates")
      .select(
        "id, label, business_type, subject, is_archived, sort_order, updated_at",
      )
      .order("sort_order", { ascending: true })
      .order("updated_at", { ascending: false }),
  ])

  const templates = templatesRes.data ?? []
  const documents = documentsRes.data ?? []
  const outreach = outreachRes.data ?? []

  const documentsPanel = (
    <section className="border border-border/60">
      <DataTable cols="minmax(0,1.8fr) minmax(0,0.7fr) minmax(0,1.2fr) minmax(0,0.7fr) minmax(0,0.8fr)">
        <DataTableHeader>
          <DataTableHead>Title</DataTableHead>
          <DataTableHead>Kind</DataTableHead>
          <DataTableHead>Client</DataTableHead>
          <DataTableHead>Status</DataTableHead>
          <DataTableHead align="end">Created</DataTableHead>
        </DataTableHeader>
        {documents.length === 0 ? (
          <DataTableEmpty>
            No documents generated yet. Pick a template and generate one
            from a project or client page.
          </DataTableEmpty>
        ) : (
          <DataTableBody>
            {documents.map((d) => {
              const client = Array.isArray(d.client) ? d.client[0] : d.client
              return (
                <DataTableRow key={d.id} href={`/documents/${d.id}`}>
                  <DataTableCell>
                    <p className="truncate text-sm font-medium">{d.title}</p>
                  </DataTableCell>
                  <DataTableCell>
                    <Badge variant="outline" className="uppercase">
                      {KIND_LABEL[d.kind] ?? d.kind}
                    </Badge>
                  </DataTableCell>
                  <DataTableCell>
                    <p className="truncate text-sm">
                      {client?.company || client?.name || "—"}
                    </p>
                  </DataTableCell>
                  <DataTableCell>
                    <Badge variant="outline" className="uppercase">
                      {STATUS_LABEL[d.status] ?? d.status}
                    </Badge>
                  </DataTableCell>
                  <DataTableCell align="end">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {fmtDate(d.created_at)}
                    </span>
                  </DataTableCell>
                </DataTableRow>
              )
            })}
          </DataTableBody>
        )}
      </DataTable>
    </section>
  )

  const templatesPanel = (
    <section className="border border-border/60">
      <DataTable cols="minmax(0,1.8fr) minmax(0,0.7fr) minmax(0,0.5fr) minmax(0,0.7fr) minmax(0,0.8fr)">
        <DataTableHeader>
          <DataTableHead>Name</DataTableHead>
          <DataTableHead>Kind</DataTableHead>
          <DataTableHead>Version</DataTableHead>
          <DataTableHead>Status</DataTableHead>
          <DataTableHead align="end">Updated</DataTableHead>
        </DataTableHeader>
        {templates.length === 0 ? (
          <DataTableEmpty>No templates yet.</DataTableEmpty>
        ) : (
          <DataTableBody>
            {templates.map((t) => (
              <DataTableRow
                key={t.id}
                href={`/documents/templates/${t.id}`}
              >
                <DataTableCell>
                  <p className="truncate text-sm font-medium">{t.name}</p>
                </DataTableCell>
                <DataTableCell>
                  <Badge variant="outline" className="uppercase">
                    {KIND_LABEL[t.kind] ?? t.kind}
                  </Badge>
                </DataTableCell>
                <DataTableCell>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    v{t.version}
                  </span>
                </DataTableCell>
                <DataTableCell>
                  <Badge variant="outline" className="uppercase">
                    {t.is_active ? "Active" : "Inactive"}
                  </Badge>
                </DataTableCell>
                <DataTableCell align="end">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {fmtDate(t.updated_at)}
                  </span>
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        )}
      </DataTable>
    </section>
  )

  const outreachPanel = (
    <section className="border border-border/60">
      <DataTable cols="minmax(0,1.5fr) minmax(0,0.9fr) minmax(0,1.6fr) minmax(0,0.6fr) minmax(0,0.8fr)">
        <DataTableHeader>
          <DataTableHead>Label</DataTableHead>
          <DataTableHead>Business type</DataTableHead>
          <DataTableHead>Subject</DataTableHead>
          <DataTableHead>Status</DataTableHead>
          <DataTableHead align="end">Updated</DataTableHead>
        </DataTableHeader>
        {outreach.length === 0 ? (
          <DataTableEmpty>
            {canManageOutreach
              ? "No outreach templates yet. Create one to start sending pitches from the Leads page."
              : "No outreach templates yet."}
          </DataTableEmpty>
        ) : (
          <DataTableBody>
            {outreach.map((t) => (
              <DataTableRow
                key={t.id}
                href={
                  canManageOutreach
                    ? `/documents/outreach/${t.id}`
                    : undefined
                }
              >
                <DataTableCell>
                  <p className="truncate text-sm font-medium">{t.label}</p>
                </DataTableCell>
                <DataTableCell>
                  <span className="text-xs text-muted-foreground font-mono">
                    {t.business_type}
                  </span>
                </DataTableCell>
                <DataTableCell>
                  <p className="truncate text-sm text-muted-foreground">
                    {t.subject}
                  </p>
                </DataTableCell>
                <DataTableCell>
                  <Badge variant="outline" className="uppercase">
                    {t.is_archived ? "Archived" : "Active"}
                  </Badge>
                </DataTableCell>
                <DataTableCell align="end">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {fmtDate(t.updated_at)}
                  </span>
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        )}
      </DataTable>
    </section>
  )

  return (
    <div className="space-y-10">
      <DocumentsTabs
        canManageOutreach={canManageOutreach}
        documentsPanel={documentsPanel}
        templatesPanel={templatesPanel}
        outreachPanel={outreachPanel}
      />
    </div>
  )
}
