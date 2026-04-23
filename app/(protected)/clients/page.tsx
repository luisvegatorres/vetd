import { ClientDetailPanel } from "@/components/clients/client-detail-panel"
import {
  type ClientRow,
  type ClientTab,
  type SubscriptionStatus,
} from "@/components/clients/client-types"
import { ClientsPagination } from "@/components/clients/clients-pagination"
import { ClientsTable } from "@/components/clients/clients-table"
import { ClientsTabs } from "@/components/clients/clients-tabs"
import { ClientsFilters, ClientsSearch } from "@/components/clients/clients-toolbar"
import { NewClientDialog } from "@/components/clients/client-form-dialog"
import { createClient } from "@/lib/supabase/server"

type Sort = "lifetime" | "mrr" | "name" | "recent"

const PAGE_SIZE = 10

const VALID_TABS: ClientTab[] = [
  "all",
  "active",
  "lead",
  "qualified",
  "at_risk",
  "archived",
]

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function parseTab(v: string | undefined): ClientTab {
  return v && (VALID_TABS as string[]).includes(v) ? (v as ClientTab) : "all"
}

function parseSort(v: string | undefined): Sort {
  if (v === "mrr" || v === "name" || v === "recent") return v
  return "lifetime"
}

function parsePage(v: string | undefined): number {
  const n = Number(v)
  return Number.isInteger(n) && n >= 1 ? n : 1
}

