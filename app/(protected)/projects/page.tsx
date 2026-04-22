import { NewProjectDialog } from "@/components/projects/project-form-dialog"
import { ProjectDetailPanel } from "@/components/projects/project-detail-panel"
import { ProjectsPagination } from "@/components/projects/projects-pagination"
import { ProjectsTable } from "@/components/projects/projects-table"
import { ProjectsTabs } from "@/components/projects/projects-tabs"
import {
  ProjectsFilters,
  ProjectsSearch,
} from "@/components/projects/projects-toolbar"
import {
  PRODUCT_TYPE_LABEL,
  type PaymentStatus,
  type ProjectProductType,
  type ProjectRow,
  type ProjectStage,
  type ProjectTab,
} from "@/components/projects/project-types"
import { createClient } from "@/lib/supabase/server"
import { Constants } from "@/lib/supabase/types"

type Sort = "recent" | "value" | "deadline" | "stage"

const PAGE_SIZE = 10

// Custom stage ordering used when sort=stage. Postgres can't do this with a
// plain ORDER BY, so stage-sort re-sorts the visible page in memory.
const STAGE_ORDER: Record<ProjectStage, number> = {
  proposal: 0,
  negotiation: 0,
  active: 1,
  completed: 2,
  cancelled: 3,
}

const VALID_TABS: ProjectTab[] = [
  "all",
  "proposal",
  "active",
  "completed",
  "cancelled",
]

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function parseTab(v: string | undefined): ProjectTab {
  return v && (VALID_TABS as string[]).includes(v) ? (v as ProjectTab) : "all"
}

function parseSort(v: string | undefined): Sort {
  if (v === "value" || v === "deadline" || v === "stage") return v
  return "recent"
}

function parseProduct(v: string | undefined): ProjectProductType | "all" {
  if (!v) return "all"
  const types = Constants.public.Enums.project_product_type as readonly string[]
  return types.includes(v) ? (v as ProjectProductType) : "all"
}

function parsePayment(v: string | undefined): PaymentStatus | "all" {
  if (!v) return "all"
  const statuses = Constants.public.Enums.payment_status as readonly string[]
  return statuses.includes(v) ? (v as PaymentStatus) : "all"
}

function parsePage(v: string | undefined): number {
  const n = Number(v)
  return Number.isInteger(n) && n >= 1 ? n : 1
}

