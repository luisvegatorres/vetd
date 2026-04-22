import { PageHeader } from "@/components/dashboard/page-header"
import { Dot } from "@/components/ui/dot"
import { PaymentDetailPanel } from "@/components/payments/payment-detail-panel"
import { PaymentsPagination } from "@/components/payments/payments-pagination"
import { PaymentsTable } from "@/components/payments/payments-table"
import { PaymentsTabs } from "@/components/payments/payments-tabs"
import {
  PaymentsDateRange,
  PaymentsFilters,
  PaymentsSearch,
} from "@/components/payments/payments-toolbar"
import {
  type PaymentRow,
  type PaymentSort,
  type PaymentStatusFilter,
  type PaymentTab,
} from "@/components/payments/payment-types"
import { createClient } from "@/lib/supabase/server"

const PAGE_SIZE = 15

// Status strings → filter buckets. Kept in sync with `paymentStatusBucket()`
// in payment-types.ts; Stripe writes lowercase values so case-matching is safe.
const PAID_STATUSES = ["paid", "succeeded"]
const OPEN_STATUSES = ["open", "draft", "unpaid", "link_sent"]
const FAILED_STATUSES = ["failed", "uncollectible"]
const REFUNDED_STATUSES = ["refunded"]
const KNOWN_STATUSES = [
  ...PAID_STATUSES,
  ...OPEN_STATUSES,
  ...FAILED_STATUSES,
  ...REFUNDED_STATUSES,
]

function statusesForBucket(bucket: PaymentStatusFilter): string[] | null {
  if (bucket === "paid") return PAID_STATUSES
  if (bucket === "open") return OPEN_STATUSES
  if (bucket === "failed") return FAILED_STATUSES
  if (bucket === "refunded") return REFUNDED_STATUSES
  return null // "all" or "other" — handled specially
}

const VALID_TABS: PaymentTab[] = ["all", "one_time", "subscription"]
const VALID_STATUSES: PaymentStatusFilter[] = [
  "all",
  "paid",
  "open",
  "failed",
  "refunded",
  "other",
]
const VALID_SORTS: PaymentSort[] = ["recent", "amount_desc", "amount_asc"]

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function parseIsoDate(v: string | undefined): string {
  return v && ISO_DATE_RE.test(v) ? v : ""
}

function startOfDayIso(iso: string): string {
  // Interpreted as local midnight, then re-formatted as a full ISO timestamp
  // so Supabase treats the comparison as inclusive.
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString()
}

function endOfDayIso(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString()
}

function parseTab(v: string | undefined): PaymentTab {
  return v && (VALID_TABS as string[]).includes(v) ? (v as PaymentTab) : "all"
}

function parseStatus(v: string | undefined): PaymentStatusFilter {
  return v && (VALID_STATUSES as string[]).includes(v)
    ? (v as PaymentStatusFilter)
    : "all"
}

function parseSort(v: string | undefined): PaymentSort {
  return v && (VALID_SORTS as string[]).includes(v)
    ? (v as PaymentSort)
    : "recent"
}

function parsePage(v: string | undefined): number {
  const n = Number(v)
  return Number.isInteger(n) && n >= 1 ? n : 1
}

const PAYMENT_COLUMNS = `
  id, amount, currency, status, created_at, stripe_payment_intent_id,
  project:projects!payments_project_id_fkey (
    id, title, product_type,
    client:clients!projects_client_id_fkey (id, name, company),
    rep:profiles!projects_sold_by_fkey (id, full_name)
  )
`

const INVOICE_COLUMNS = `
  id, amount_paid, currency, status, billing_reason,
  period_start, period_end, paid_at, created_at,
  stripe_invoice_id, stripe_payment_intent_id, subscription_id
`