const VIEW_COLUMNS = `
  id, lead_number, name, company, email, phone, industry, location,
  status, notes, created_at, assigned_to,
  lifetime, mrr, has_at_risk_subscription
`

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string
    client?: string
    q?: string
    industry?: string
    sort?: string
    page?: string
  }>
}) {
  const sp = await searchParams
  const tab = parseTab(sp.tab)
  const sort = parseSort(sp.sort)
  const q = (sp.q ?? "").trim()
  const page = parsePage(sp.page)
  const industry = (sp.industry ?? "all").trim() || "all"
  const clientParam = sp.client && UUID_RE.test(sp.client) ? sp.client : null

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
  const canReassign = me?.role === "admin" || me?.role === "editor"

  const { data: repRows } = canReassign
    ? await supabase
        .from("profiles")
        .select("id, full_name, role, employment_status")
        .in("role", ["admin", "editor", "sales_rep"])
        .eq("employment_status", "active")
        .order("full_name", { ascending: true })
    : { data: null }
  const reps = (repRows ?? []).map((r) => ({
    id: r.id,
    full_name: r.full_name,
  }))

  const qLike = q ? `%${q.replace(/[%_]/g, (c) => `\\${c}`)}%` : null
  const searchOrClause = qLike
    ? `name.ilike.${qLike},company.ilike.${qLike},industry.ilike.${qLike},email.ilike.${qLike}`
    : null

  // One pass to derive all six tab counts. The previous version fired six
  // count queries against clients_enriched (view with lateral joins) per
  // navigation; this pulls two scalar columns and tallies in JS. Fine up
  // to tens of thousands of clients — revisit with a server-side RPC if
  // the filtered set ever exceeds ~50k rows.
  function tabCountSourceQuery() {
    let q = supabase
      .from("clients_enriched")
      .select("status, has_at_risk_subscription")
    if (industry !== "all") q = q.eq("industry", industry)
    if (searchOrClause) q = q.or(searchOrClause)
    return q
  }

  function visibleSliceQuery() {
    let q = supabase.from("clients_enriched").select(VIEW_COLUMNS)
    if (industry !== "all") q = q.eq("industry", industry)
    if (searchOrClause) q = q.or(searchOrClause)
    if (tab === "lead") q = q.eq("status", "lead")
    else if (tab === "qualified") q = q.eq("status", "qualified")
    else if (tab === "archived") q = q.in("status", ["archived", "lost"])
    else if (tab === "active")
      q = q.eq("status", "active_client").eq("has_at_risk_subscription", false)
    else if (tab === "at_risk")
      q = q.eq("status", "active_client").eq("has_at_risk_subscription", true)

    if (sort === "name") {
      q = q.order("name", { ascending: true })
    } else if (sort === "mrr") {
      q = q
        .order("mrr", { ascending: false, nullsFirst: false })
        .order("lifetime", { ascending: false, nullsFirst: false })
    } else if (sort === "recent") {
      q = q.order("created_at", { ascending: false, nullsFirst: false })
    } else {
      q = q
        .order("lifetime", { ascending: false, nullsFirst: false })
        .order("mrr", { ascending: false, nullsFirst: false })
    }
    return q
  }

  // Distinct industries populate the filter dropdown. Pulling one short
  // column is cheap even at 5k clients; no need for a dedicated RPC.
  const industryOptionsPromise = supabase
    .from("clients")
    .select("industry")
    .not("industry", "is", null)
    .order("industry", { ascending: true })

  const [tabCountSourceRes, industryOptionsRes] = await Promise.all([
    tabCountSourceQuery(),
    industryOptionsPromise,
  ])

  const counts: Record<ClientTab, number> = {
    all: 0,
    active: 0,
    lead: 0,
    qualified: 0,
    at_risk: 0,
    archived: 0,
  }
  for (const row of tabCountSourceRes.data ?? []) {
    counts.all += 1
    if (row.status === "lead") counts.lead += 1
    else if (row.status === "qualified") counts.qualified += 1
    else if (row.status === "archived" || row.status === "lost")
      counts.archived += 1
    else if (row.status === "active_client") {
      if (row.has_at_risk_subscription) counts.at_risk += 1
      else counts.active += 1
    }
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

  const industries = Array.from(
    new Set(
      (industryOptionsRes.data ?? [])
        .map((r) => r.industry)
        .filter((v): v is string => Boolean(v && v.trim())),
    ),
  )

  // Owner names — single profiles query for the visible IDs (≤10 rows).
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

  // List rows only need the scalar aggregates (lifetime/mrr) and booleans;
  // projects[]/subscriptions[] stay empty here. The detail panel fetches
  // the full child arrays for the selected client below.
  const visibleRows: ClientRow[] = rawPageRows.map((c) => ({
    id: c.id!,
    client_number: c.lead_number!,
    name: c.name!,
    company: c.company,
    email: c.email,
    phone: c.phone,
    industry: c.industry,
    location: c.location,
    status: c.status!,
    notes: c.notes,
    created_at: c.created_at!,
    owner: c.assigned_to ? (ownerById.get(c.assigned_to) ?? null) : null,
    lifetime: Number(c.lifetime ?? 0),
    mrr: Number(c.mrr ?? 0),
    has_at_risk_subscription: Boolean(c.has_at_risk_subscription),
    projects: [],
    subscriptions: [],
  }))

  // Only hydrate the detail panel when the user explicitly picked a row
  // (?client=...). Auto-selecting the first visible row on every tab
  // switch fired projects + subscriptions queries for a client the user
  // hadn't asked to see — the empty-state panel is the right default.
  const selectedId = clientParam ?? null

  // Hydrate the selected client with its real child arrays. Off-page
  // selections go through the same path — one point-lookup plus two
  // scoped child queries, never a full-table scan.
  let selectedClient: ClientRow | null = null
  if (selectedId) {
    const onPage = visibleRows.find((r) => r.id === selectedId) ?? null
    let base = onPage

    if (!base) {
      const { data: detail } = await supabase
        .from("clients_enriched")
        .select(VIEW_COLUMNS)
        .eq("id", selectedId)
        .maybeSingle()

      if (detail) {
        let detailOwner: ClientRow["owner"] = null
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
        base = {
          id: detail.id!,
          client_number: detail.lead_number!,
          name: detail.name!,
          company: detail.company,
          email: detail.email,
          phone: detail.phone,
          industry: detail.industry,
          location: detail.location,
          status: detail.status!,
          notes: detail.notes,
          created_at: detail.created_at!,
          owner: detailOwner,
          lifetime: Number(detail.lifetime ?? 0),
          mrr: Number(detail.mrr ?? 0),
          has_at_risk_subscription: Boolean(detail.has_at_risk_subscription),
          projects: [],
          subscriptions: [],
        }
      }
    }

    if (base) {
      const [projectsRes, subsRes] = await Promise.all([
        supabase
          .from("projects")
          .select("id, title, stage, payment_status, value")
          .eq("client_id", base.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("subscriptions")
          .select(
            "id, product, plan, monthly_rate, status, started_at, stripe_subscription_id",
          )
          .eq("client_id", base.id)
          .order("started_at", { ascending: false }),
      ])

      selectedClient = {
        ...base,
        projects: (projectsRes.data ?? []).map((p) => ({
          id: p.id,
          title: p.title,
          stage: p.stage,
          payment_status: p.payment_status,
          value: p.value != null ? Number(p.value) : null,
        })),
        subscriptions: (subsRes.data ?? []).map((s) => ({
          id: s.id,
          product: s.product,
          plan: s.plan,
          monthly_rate: Number(s.monthly_rate),
          status: s.status as SubscriptionStatus,
          started_at: s.started_at,
          stripe_subscription_id: s.stripe_subscription_id,
        })),
      }
    }
  }

  function buildRowHref(id: string) {
    const next = new URLSearchParams()
    if (tab !== "all") next.set("tab", tab)
    if (industry !== "all") next.set("industry", industry)
    if (sort !== "lifetime") next.set("sort", sort)
    if (q) next.set("q", q)
    if (currentPage > 1) next.set("page", String(currentPage))
    next.set("client", id)
    return `/clients?${next.toString()}`
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex min-h-0 flex-col border border-border/60">
          <div className="flex flex-wrap items-center gap-3 border-b border-border/60 px-4 py-3">
            <ClientsTabs active={tab} counts={counts} />
            <div className="ml-auto flex items-center gap-2">
              <ClientsSearch q={q} />
              <ClientsFilters
                industry={industry}
                sort={sort}
                industries={industries}
              />
              <NewClientDialog reps={reps} canReassign={canReassign} />
            </div>
          </div>
          <ClientsTable
            rows={visibleRows}
            selectedId={selectedId}
            buildRowHref={buildRowHref}
          />
          <ClientsPagination
            page={currentPage}
            pageCount={pageCount}
            total={totalFiltered}
            className="mt-auto"
          />
        </div>
        <ClientDetailPanel
          client={selectedClient}
          reps={reps}
          canReassign={canReassign}
        />
      </div>
    </div>
  )
}