const PROJECT_COLUMNS = `
  id, title, description, stage, value, currency,
  financing_enabled,
  start_date, deadline, completed_at,
  payment_status, stripe_checkout_session_id,
  paid_at, product_type, deposit_rate, deposit_amount,
  deposit_paid_at, created_at,
  client:clients!projects_client_id_fkey (id, name, company),
  rep:profiles!projects_sold_by_fkey (id, full_name)
`

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string
    project?: string
    q?: string
    product?: string
    rep?: string
    payment?: string
    sort?: string
    page?: string
  }>
}) {
  const sp = await searchParams
  const tab = parseTab(sp.tab)
  const sort = parseSort(sp.sort)
  const product = parseProduct(sp.product)
  const payment = parsePayment(sp.payment)
  const repFilter = sp.rep && UUID_RE.test(sp.rep) ? sp.rep : "all"
  const q = (sp.q ?? "").trim()
  const page = parsePage(sp.page)
  const projectParam =
    sp.project && UUID_RE.test(sp.project) ? sp.project : null

  const supabase = await createClient()

  const qLike = q ? `%${q.replace(/[%_]/g, (c) => `\\${c}`)}%` : null

  // Search resolves client IDs matching the query so we can OR them into the
  // projects filter — preserves the existing "search finds by client name"
  // behavior without needing a database view.
  let matchingClientIds: string[] = []
  if (qLike) {
    const { data: matchingClients, error: clientMatchErr } = await supabase
      .from("clients")
      .select("id")
      .or(`name.ilike.${qLike},company.ilike.${qLike}`)
      .limit(500)
    if (clientMatchErr) throw clientMatchErr
    matchingClientIds = (matchingClients ?? []).map((c) => c.id)
  }

  const searchOrClause = qLike
    ? matchingClientIds.length > 0
      ? `title.ilike.${qLike},client_id.in.(${matchingClientIds.join(",")})`
      : `title.ilike.${qLike}`
    : null

  // Build a count query for a given stage filter. Inlining the filter chain
  // here (rather than a generic helper) keeps PostgREST's method-chain types
  // resolvable end-to-end.
  function countQuery(stageFilter: ProjectTab) {
    let q = supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
    if (product !== "all") q = q.eq("product_type", product)
    if (payment !== "all") q = q.eq("payment_status", payment)
    if (repFilter !== "all") q = q.eq("sold_by", repFilter)
    if (searchOrClause) q = q.or(searchOrClause)
    if (stageFilter === "proposal") {
      q = q.in("stage", ["proposal", "negotiation"])
    } else if (stageFilter !== "all") {
      q = q.eq("stage", stageFilter)
    }
    return q
  }

  const countAllPromise = countQuery("all")
  const countProposalPromise = countQuery("proposal")
  const countActivePromise = countQuery("active")
  const countCompletedPromise = countQuery("completed")
  const countCancelledPromise = countQuery("cancelled")

  const clientOptionsPromise = supabase
    .from("clients")
    .select("id, name, company")
    .order("name")
    .limit(500)

  const repOptionsPromise = supabase
    .from("profiles")
    .select("id, full_name")
    .in("role", ["admin", "editor", "sales_rep"])
    .order("full_name")

  // Visible-slice query. Order runs server-side for 'recent'/'value'/
  // 'deadline'; 'stage' uses a custom order that can't be expressed in SQL
  // without CASE, so it falls back to created_at ordering and re-sorts the
  // visible page in memory.
  function visibleSliceQuery() {
    let q = supabase.from("projects").select(PROJECT_COLUMNS)
    if (product !== "all") q = q.eq("product_type", product)
    if (payment !== "all") q = q.eq("payment_status", payment)
    if (repFilter !== "all") q = q.eq("sold_by", repFilter)
    if (searchOrClause) q = q.or(searchOrClause)
    if (tab === "proposal") {
      q = q.in("stage", ["proposal", "negotiation"])
    } else if (tab !== "all") {
      q = q.eq("stage", tab)
    }
    if (sort === "value") {
      q = q.order("value", { ascending: false, nullsFirst: false })
    } else if (sort === "deadline") {
      q = q.order("deadline", { ascending: true, nullsFirst: false })
    } else {
      q = q.order("created_at", { ascending: false })
    }
    return q
  }
  const orderedVisible = visibleSliceQuery()

  const [
    countAllRes,
    countProposalRes,
    countActiveRes,
    countCompletedRes,
    countCancelledRes,
    clientsRes,
    repsRes,
  ] = await Promise.all([
    countAllPromise,
    countProposalPromise,
    countActivePromise,
    countCompletedPromise,
    countCancelledPromise,
    clientOptionsPromise,
    repOptionsPromise,
  ])

  const counts: Record<ProjectTab, number> = {
    all: countAllRes.count ?? 0,
    proposal: countProposalRes.count ?? 0,
    active: countActiveRes.count ?? 0,
    completed: countCompletedRes.count ?? 0,
    cancelled: countCancelledRes.count ?? 0,
  }

  const totalFiltered = counts[tab]
  const pageCount = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const startIdx = (currentPage - 1) * PAGE_SIZE

  const pageRes = await orderedVisible.range(
    startIdx,
    startIdx + PAGE_SIZE - 1,
  )
  if (pageRes.error) throw pageRes.error
  const rawPageRows = pageRes.data ?? []

  // Sibling decorators — scoped to the visible project IDs only. This is the
  // core scalability fix: we no longer fetch every payment/interaction/
  // subscription row in the database.
  const pageProjectIds = rawPageRows.map((p) => p.id)

  const [paymentsRes, interactionsRes, subscriptionsRes] =
    pageProjectIds.length > 0
      ? await Promise.all([
          supabase
            .from("payments")
            .select("project_id, amount, status")
            .in("project_id", pageProjectIds),
          supabase
            .from("interactions")
            .select("project_id, type, created_at, content")
            .in("project_id", pageProjectIds)
            .order("created_at", { ascending: false }),
          supabase
            .from("subscriptions")
            .select(
              "id, project_id, plan, product, monthly_rate, status, started_at, stripe_subscription_id",
            )
            .in("project_id", pageProjectIds),
        ])
      : [
          { data: [], error: null },
          { data: [], error: null },
          { data: [], error: null },
        ]

  if (paymentsRes.error) throw paymentsRes.error
  if (interactionsRes.error) throw interactionsRes.error
  if (subscriptionsRes.error) throw subscriptionsRes.error

  const subscriptionIds = (subscriptionsRes.data ?? []).map((s) => s.id)
  const subscriptionInvoicesRes =
    subscriptionIds.length > 0
      ? await supabase
          .from("subscription_invoices")
          .select("subscription_id, amount_paid, status")
          .in("subscription_id", subscriptionIds)
      : null

  if (subscriptionInvoicesRes?.error) throw subscriptionInvoicesRes.error

  const paymentsByProject = new Map<
    string,
    { amount: number; status: string }[]
  >()
  for (const p of paymentsRes.data ?? []) {
    if (!p.project_id) continue
    const list = paymentsByProject.get(p.project_id) ?? []
    list.push({ amount: Number(p.amount), status: p.status })
    paymentsByProject.set(p.project_id, list)
  }

  const interactionsByProject = new Map<string, ProjectRow["interactions"]>()
  for (const it of interactionsRes.data ?? []) {
    if (!it.project_id) continue
    const list = interactionsByProject.get(it.project_id) ?? []
    list.push({
      type: it.type,
      created_at: it.created_at,
      summary: it.content,
    })
    interactionsByProject.set(it.project_id, list)
  }

  const invoiceSummaryBySubscription = new Map<
    string,
    { payment_count: number; paid_payment_count: number; paid_total: number }
  >()
  for (const inv of subscriptionInvoicesRes?.data ?? []) {
    const current = invoiceSummaryBySubscription.get(inv.subscription_id) ?? {
      payment_count: 0,
      paid_payment_count: 0,
      paid_total: 0,
    }
    current.payment_count += 1
    if (inv.status === "paid") {
      current.paid_payment_count += 1
      current.paid_total += Number(inv.amount_paid)
    }
    invoiceSummaryBySubscription.set(inv.subscription_id, current)
  }

  const subscriptionByProject = new Map<
    string,
    NonNullable<ProjectRow["subscription"]>
  >()
  for (const s of subscriptionsRes.data ?? []) {
    if (!s.project_id) continue
    const invoiceSummary = invoiceSummaryBySubscription.get(s.id) ?? {
      payment_count: 0,
      paid_payment_count: 0,
      paid_total: 0,
    }
    subscriptionByProject.set(s.project_id, {
      id: s.id,
      plan: s.plan,
      product: s.product,
      monthly_rate: Number(s.monthly_rate),
      status: s.status,
      started_at: s.started_at,
      stripe_subscription_id: s.stripe_subscription_id,
      payment_count: invoiceSummary.payment_count,
      paid_payment_count: invoiceSummary.paid_payment_count,
      paid_total: invoiceSummary.paid_total,
    })
  }

  function hydrate(p: (typeof rawPageRows)[number]): ProjectRow {
    const clientObj = Array.isArray(p.client) ? p.client[0] : p.client
    const repObj = Array.isArray(p.rep) ? p.rep[0] : p.rep
    return {
      id: p.id,
      title: p.title,
      description: p.description,
      stage: p.stage,
      value: p.value != null ? Number(p.value) : null,
      currency: p.currency ?? "USD",
      financing_enabled: p.financing_enabled,
      start_date: p.start_date,
      deadline: p.deadline,
      completed_at: p.completed_at,
      payment_status: p.payment_status,
      stripe_checkout_session_id: p.stripe_checkout_session_id,
      paid_at: p.paid_at,
      product_type: p.product_type,
      deposit_rate: Number(p.deposit_rate),
      deposit_amount:
        p.deposit_amount != null ? Number(p.deposit_amount) : null,
      deposit_paid_at: p.deposit_paid_at,
      created_at: p.created_at,
      client: clientObj
        ? {
            id: clientObj.id,
            name: clientObj.name,
            company: clientObj.company,
          }
        : null,
      rep: repObj ? { id: repObj.id, full_name: repObj.full_name } : null,
      payments: paymentsByProject.get(p.id) ?? [],
      interactions: interactionsByProject.get(p.id) ?? [],
      subscription: subscriptionByProject.get(p.id) ?? null,
    }
  }

  let visibleRows: ProjectRow[] = rawPageRows.map(hydrate)

  if (sort === "stage") {
    visibleRows = [...visibleRows].sort(
      (a, b) => STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage],
    )
  }

  // Secondary in-memory filter: server-side search matches title + client
  // IDs, but a user could also type a product label ("mobile app"). This
  // post-filter catches that on the visible slice.
  if (qLike) {
    const ql = q.toLowerCase()
    visibleRows = visibleRows.filter((r) => {
      return (
        r.title.toLowerCase().includes(ql) ||
        (r.client?.name ?? "").toLowerCase().includes(ql) ||
        (r.client?.company ?? "").toLowerCase().includes(ql) ||
        (r.product_type
          ? PRODUCT_TYPE_LABEL[r.product_type].toLowerCase()
          : ""
        ).includes(ql)
      )
    })
  }

  // Resolve the selected project. If the URL points at a row not on the
  // current page, fetch it individually so the detail panel still renders.
  let selectedProject: ProjectRow | null =
    (projectParam
      ? (visibleRows.find((r) => r.id === projectParam) ?? null)
      : null) ??
    visibleRows[0] ??
    null

  if (
    projectParam &&
    !visibleRows.some((r) => r.id === projectParam) &&
    selectedProject?.id !== projectParam
  ) {
    const detailRes = await supabase
      .from("projects")
      .select(PROJECT_COLUMNS)
      .eq("id", projectParam)
      .maybeSingle()

    if (detailRes.data) {
      const detail = detailRes.data

      const [detailPayments, detailInteractions, detailSubs] =
        await Promise.all([
          supabase
            .from("payments")
            .select("project_id, amount, status")
            .eq("project_id", projectParam),
          supabase
            .from("interactions")
            .select("project_id, type, created_at, content")
            .eq("project_id", projectParam)
            .order("created_at", { ascending: false }),
          supabase
            .from("subscriptions")
            .select(
              "id, project_id, plan, product, monthly_rate, status, started_at, stripe_subscription_id",
            )
            .eq("project_id", projectParam),
        ])

      const detailSubIds = (detailSubs.data ?? []).map((s) => s.id)
      const detailInvoices =
        detailSubIds.length > 0
          ? await supabase
              .from("subscription_invoices")
              .select("subscription_id, amount_paid, status")
              .in("subscription_id", detailSubIds)
          : null

      const dp = new Map<string, { amount: number; status: string }[]>()
      for (const p of detailPayments.data ?? []) {
        if (!p.project_id) continue
        const list = dp.get(p.project_id) ?? []
        list.push({ amount: Number(p.amount), status: p.status })
        dp.set(p.project_id, list)
      }

      const di = new Map<string, ProjectRow["interactions"]>()
      for (const it of detailInteractions.data ?? []) {
        if (!it.project_id) continue
        const list = di.get(it.project_id) ?? []
        list.push({
          type: it.type,
          created_at: it.created_at,
          summary: it.content,
        })
        di.set(it.project_id, list)
      }

      const detailInvSum = new Map<
        string,
        {
          payment_count: number
          paid_payment_count: number
          paid_total: number
        }
      >()
      for (const inv of detailInvoices?.data ?? []) {
        const current = detailInvSum.get(inv.subscription_id) ?? {
          payment_count: 0,
          paid_payment_count: 0,
          paid_total: 0,
        }
        current.payment_count += 1
        if (inv.status === "paid") {
          current.paid_payment_count += 1
          current.paid_total += Number(inv.amount_paid)
        }
        detailInvSum.set(inv.subscription_id, current)
      }

      const ds = new Map<string, NonNullable<ProjectRow["subscription"]>>()
      for (const s of detailSubs.data ?? []) {
        if (!s.project_id) continue
        const invoiceSummary = detailInvSum.get(s.id) ?? {
          payment_count: 0,
          paid_payment_count: 0,
          paid_total: 0,
        }
        ds.set(s.project_id, {
          id: s.id,
          plan: s.plan,
          product: s.product,
          monthly_rate: Number(s.monthly_rate),
          status: s.status,
          started_at: s.started_at,
          stripe_subscription_id: s.stripe_subscription_id,
          payment_count: invoiceSummary.payment_count,
          paid_payment_count: invoiceSummary.paid_payment_count,
          paid_total: invoiceSummary.paid_total,
        })
      }

      const detailClientObj = Array.isArray(detail.client)
        ? detail.client[0]
        : detail.client
      const detailRepObj = Array.isArray(detail.rep)
        ? detail.rep[0]
        : detail.rep

      selectedProject = {
        id: detail.id,
        title: detail.title,
        description: detail.description,
        stage: detail.stage,
        value: detail.value != null ? Number(detail.value) : null,
        currency: detail.currency ?? "USD",
        financing_enabled: detail.financing_enabled,
        start_date: detail.start_date,
        deadline: detail.deadline,
        completed_at: detail.completed_at,
        payment_status: detail.payment_status,
        stripe_checkout_session_id: detail.stripe_checkout_session_id,
        paid_at: detail.paid_at,
        product_type: detail.product_type,
        deposit_rate: Number(detail.deposit_rate),
        deposit_amount:
          detail.deposit_amount != null ? Number(detail.deposit_amount) : null,
        deposit_paid_at: detail.deposit_paid_at,
        created_at: detail.created_at,
        client: detailClientObj
          ? {
              id: detailClientObj.id,
              name: detailClientObj.name,
              company: detailClientObj.company,
            }
          : null,
        rep: detailRepObj
          ? { id: detailRepObj.id, full_name: detailRepObj.full_name }
          : null,
        payments: dp.get(detail.id) ?? [],
        interactions: di.get(detail.id) ?? [],
        subscription: ds.get(detail.id) ?? null,
      }
    }
  }

  const selectedId = selectedProject?.id ?? null

  const clientOptions = (clientsRes.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    company: c.company,
  }))
  const repOptions = (repsRes.data ?? []).map((r) => ({
    id: r.id,
    full_name: r.full_name,
  }))

  function buildRowHref(id: string) {
    const next = new URLSearchParams()
    if (tab !== "all") next.set("tab", tab)
    if (product !== "all") next.set("product", product)
    if (payment !== "all") next.set("payment", payment)
    if (repFilter !== "all") next.set("rep", repFilter)
    if (sort !== "recent") next.set("sort", sort)
    if (q) next.set("q", q)
    if (currentPage > 1) next.set("page", String(currentPage))
    next.set("project", id)
    return `/projects?${next.toString()}`
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex min-h-0 flex-col border border-border/60">
          <div className="flex flex-wrap items-center gap-3 border-b border-border/60 px-4 py-3">
            <ProjectsTabs active={tab} counts={counts} />
            <div className="ml-auto flex items-center gap-2">
              <ProjectsSearch q={q} />
              <ProjectsFilters
                product={product}
                rep={repFilter}
                payment={payment}
                sort={sort}
                reps={repOptions}
              />
              <NewProjectDialog clients={clientOptions} reps={repOptions} />
            </div>
          </div>
          <ProjectsTable
            rows={visibleRows}
            selectedId={selectedId}
            buildRowHref={buildRowHref}
          />
          <ProjectsPagination
            page={currentPage}
            pageCount={pageCount}
            total={totalFiltered}
            className="mt-auto"
          />
        </div>
        <ProjectDetailPanel project={selectedProject} />
      </div>
    </div>
  )
}
