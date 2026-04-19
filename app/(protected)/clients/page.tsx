import { PageHeader } from "@/components/dashboard/page-header"
import { Dot } from "@/components/ui/dot"
import { ClientDetailPanel } from "@/components/clients/client-detail-panel"
import {
  deriveClientStatus,
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

  const [clientsRes, projectsRes, subsRes, paymentsRes] = await Promise.all([
    supabase
      .from("clients")
      .select(
        `
          id, lead_number, name, company, email, phone, industry, location,
          status, notes, created_at,
          owner:profiles!clients_assigned_to_fkey (id, full_name)
        `,
      ),
    supabase
      .from("projects")
      .select(
        "id, client_id, title, stage, payment_status, value, created_at",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("subscriptions")
      .select(
        "id, client_id, product, plan, monthly_rate, status, started_at",
      )
      .order("started_at", { ascending: false }),
    supabase
      .from("payments")
      .select("project_id, amount, status")
      .eq("status", "paid"),
  ])

  if (clientsRes.error) throw clientsRes.error

  // Sum lifetime per client by joining payments → projects → client.
  const projectToClient = new Map<string, string>()
  for (const p of projectsRes.data ?? []) {
    projectToClient.set(p.id, p.client_id)
  }
  const lifetimeByClient = new Map<string, number>()
  for (const pay of paymentsRes.data ?? []) {
    const cid = projectToClient.get(pay.project_id)
    if (!cid) continue
    lifetimeByClient.set(
      cid,
      (lifetimeByClient.get(cid) ?? 0) + Number(pay.amount),
    )
  }

  const projectsByClient = new Map<string, ClientRow["projects"]>()
  for (const p of projectsRes.data ?? []) {
    const list = projectsByClient.get(p.client_id) ?? []
    list.push({
      id: p.id,
      title: p.title,
      stage: p.stage,
      payment_status: p.payment_status,
      value: p.value != null ? Number(p.value) : null,
    })
    projectsByClient.set(p.client_id, list)
  }

  const subsByClient = new Map<string, ClientRow["subscriptions"]>()
  const mrrByClient = new Map<string, number>()
  for (const s of subsRes.data ?? []) {
    const list = subsByClient.get(s.client_id) ?? []
    list.push({
      id: s.id,
      product: s.product,
      plan: s.plan,
      monthly_rate: Number(s.monthly_rate),
      status: s.status as SubscriptionStatus,
      started_at: s.started_at,
    })
    subsByClient.set(s.client_id, list)
    if (s.status === "active" || s.status === "at_risk") {
      mrrByClient.set(
        s.client_id,
        (mrrByClient.get(s.client_id) ?? 0) + Number(s.monthly_rate),
      )
    }
  }

  const allRows: ClientRow[] = (clientsRes.data ?? []).map((c) => {
    const ownerObj = Array.isArray(c.owner) ? c.owner[0] : c.owner
    return {
      id: c.id,
      client_number: c.lead_number,
      name: c.name,
      company: c.company,
      email: c.email,
      phone: c.phone,
      industry: c.industry,
      location: c.location,
      status: c.status,
      notes: c.notes,
      created_at: c.created_at,
      owner: ownerObj
        ? { id: ownerObj.id, full_name: ownerObj.full_name }
        : null,
      lifetime: lifetimeByClient.get(c.id) ?? 0,
      mrr: mrrByClient.get(c.id) ?? 0,
      projects: projectsByClient.get(c.id) ?? [],
      subscriptions: subsByClient.get(c.id) ?? [],
    }
  })

  // Industry options come from real data so the filter never lists empties.
  const industries = Array.from(
    new Set(
      allRows
        .map((r) => r.industry)
        .filter((v): v is string => Boolean(v && v.trim())),
    ),
  ).sort((a, b) => a.localeCompare(b))

  // Search + industry filter.
  const ql = q.toLowerCase()
  const filteredBase = allRows.filter((r) => {
    if (industry !== "all" && (r.industry ?? "") !== industry) return false
    if (!ql) return true
    return (
      r.name.toLowerCase().includes(ql) ||
      (r.company ?? "").toLowerCase().includes(ql) ||
      (r.industry ?? "").toLowerCase().includes(ql) ||
      (r.email ?? "").toLowerCase().includes(ql)
    )
  })

  const counts: Record<ClientTab, number> = {
    all: filteredBase.length,
    active: 0,
    lead: 0,
    qualified: 0,
    at_risk: 0,
    archived: 0,
  }
  for (const row of filteredBase) counts[deriveClientStatus(row)] += 1

  const tabFiltered =
    tab === "all"
      ? filteredBase
      : filteredBase.filter((r) => deriveClientStatus(r) === tab)

  const sorted = [...tabFiltered].sort((a, b) => {
    if (sort === "name") {
      return a.name.localeCompare(b.name)
    }
    if (sort === "mrr") return b.mrr - a.mrr || b.lifetime - a.lifetime
    if (sort === "recent") {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    }
    // lifetime (default)
    return b.lifetime - a.lifetime || b.mrr - a.mrr
  })

  const totalFiltered = sorted.length
  const pageCount = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const startIdx = (currentPage - 1) * PAGE_SIZE
  const visibleRows = sorted.slice(startIdx, startIdx + PAGE_SIZE)

  const selectedId =
    clientParam && sorted.some((r) => r.id === clientParam)
      ? clientParam
      : (visibleRows[0]?.id ?? null)

  const selectedClient = selectedId
    ? (allRows.find((r) => r.id === selectedId) ?? null)
    : null

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
      <PageHeader
        eyebrow="Clients"
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span>{counts.active} active</span>
            <Dot />
            <span>{counts.at_risk} at-risk</span>
            <Dot />
            <span>{totalFiltered} showing</span>
          </span>
        }
        action={<NewClientDialog />}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex min-h-0 flex-col border border-border/60">
          <div className="flex flex-wrap items-center gap-3 border-b border-border/60 px-4 py-3">
            <ClientsTabs active={tab} counts={counts} />
            <div className="flex flex-1 justify-center">
              <ClientsSearch q={q} />
            </div>
            <ClientsFilters
              industry={industry}
              sort={sort}
              industries={industries}
            />
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
        <ClientDetailPanel client={selectedClient} />
      </div>
    </div>
  )
}
