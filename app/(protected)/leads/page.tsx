import { LeadDetailPanel } from "@/components/leads/lead-detail-panel"
import {
  type ClientSource,
  type LeadRow,
  type LeadTab,
} from "@/components/leads/lead-types"
import { LeadsPagination } from "@/components/leads/leads-pagination"
import { LeadsTable } from "@/components/leads/leads-table"
import { LeadsTabs } from "@/components/leads/leads-tabs"
import { LeadsFilters, LeadsSearch } from "@/components/leads/leads-toolbar"
import { NewEntryDialog } from "@/components/leads/lead-form-dialog"
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
  "prospects",
]

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Leads page scope: the original in-memory filter was
// status in ('lead','qualified','archived','lost'). Express the same
// constraint as a reusable list so every count + slice query agrees.
const LEAD_STATUSES = ["lead", "qualified", "archived", "lost"] as const

const VIEW_COLUMNS = `
  id, lead_number, name, company, email, phone, address, social_url,
  industry, score, intent, budget, notes, source, status, kind, created_at,
  assigned_to, has_interactions
`

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
        .select("role, full_name, title")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null }
  const currentUserIsRep =
    me?.role === "sales_rep" || me?.role === "admin" || me?.role === "editor"

  const { data: googleIntegration } = user
    ? await supabase
        .from("rep_integrations")
        .select("google_email")
        .eq("rep_id", user.id)
        .eq("provider", "google")
        .maybeSingle()
    : { data: null }
  const currentRep = {
    name: me?.full_name ?? null,
    email: googleIntegration?.google_email ?? user?.email ?? null,
    title: me?.title ?? null,
  }

  const [repRowsRes, outreachRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role, employment_status")
      .in("role", ["admin", "editor", "sales_rep"])
      .eq("employment_status", "active")
      .order("full_name", { ascending: true }),
    supabase
      .from("outreach_templates")
      .select("*")
      .eq("is_archived", false)
      .order("sort_order", { ascending: true }),
  ])
  const reps = (repRowsRes.data ?? []).map((r) => ({
    id: r.id,
    full_name: r.full_name,
  }))
  const outreachTemplates = outreachRes.data ?? []

  const qLike = q ? `%${q.replace(/[%_]/g, (c) => `\\${c}`)}%` : null
  const searchOrClause = qLike
    ? `name.ilike.${qLike},company.ilike.${qLike},intent.ilike.${qLike}`
    : null

  // Inline filter chain per tab (same pattern as projects/clients pages).
  // Base constraint: status in LEAD_STATUSES plus source + search,
  // applies to every tab; per-tab clauses layer derived-status rules on
  // top using has_interactions / kind / status columns from the view.
  function countQuery(tabFilter: LeadTab) {
    let q = supabase
      .from("clients_enriched")
      .select("id", { count: "exact", head: true })
      .in("status", LEAD_STATUSES as unknown as string[])
    if (source !== "all") q = q.eq("source", source)
    if (searchOrClause) q = q.or(searchOrClause)

    if (tabFilter === "all") return q
    if (tabFilter === "prospects") return q.eq("kind", "prospect")
    // Remaining tabs scope to real leads (kind='lead').
    q = q.eq("kind", "lead")
    if (tabFilter === "new")
      return q.eq("status", "lead").eq("has_interactions", false)
    if (tabFilter === "contacted")
      return q.eq("status", "lead").eq("has_interactions", true)
    if (tabFilter === "qualified") return q.eq("status", "qualified")
    if (tabFilter === "archived")
      return q.in("status", ["archived", "lost"])
    return q
  }

  function visibleSliceQuery() {
    let q = supabase
      .from("clients_enriched")
      .select(VIEW_COLUMNS)
      .in("status", LEAD_STATUSES as unknown as string[])
    if (source !== "all") q = q.eq("source", source)
    if (searchOrClause) q = q.or(searchOrClause)

    if (tab === "prospects") {
      q = q.eq("kind", "prospect")
    } else if (tab !== "all") {
      q = q.eq("kind", "lead")
      if (tab === "new")
        q = q.eq("status", "lead").eq("has_interactions", false)
      else if (tab === "contacted")
        q = q.eq("status", "lead").eq("has_interactions", true)
      else if (tab === "qualified") q = q.eq("status", "qualified")
      else if (tab === "archived") q = q.in("status", ["archived", "lost"])
    }

    if (sort === "age")
      q = q.order("created_at", { ascending: false, nullsFirst: false })
    else if (sort === "name")
      q = q.order("name", { ascending: true })
    else q = q.order("score", { ascending: false, nullsFirst: false })

    return q
  }

  const [
    countAllRes,
    countNewRes,
    countContactedRes,
    countQualifiedRes,
    countArchivedRes,
    countProspectsRes,
  ] = await Promise.all([
    countQuery("all"),
    countQuery("new"),
    countQuery("contacted"),
    countQuery("qualified"),
    countQuery("archived"),
    countQuery("prospects"),
  ])

  const counts: Record<LeadTab, number> = {
    all: countAllRes.count ?? 0,
    new: countNewRes.count ?? 0,
    contacted: countContactedRes.count ?? 0,
    qualified: countQualifiedRes.count ?? 0,
    archived: countArchivedRes.count ?? 0,
    prospects: countProspectsRes.count ?? 0,
  }

  const totalFiltered = counts[tab]
  const pageCount = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const startIdx = (currentPage - 1) * PAGE_SIZE

  const pageRes = await visibleSliceQuery().range(
    startIdx,
    startIdx + PAGE_SIZE - 1,
  )
  if (pageRes.error) throw pageRes.error
  const rawPageRows = pageRes.data ?? []

  const ownerIds = Array.from(
    new Set(
      rawPageRows
        .map((r) => r.assigned_to)
        .filter((v): v is string => Boolean(v)),
    ),
  )
  const { data: ownerRows } = ownerIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ownerIds)
    : { data: null }
  const ownerById = new Map(
    (ownerRows ?? []).map((o) => [o.id, { id: o.id, full_name: o.full_name }]),
  )

  function hydrate(r: (typeof rawPageRows)[number]): LeadRow {
    return {
      id: r.id!,
      lead_number: r.lead_number!,
      name: r.name!,
      company: r.company,
      email: r.email,
      phone: r.phone,
      address: r.address,
      social_url: r.social_url,
      industry: r.industry,
      score: r.score,
      intent: r.intent,
      budget: r.budget,
      notes: r.notes,
      source: r.source!,
      status: r.status!,
      kind: r.kind === "prospect" ? "prospect" : "lead",
      created_at: r.created_at!,
      owner: r.assigned_to ? (ownerById.get(r.assigned_to) ?? null) : null,
      has_interactions: Boolean(r.has_interactions),
    }
  }

  const visibleRows = rawPageRows.map(hydrate)

  // Resolve the selected lead. Off-page selections fetch individually so
  // the detail panel still renders without a full list re-fetch.
  let selectedLead: LeadRow | null =
    (leadParam
      ? (visibleRows.find((r) => r.id === leadParam) ?? null)
      : null) ??
    visibleRows[0] ??
    null

  if (
    leadParam &&
    !visibleRows.some((r) => r.id === leadParam) &&
    selectedLead?.id !== leadParam
  ) {
    const { data: detail } = await supabase
      .from("clients_enriched")
      .select(VIEW_COLUMNS)
      .eq("id", leadParam)
      .maybeSingle()

    if (detail) {
      let detailOwner: LeadRow["owner"] = null
      if (detail.assigned_to) {
        const { data: ownerRow } = await supabase
          .from("profiles")
          .select("id, full_name")
          .eq("id", detail.assigned_to)
          .maybeSingle()
        if (ownerRow) {
          detailOwner = { id: ownerRow.id, full_name: ownerRow.full_name }
        }
      }
      selectedLead = {
        id: detail.id!,
        lead_number: detail.lead_number!,
        name: detail.name!,
        company: detail.company,
        email: detail.email,
        phone: detail.phone,
        address: detail.address,
        social_url: detail.social_url,
        industry: detail.industry,
        score: detail.score,
        intent: detail.intent,
        budget: detail.budget,
        notes: detail.notes,
        source: detail.source!,
        status: detail.status!,
        kind: detail.kind === "prospect" ? "prospect" : "lead",
        created_at: detail.created_at!,
        owner: detailOwner,
        has_interactions: Boolean(detail.has_interactions),
      }
    }
  }

  const selectedId = selectedLead?.id ?? null

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
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex min-h-0 flex-col border border-border/60">
          <div className="flex flex-wrap items-center gap-3 border-b border-border/60 px-4 py-3">
            <LeadsTabs active={tab} counts={counts} />
            <div className="ml-auto flex items-center gap-2">
              <LeadsSearch q={q} />
              <LeadsFilters source={source} sort={sort} />
              <NewEntryDialog
                defaultKind={tab === "prospects" ? "prospect" : "lead"}
              />
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
          outreachTemplates={outreachTemplates}
          currentRep={currentRep}
        />
      </div>
    </div>
  )
}
