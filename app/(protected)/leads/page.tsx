import { PageHeader } from "@/components/dashboard/page-header"
import { Dot } from "@/components/ui/dot"
import { LeadDetailPanel } from "@/components/leads/lead-detail-panel"
import {
  deriveStatus,
  type ClientSource,
  type LeadRow,
  type LeadTab,
} from "@/components/leads/lead-types"
import { LeadsPagination } from "@/components/leads/leads-pagination"
import { LeadsTable } from "@/components/leads/leads-table"
import { LeadsTabs } from "@/components/leads/leads-tabs"
import { LeadsFilters, LeadsSearch } from "@/components/leads/leads-toolbar"
import { NewLeadDialog } from "@/components/leads/lead-form-dialog"
import { createClient } from "@/lib/supabase/server"
import { Constants } from "@/lib/supabase/types"

type Sort = "score" | "age" | "name"

const PAGE_SIZE = 10

const VALID_TABS: LeadTab[] = [
  "all",
  "new",
  "contacted",
  "qualified",
  "archived",
]

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function parseTab(v: string | undefined): LeadTab {
  return v && (VALID_TABS as string[]).includes(v) ? (v as LeadTab) : "all"
}

function parseSource(v: string | undefined): ClientSource | "all" {
  if (!v) return "all"
  const sources = Constants.public.Enums.client_source as readonly string[]
  return sources.includes(v) ? (v as ClientSource) : "all"
}

function parseSort(v: string | undefined): Sort {
  return v === "age" || v === "name" ? v : "score"
}

function parsePage(v: string | undefined): number {
  const n = Number(v)
  return Number.isInteger(n) && n >= 1 ? n : 1
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string
    lead?: string
    q?: string
    source?: string
    sort?: string
    page?: string
  }>
}) {
  const sp = await searchParams
  const tab = parseTab(sp.tab)
  const source = parseSource(sp.source)
  const sort = parseSort(sp.sort)
  const q = (sp.q ?? "").trim()
  const page = parsePage(sp.page)
  const leadParam = sp.lead && UUID_RE.test(sp.lead) ? sp.lead : null

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: me } = user
    ? await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null }
  const currentUserIsRep =
    me?.role === "sales_rep" || me?.role === "admin" || me?.role === "editor"

  const { data: repRows } = await supabase
    .from("profiles")
    .select("id, full_name, role, employment_status")
    .in("role", ["admin", "editor", "sales_rep"])
    .eq("employment_status", "active")
    .order("full_name", { ascending: true })
  const reps = (repRows ?? []).map((r) => ({
    id: r.id,
    full_name: r.full_name,
  }))

  // Leads page excludes already-converted active clients.
  let query = supabase
    .from("clients")
    .select(
      `
        id, lead_number, name, company, email, phone, address,
        score, intent, budget, notes, source, status, created_at,
        owner:profiles!clients_assigned_to_fkey (id, full_name)
      `,
    )
    .in("status", ["lead", "qualified", "archived", "lost"])

  if (source !== "all") query = query.eq("source", source)
  if (q) {
    const like = `%${q.replace(/[%_]/g, (c) => `\\${c}`)}%`
    query = query.or(
      `name.ilike.${like},company.ilike.${like},intent.ilike.${like}`,
    )
  }

  if (sort === "age")
    query = query.order("created_at", { ascending: false, nullsFirst: false })
  else if (sort === "name")
    query = query.order("name", { ascending: true })
  else query = query.order("score", { ascending: false, nullsFirst: false })

  const rowsRes = await query
  if (rowsRes.error) throw rowsRes.error

  const visibleClientIds = (rowsRes.data ?? []).map((r) => r.id)
  const interactionsRes = visibleClientIds.length
    ? await supabase
        .from("interactions")
        .select("client_id")
        .in("client_id", visibleClientIds)
    : { data: [] as { client_id: string }[] }

  const contactedIds = new Set(
    (interactionsRes.data ?? []).map((r) => r.client_id),
  )

  const allRows: LeadRow[] = (rowsRes.data ?? []).map((r) => {
    // Supabase types joins as arrays when FK is not one-to-one, but we only
    // ever assign one owner — take the first (if any).
    const ownerObj = Array.isArray(r.owner) ? r.owner[0] : r.owner
    return {
      id: r.id,
      lead_number: r.lead_number,
      name: r.name,
      company: r.company,
      email: r.email,
      phone: r.phone,
      address: r.address,
      score: r.score,
      intent: r.intent,
      budget: r.budget,
      notes: r.notes,
      source: r.source,
      status: r.status,
      created_at: r.created_at,
      owner: ownerObj
        ? {
            id: ownerObj.id,
            full_name: ownerObj.full_name,
          }
        : null,
      has_interactions: contactedIds.has(r.id),
    }
  })

  const counts: Record<LeadTab, number> = {
    all: allRows.length,
    new: 0,
    contacted: 0,
    qualified: 0,
    archived: 0,
  }
  for (const row of allRows) counts[deriveStatus(row)] += 1

  const filteredRows =
    tab === "all"
      ? allRows
      : allRows.filter((r) => deriveStatus(r) === tab)

  const totalFiltered = filteredRows.length
  const pageCount = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const startIdx = (currentPage - 1) * PAGE_SIZE
  const visibleRows = filteredRows.slice(startIdx, startIdx + PAGE_SIZE)

  const selectedId =
    leadParam && filteredRows.some((r) => r.id === leadParam)
      ? leadParam
      : (visibleRows[0]?.id ?? null)

  const selectedLead = selectedId
    ? (allRows.find((r) => r.id === selectedId) ?? null)
    : null

  function buildRowHref(id: string) {
    const next = new URLSearchParams()
    if (tab !== "all") next.set("tab", tab)
    if (source !== "all") next.set("source", source)
    if (sort !== "score") next.set("sort", sort)
    if (q) next.set("q", q)
    if (currentPage > 1) next.set("page", String(currentPage))
    next.set("lead", id)
    return `/leads?${next.toString()}`
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Leads"
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span>{counts.new} New</span>
            <Dot />
            <span>{counts.qualified} Qualified</span>
            <Dot />
            <span>{totalFiltered} Showing</span>
          </span>
        }
        action={<NewLeadDialog />}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex min-h-0 flex-col border border-border/60">
          <div className="flex flex-wrap items-center gap-3 border-b border-border/60 px-4 py-3">
            <LeadsTabs active={tab} counts={counts} />
            <div className="ml-auto flex items-center gap-2">
              <LeadsSearch q={q} />
              <LeadsFilters source={source} sort={sort} />
            </div>
          </div>
          <LeadsTable
            rows={visibleRows}
            selectedId={selectedId}
            buildRowHref={buildRowHref}
          />
          <LeadsPagination
            page={currentPage}
            pageCount={pageCount}
            total={totalFiltered}
            className="mt-auto"
          />
        </div>
        <LeadDetailPanel
          lead={selectedLead}
          reps={reps}
          currentUserId={user?.id ?? null}
          currentUserIsRep={currentUserIsRep}
        />
      </div>
    </div>
  )
}