const SUBSCRIPTION_COLUMNS = `
  id, plan, monthly_rate,
  client:clients!subscriptions_client_id_fkey (id, name, company),
  rep:profiles!subscriptions_sold_by_fkey (id, full_name),
  project:projects!subscriptions_project_id_fkey (
    id, title, product_type
  )
`

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string
    payment?: string
    q?: string
    status?: string
    rep?: string
    sort?: string
    page?: string
    from?: string
    to?: string
  }>
}) {
  const sp = await searchParams
  const tab = parseTab(sp.tab)
  const status = parseStatus(sp.status)
  const sort = parseSort(sp.sort)
  const repFilter = sp.rep && UUID_RE.test(sp.rep) ? sp.rep : "all"
  const q = (sp.q ?? "").trim()
  const page = parsePage(sp.page)
  const fromIso = parseIsoDate(sp.from)
  const toIso = parseIsoDate(sp.to)
  const fromTs = fromIso ? startOfDayIso(fromIso) : null
  const toTs = toIso ? endOfDayIso(toIso) : null
  const selectedParam =
    sp.payment && UUID_RE.test(sp.payment) ? sp.payment : null

  const supabase = await createClient()

  const qLike = q ? `%${q.replace(/[%_]/g, (c) => `\\${c}`)}%` : null

  // Pre-resolve matching client, project, and subscription IDs so search
  // works across joined tables without a database view.
  let matchingClientIds: string[] = []
  let matchingProjectIds: string[] = []
  let matchingSubscriptionIds: string[] = []
  if (qLike) {
    const [clientMatches, projectMatches, subMatches] = await Promise.all([
      supabase
        .from("clients")
        .select("id")
        .or(`name.ilike.${qLike},company.ilike.${qLike}`)
        .limit(500),
      supabase.from("projects").select("id").ilike("title", qLike).limit(500),
      supabase
        .from("subscriptions")
        .select("id")
        .ilike("plan", qLike)
        .limit(500),
    ])
    if (clientMatches.error) throw clientMatches.error
    if (projectMatches.error) throw projectMatches.error
    if (subMatches.error) throw subMatches.error
    matchingClientIds = (clientMatches.data ?? []).map((c) => c.id)
    matchingProjectIds = (projectMatches.data ?? []).map((p) => p.id)
    matchingSubscriptionIds = (subMatches.data ?? []).map((s) => s.id)
  }

  // Build .or clauses. Search matches when:
  //   payments.stripe_payment_intent_id ilike q
  //     OR payments.project_id ∈ matching project IDs
  //     OR payments.project_id refs a client/rep in matching sets (via project)
  //
  // Only root-table columns can live in a single .or() list (PostgREST can't
  // OR across joined-table predicates reliably). We fan out via the
  // pre-resolved ID sets. `projects.client_id` is needed for the one-time
  // search-by-client-name case — that means we first need project IDs for
  // matching clients.
  let projectIdsForMatchingClients: string[] = []
  if (qLike && matchingClientIds.length > 0) {
    const { data, error } = await supabase
      .from("projects")
      .select("id")
      .in("client_id", matchingClientIds)
      .limit(500)
    if (error) throw error
    projectIdsForMatchingClients = (data ?? []).map((r) => r.id)
  }
  let subscriptionIdsForMatchingClients: string[] = []
  if (qLike && matchingClientIds.length > 0) {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("id")
      .in("client_id", matchingClientIds)
      .limit(500)
    if (error) throw error
    subscriptionIdsForMatchingClients = (data ?? []).map((r) => r.id)
  }

  const paymentsSearchProjectIds = Array.from(
    new Set([...matchingProjectIds, ...projectIdsForMatchingClients]),
  )
  const invoicesSearchSubIds = Array.from(
    new Set([
      ...matchingSubscriptionIds,
      ...subscriptionIdsForMatchingClients,
    ]),
  )

  function paymentsOrClauseForSearch(): string | null {
    if (!qLike) return null
    const clauses: string[] = [`stripe_payment_intent_id.ilike.${qLike}`]
    if (paymentsSearchProjectIds.length > 0) {
      clauses.push(`project_id.in.(${paymentsSearchProjectIds.join(",")})`)
    }
    return clauses.join(",")
  }
  function invoicesOrClauseForSearch(): string | null {
    if (!qLike) return null
    const clauses: string[] = [
      `stripe_invoice_id.ilike.${qLike}`,
      `stripe_payment_intent_id.ilike.${qLike}`,
    ]
    if (invoicesSearchSubIds.length > 0) {
      clauses.push(`subscription_id.in.(${invoicesSearchSubIds.join(",")})`)
    }
    return clauses.join(",")
  }

  // Rep filter on subscription_invoices requires a pre-resolved subscription
  // ID set (invoices don't carry sold_by directly; that lives on
  // subscriptions). Resolve it once.
  let repSubscriptionIds: string[] | null = null
  if (repFilter !== "all") {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("sold_by", repFilter)
      .limit(5000)
    if (error) throw error
    repSubscriptionIds = (data ?? []).map((r) => r.id)
  }
  // When no subscriptions for the rep, this sentinel forces an empty result
  // without breaking the .in() chain.
  const INVOICE_REP_EMPTY = ["00000000-0000-0000-0000-000000000000"]

  // ---------- counts ----------
  function buildPaymentsCountQuery() {
    let q = supabase
      .from("payments")
      .select("id", { count: "exact", head: true })
    const bucketList = statusesForBucket(status)
    if (bucketList) q = q.in("status", bucketList)
    else if (status === "other")
      q = q.not("status", "in", `(${KNOWN_STATUSES.join(",")})`)
    if (fromTs) q = q.gte("created_at", fromTs)
    if (toTs) q = q.lte("created_at", toTs)
    const orClause = paymentsOrClauseForSearch()
    if (orClause) q = q.or(orClause)
    if (repFilter !== "all") q = q.eq("project.sold_by", repFilter)
    return q
  }

  function buildInvoicesCountQuery() {
    let q = supabase
      .from("subscription_invoices")
      .select("id", { count: "exact", head: true })
    const bucketList = statusesForBucket(status)
    if (bucketList) q = q.in("status", bucketList)
    else if (status === "other")
      q = q.not("status", "in", `(${KNOWN_STATUSES.join(",")})`)
    if (fromTs) q = q.gte("created_at", fromTs)
    if (toTs) q = q.lte("created_at", toTs)
    const orClause = invoicesOrClauseForSearch()
    if (orClause) q = q.or(orClause)
    if (repFilter !== "all") {
      const ids =
        repSubscriptionIds && repSubscriptionIds.length > 0
          ? repSubscriptionIds
          : INVOICE_REP_EMPTY
      q = q.in("subscription_id", ids)
    }
    return q
  }

  const paymentsCountPromise = buildPaymentsCountQuery()
  const invoicesCountPromise = buildInvoicesCountQuery()

  // ---------- header aggregates ----------
  // Unfiltered totals: collected (paid) and failed. Payloads are small
  // (just amounts), not the full joined row.

  const paidPaymentsAmountsPromise = supabase
    .from("payments")
    .select("amount")
    .in("status", PAID_STATUSES)
  const paidInvoicesAmountsPromise = supabase
    .from("subscription_invoices")
    .select("amount_paid")
    .in("status", PAID_STATUSES)
  const failedPaymentsAmountsPromise = supabase
    .from("payments")
    .select("amount")
    .in("status", FAILED_STATUSES)
  const failedInvoicesAmountsPromise = supabase
    .from("subscription_invoices")
    .select("amount_paid")
    .in("status", FAILED_STATUSES)

  // Overall total (all payments + invoices, no filters). Two count queries.
  const overallPaymentsCountPromise = supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
  const overallInvoicesCountPromise = supabase
    .from("subscription_invoices")
    .select("id", { count: "exact", head: true })

  const repOptionsPromise = supabase
    .from("profiles")
    .select("id, full_name")
    .in("role", ["admin", "editor", "sales_rep"])
    .order("full_name")

  // ---------- visible slice ----------
  // Tab decides which tables are fetched. Cross-table sort on tab=all uses
  // a "fetch more than needed per table, merge, slice" strategy which is
  // correct for the first N pages. Deep paging on tab=all is a documented
  // trade-off; the fix is a database view with UNION ALL.
  const sortAsc = sort === "amount_asc"
  const amountSort = sort === "amount_asc" || sort === "amount_desc"

  function orderedPaymentsQuery() {
    let q = supabase.from("payments").select(PAYMENT_COLUMNS)
    const bucketList = statusesForBucket(status)
    if (bucketList) q = q.in("status", bucketList)
    else if (status === "other")
      q = q.not("status", "in", `(${KNOWN_STATUSES.join(",")})`)
    if (fromTs) q = q.gte("created_at", fromTs)
    if (toTs) q = q.lte("created_at", toTs)
    const orClause = paymentsOrClauseForSearch()
    if (orClause) q = q.or(orClause)
    if (repFilter !== "all") q = q.eq("project.sold_by", repFilter)
    if (amountSort) {
      return q.order("amount", { ascending: sortAsc, nullsFirst: false })
    }
    return q.order("created_at", { ascending: false })
  }

  function orderedInvoicesQuery() {
    let q = supabase.from("subscription_invoices").select(INVOICE_COLUMNS)
    const bucketList = statusesForBucket(status)
    if (bucketList) q = q.in("status", bucketList)
    else if (status === "other")
      q = q.not("status", "in", `(${KNOWN_STATUSES.join(",")})`)
    if (fromTs) q = q.gte("created_at", fromTs)
    if (toTs) q = q.lte("created_at", toTs)
    const orClause = invoicesOrClauseForSearch()
    if (orClause) q = q.or(orClause)
    if (repFilter !== "all") {
      const ids =
        repSubscriptionIds && repSubscriptionIds.length > 0
          ? repSubscriptionIds
          : INVOICE_REP_EMPTY
      q = q.in("subscription_id", ids)
    }
    if (amountSort) {
      return q.order("amount_paid", { ascending: sortAsc, nullsFirst: false })
    }
    // Order by paid_at when present, else created_at. PostgREST can't do a
    // single COALESCE order; two consecutive order() calls use paid_at first
    // with nulls last, then created_at.
    return q
      .order("paid_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
  }

  // For tab=all, fetch up to (currentPage * PAGE_SIZE) rows from each table
  // so the merge can produce the requested page. Bounded to a reasonable
  // cap — deep pagination on tab=all is not supported.
  const MAX_MERGE_DEPTH = 300 // roughly 20 pages at PAGE_SIZE=15
  const mergeLimit = Math.min(page * PAGE_SIZE, MAX_MERGE_DEPTH)

  const paymentsSliceRangeEnd =
    tab === "one_time" ? page * PAGE_SIZE - 1 : mergeLimit - 1
  const invoicesSliceRangeEnd =
    tab === "subscription" ? page * PAGE_SIZE - 1 : mergeLimit - 1

  const paymentsSlicePromise =
    tab === "subscription"
      ? Promise.resolve({ data: [] as unknown[], error: null })
      : orderedPaymentsQuery().range(0, paymentsSliceRangeEnd)
  const invoicesSlicePromise =
    tab === "one_time"
      ? Promise.resolve({ data: [] as unknown[], error: null })
      : orderedInvoicesQuery().range(0, invoicesSliceRangeEnd)

  // Subscriptions needed to hydrate invoice rows. Fetch only those referenced
  // by the visible invoice slice.
  // (Resolved below after the slice lands.)

  const [
    paymentsCountRes,
    invoicesCountRes,
    paidPaymentsAmountsRes,
    paidInvoicesAmountsRes,
    failedPaymentsAmountsRes,
    failedInvoicesAmountsRes,
    overallPaymentsCountRes,
    overallInvoicesCountRes,
    repsRes,
    paymentsSliceRes,
    invoicesSliceRes,
  ] = await Promise.all([
    paymentsCountPromise,
    invoicesCountPromise,
    paidPaymentsAmountsPromise,
    paidInvoicesAmountsPromise,
    failedPaymentsAmountsPromise,
    failedInvoicesAmountsPromise,
    overallPaymentsCountPromise,
    overallInvoicesCountPromise,
    repOptionsPromise,
    paymentsSlicePromise,
    invoicesSlicePromise,
  ])

  if (paidPaymentsAmountsRes.error) throw paidPaymentsAmountsRes.error
  if (paidInvoicesAmountsRes.error) throw paidInvoicesAmountsRes.error
  if (failedPaymentsAmountsRes.error) throw failedPaymentsAmountsRes.error
  if (failedInvoicesAmountsRes.error) throw failedInvoicesAmountsRes.error

  type PaymentsSlice =
    | Awaited<ReturnType<typeof orderedPaymentsQuery>>
    | { data: unknown[]; error: null }
  type InvoicesSlice =
    | Awaited<ReturnType<typeof orderedInvoicesQuery>>
    | { data: unknown[]; error: null }
  const pRes = paymentsSliceRes as PaymentsSlice
  const iRes = invoicesSliceRes as InvoicesSlice
  if ("error" in pRes && pRes.error) throw pRes.error
  if ("error" in iRes && iRes.error) throw iRes.error

  type PaymentDbRow = {
    id: string
    amount: number | string
    currency: string | null
    status: string
    created_at: string
    stripe_payment_intent_id: string | null
    project:
      | {
          id: string
          title: string
          product_type: string | null
          client:
            | { id: string; name: string; company: string | null }
            | { id: string; name: string; company: string | null }[]
            | null
          rep:
            | { id: string; full_name: string | null }
            | { id: string; full_name: string | null }[]
            | null
        }
      | {
          id: string
          title: string
          product_type: string | null
          client:
            | { id: string; name: string; company: string | null }
            | { id: string; name: string; company: string | null }[]
            | null
          rep:
            | { id: string; full_name: string | null }
            | { id: string; full_name: string | null }[]
            | null
        }[]
      | null
  }
  type InvoiceDbRow = {
    id: string
    amount_paid: number | string
    currency: string | null
    status: string
    billing_reason: string | null
    period_start: string | null
    period_end: string | null
    paid_at: string | null
    created_at: string
    stripe_invoice_id: string | null
    stripe_payment_intent_id: string | null
    subscription_id: string
  }

  const rawPayments = (pRes.data ?? []) as PaymentDbRow[]
  const rawInvoices = (iRes.data ?? []) as InvoiceDbRow[]

  // Hydrate subscription refs for visible invoices only.
  const invoiceSubIds = Array.from(
    new Set(rawInvoices.map((i) => i.subscription_id).filter(Boolean)),
  )
  type SubDbRow = {
    id: string
    plan: string
    monthly_rate: number | string
    client:
      | { id: string; name: string; company: string | null }
      | { id: string; name: string; company: string | null }[]
      | null
    rep:
      | { id: string; full_name: string | null }
      | { id: string; full_name: string | null }[]
      | null
    project:
      | { id: string; title: string; product_type: string | null }
      | { id: string; title: string; product_type: string | null }[]
      | null
  }
  let subsById = new Map<string, SubDbRow>()
  if (invoiceSubIds.length > 0) {
    const { data: subs, error: subsErr } = await supabase
      .from("subscriptions")
      .select(SUBSCRIPTION_COLUMNS)
      .in("id", invoiceSubIds)
    if (subsErr) throw subsErr
    subsById = new Map<string, SubDbRow>(
      (subs ?? []).map((s) => [s.id, s as SubDbRow]),
    )
  }

  function hydrateOneTime(p: PaymentDbRow): PaymentRow {
    const projectObj = Array.isArray(p.project) ? p.project[0] : p.project
    const clientObj = projectObj
      ? Array.isArray(projectObj.client)
        ? projectObj.client[0]
        : projectObj.client
      : null
    const repObj = projectObj
      ? Array.isArray(projectObj.rep)
        ? projectObj.rep[0]
        : projectObj.rep
      : null
    const amt = Number(p.amount)
    return {
      id: p.id,
      kind: "one_time",
      amount: amt,
      currency: p.currency ?? "usd",
      status: p.status,
      created_at: p.created_at,
      paid_at:
        p.status === "paid" || p.status === "succeeded" ? p.created_at : null,
      client: clientObj
        ? {
            id: clientObj.id,
            name: clientObj.name,
            company: clientObj.company,
          }
        : null,
      rep: repObj ? { id: repObj.id, full_name: repObj.full_name } : null,
      project: projectObj
        ? {
            id: projectObj.id,
            title: projectObj.title,
            product_type:
              projectObj.product_type as NonNullable<
                PaymentRow["project"]
              >["product_type"],
          }
        : null,
      subscription: null,
      stripe_id: p.stripe_payment_intent_id,
      billing_reason: null,
      period_start: null,
      period_end: null,
    }
  }

  function hydrateInvoice(inv: InvoiceDbRow): PaymentRow {
    const sub = subsById.get(inv.subscription_id)
    const clientObj = sub
      ? Array.isArray(sub.client)
        ? sub.client[0]
        : sub.client
      : null
    const repObj = sub ? (Array.isArray(sub.rep) ? sub.rep[0] : sub.rep) : null
    const projectObj = sub
      ? Array.isArray(sub.project)
        ? sub.project[0]
        : sub.project
      : null
    return {
      id: inv.id,
      kind: "subscription",
      amount: Number(inv.amount_paid),
      currency: inv.currency ?? "usd",
      status: inv.status,
      created_at: inv.created_at,
      paid_at: inv.paid_at,
      client: clientObj
        ? {
            id: clientObj.id,
            name: clientObj.name,
            company: clientObj.company,
          }
        : null,
      rep: repObj ? { id: repObj.id, full_name: repObj.full_name } : null,
      project: projectObj
        ? {
            id: projectObj.id,
            title: projectObj.title,
            product_type:
              projectObj.product_type as NonNullable<
                PaymentRow["project"]
              >["product_type"],
          }
        : null,
      subscription: sub
        ? {
            id: sub.id,
            plan: sub.plan,
            monthly_rate: Number(sub.monthly_rate),
          }
        : null,
      stripe_id: inv.stripe_invoice_id ?? inv.stripe_payment_intent_id,
      billing_reason: inv.billing_reason,
      period_start: inv.period_start,
      period_end: inv.period_end,
    }
  }

  // Build merged + windowed rows.
  const oneTimeRows = rawPayments.map(hydrateOneTime)
  const subscriptionRows = rawInvoices.map(hydrateInvoice)

  let mergedCandidates: PaymentRow[]
  if (tab === "one_time") mergedCandidates = oneTimeRows
  else if (tab === "subscription") mergedCandidates = subscriptionRows
  else mergedCandidates = [...oneTimeRows, ...subscriptionRows]

  // Merge-sort (only matters for tab=all; single-table tabs are already sorted
  // server-side).
  if (tab === "all") {
    if (amountSort) {
      mergedCandidates.sort((a, b) =>
        sortAsc ? a.amount - b.amount : b.amount - a.amount,
      )
    } else {
      mergedCandidates.sort((a, b) => {
        const at = new Date(a.paid_at ?? a.created_at).getTime()
        const bt = new Date(b.paid_at ?? b.created_at).getTime()
        return bt - at
      })
    }
  }

  const paymentsTotal = paymentsCountRes.count ?? 0
  const invoicesTotal = invoicesCountRes.count ?? 0
  const totalFiltered =
    tab === "one_time"
      ? paymentsTotal
      : tab === "subscription"
        ? invoicesTotal
        : paymentsTotal + invoicesTotal

  const pageCount = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const startIdx = (currentPage - 1) * PAGE_SIZE
  let visibleRows: PaymentRow[]
  if (tab === "all") {
    visibleRows = mergedCandidates.slice(startIdx, startIdx + PAGE_SIZE)
  } else {
    // Single-table tabs already fetched exactly the window we want.
    visibleRows = mergedCandidates.slice(0, PAGE_SIZE)
  }

  // Header aggregate totals.
  const paidTotal =
    (paidPaymentsAmountsRes.data ?? []).reduce(
      (s, r) => s + Number(r.amount),
      0,
    ) +
    (paidInvoicesAmountsRes.data ?? []).reduce(
      (s, r) => s + Number(r.amount_paid),
      0,
    )

  const failedPaymentCount =
    (failedPaymentsAmountsRes.data?.length ?? 0) +
    (failedInvoicesAmountsRes.data?.length ?? 0)
  const failedTotal =
    (failedPaymentsAmountsRes.data ?? []).reduce(
      (s, r) => s + Number(r.amount),
      0,
    ) +
    (failedInvoicesAmountsRes.data ?? []).reduce(
      (s, r) => s + Number(r.amount_paid),
      0,
    )

  const overallTotal =
    (overallPaymentsCountRes.count ?? 0) + (overallInvoicesCountRes.count ?? 0)

  const counts: Record<PaymentTab, number> = {
    all: paymentsTotal + invoicesTotal,
    one_time: paymentsTotal,
    subscription: invoicesTotal,
  }

  // Resolve the selected payment. If not in the visible slice, fetch by ID.
  let selectedPayment: PaymentRow | null =
    (selectedParam
      ? (visibleRows.find((r) => r.id === selectedParam) ?? null)
      : null) ??
    visibleRows[0] ??
    null

  if (
    selectedParam &&
    selectedPayment?.id !== selectedParam &&
    !visibleRows.some((r) => r.id === selectedParam)
  ) {
    // Try one_time first, then subscription.
    const { data: pOne } = await supabase
      .from("payments")
      .select(PAYMENT_COLUMNS)
      .eq("id", selectedParam)
      .maybeSingle()
    if (pOne) {
      selectedPayment = hydrateOneTime(pOne as PaymentDbRow)
    } else {
      const { data: pSub } = await supabase
        .from("subscription_invoices")
        .select(INVOICE_COLUMNS)
        .eq("id", selectedParam)
        .maybeSingle()
      if (pSub) {
        const inv = pSub as InvoiceDbRow
        if (!subsById.has(inv.subscription_id)) {
          const { data: sub } = await supabase
            .from("subscriptions")
            .select(SUBSCRIPTION_COLUMNS)
            .eq("id", inv.subscription_id)
            .maybeSingle()
          if (sub) subsById.set(inv.subscription_id, sub as SubDbRow)
        }
        selectedPayment = hydrateInvoice(inv)
      }
    }
  }

  const selectedId = selectedPayment?.id ?? null

  function formatUsdShortCompact(amount: number): string {
    if (amount >= 1000) {
      const k = amount / 1000
      const trimmed = k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)
      return `$${trimmed}k`
    }
    return `$${Math.round(amount)}`
  }

  const paidTotalShort = formatUsdShortCompact(paidTotal)
  const failedTotalShort = formatUsdShortCompact(failedTotal)

  const repOptions = (repsRes.data ?? []).map((r) => ({
    id: r.id,
    full_name: r.full_name,
  }))

  function buildRowHref(id: string) {
    const next = new URLSearchParams()
    if (tab !== "all") next.set("tab", tab)
    if (status !== "all") next.set("status", status)
    if (repFilter !== "all") next.set("rep", repFilter)
    if (sort !== "recent") next.set("sort", sort)
    if (q) next.set("q", q)
    if (fromIso) next.set("from", fromIso)
    if (toIso) next.set("to", toIso)
    if (currentPage > 1) next.set("page", String(currentPage))
    next.set("payment", id)
    return `/payments?${next.toString()}`
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Payments"
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span>{paidTotalShort} Collected</span>
            <Dot />
            {failedPaymentCount > 0 ? (
              <>
                <span className="text-orange-500">
                  {failedTotalShort} Failed
                </span>
                <Dot />
              </>
            ) : null}
            <span>{overallTotal} Total</span>
            <Dot />
            <span>{totalFiltered} Showing</span>
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex min-h-0 flex-col border border-border/60">
          <div className="flex flex-wrap items-center gap-3 border-b border-border/60 px-4 py-3">
            <PaymentsTabs active={tab} counts={counts} />
            <div className="ml-auto flex items-center gap-2">
              <PaymentsSearch q={q} />
              <PaymentsDateRange from={fromIso} to={toIso} />
              <PaymentsFilters
                status={status}
                rep={repFilter}
                sort={sort}
                reps={repOptions}
              />
            </div>
          </div>
          <PaymentsTable
            rows={visibleRows}
            selectedId={selectedId}
            buildRowHref={buildRowHref}
          />
          <PaymentsPagination
            page={currentPage}
            pageCount={pageCount}
            total={totalFiltered}
            className="mt-auto"
          />
        </div>
        <PaymentDetailPanel payment={selectedPayment} />
      </div>
    </div>
  )
}
