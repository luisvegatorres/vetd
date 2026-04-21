import { PageHeader } from "@/components/dashboard/page-header"
import { Dot } from "@/components/ui/dot"
import { PaymentDetailPanel } from "@/components/payments/payment-detail-panel"
import { PaymentsPagination } from "@/components/payments/payments-pagination"
import { PaymentsTable } from "@/components/payments/payments-table"
import { PaymentsTabs } from "@/components/payments/payments-tabs"
import {
  PaymentsFilters,
  PaymentsSearch,
} from "@/components/payments/payments-toolbar"
import {
  paymentStatusBucket,
  type PaymentRow,
  type PaymentSort,
  type PaymentStatusFilter,
  type PaymentTab,
} from "@/components/payments/payment-types"
import { createClient } from "@/lib/supabase/server"

const PAGE_SIZE = 15

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

function parseTab(v: string | undefined): PaymentTab {
  return v && (VALID_TABS as string[]).includes(v) ? (v as PaymentTab) : "all"
}

function parseStatus(v: string | undefined): PaymentStatusFilter {
  return v && (VALID_STATUSES as string[]).includes(v)
    ? (v as PaymentStatusFilter)
    : "all"
}

function parseSort(v: string | undefined): PaymentSort {
  return v && (VALID_SORTS as string[]).includes(v) ? (v as PaymentSort) : "recent"
}

function parsePage(v: string | undefined): number {
  const n = Number(v)
  return Number.isInteger(n) && n >= 1 ? n : 1
}

function paymentSortTime(row: PaymentRow): number {
  const iso = row.paid_at ?? row.created_at
  return new Date(iso).getTime()
}

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
  }>
}) {
  const sp = await searchParams
  const tab = parseTab(sp.tab)
  const status = parseStatus(sp.status)
  const sort = parseSort(sp.sort)
  const repFilter = sp.rep && UUID_RE.test(sp.rep) ? sp.rep : "all"
  const q = (sp.q ?? "").trim()
  const page = parsePage(sp.page)
  const selectedParam =
    sp.payment && UUID_RE.test(sp.payment) ? sp.payment : null

  const supabase = await createClient()

  const [paymentsRes, invoicesRes, subscriptionsRes, repsRes] =
    await Promise.all([
      supabase
        .from("payments")
        .select(
          `
            id, amount, currency, status, created_at, stripe_payment_intent_id,
            project:projects!payments_project_id_fkey (
              id, title, product_type,
              client:clients!projects_client_id_fkey (id, name, company),
              rep:profiles!projects_sold_by_fkey (id, full_name)
            )
          `
        ),
      supabase
        .from("subscription_invoices")
        .select(
          `
            id, amount_paid, currency, status, billing_reason,
            period_start, period_end, paid_at, created_at,
            stripe_invoice_id, stripe_payment_intent_id, subscription_id
          `
        ),
      supabase
        .from("subscriptions")
        .select(
          `
            id, plan, monthly_rate,
            client:clients!subscriptions_client_id_fkey (id, name, company),
            rep:profiles!subscriptions_sold_by_fkey (id, full_name),
            project:projects!subscriptions_project_id_fkey (
              id, title, product_type
            )
          `
        ),
      supabase
        .from("profiles")
        .select("id, full_name")
        .in("role", ["admin", "editor", "sales_rep"])
        .order("full_name"),
    ])

  if (paymentsRes.error) throw paymentsRes.error
  if (invoicesRes.error) throw invoicesRes.error
  if (subscriptionsRes.error) throw subscriptionsRes.error

  const subscriptionById = new Map<
    string,
    NonNullable<(typeof subscriptionsRes.data)>[number]
  >()
  for (const s of subscriptionsRes.data ?? []) {
    subscriptionById.set(s.id, s)
  }

  const oneTimeRows: PaymentRow[] = (paymentsRes.data ?? []).map((p) => {
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
    return {
      id: p.id,
      kind: "one_time",
      amount: Number(p.amount),
      currency: p.currency,
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
            product_type: projectObj.product_type,
          }
        : null,
      subscription: null,
      stripe_id: p.stripe_payment_intent_id,
      billing_reason: null,
      period_start: null,
      period_end: null,
    }
  })

  const subscriptionRows: PaymentRow[] = (invoicesRes.data ?? []).map((inv) => {
    const sub = subscriptionById.get(inv.subscription_id)
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
      currency: inv.currency,
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
            product_type: projectObj.product_type,
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
  })

  const allRows: PaymentRow[] = [...oneTimeRows, ...subscriptionRows]

  const counts: Record<PaymentTab, number> = {
    all: allRows.length,
    one_time: oneTimeRows.length,
    subscription: subscriptionRows.length,
  }

  const ql = q.toLowerCase()
  const filtered = allRows.filter((r) => {
    if (tab === "one_time" && r.kind !== "one_time") return false
    if (tab === "subscription" && r.kind !== "subscription") return false
    if (status !== "all" && paymentStatusBucket(r.status) !== status) return false
    if (repFilter !== "all" && r.rep?.id !== repFilter) return false
    if (!ql) return true
    const haystack = [
      r.client?.name,
      r.client?.company,
      r.project?.title,
      r.subscription?.plan,
      r.stripe_id,
    ]
      .filter(Boolean)
      .map((s) => (s as string).toLowerCase())
    return haystack.some((h) => h.includes(ql))
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "amount_desc") return b.amount - a.amount
    if (sort === "amount_asc") return a.amount - b.amount
    return paymentSortTime(b) - paymentSortTime(a)
  })

  const totalFiltered = sorted.length
  const pageCount = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const startIdx = (currentPage - 1) * PAGE_SIZE
  const visibleRows = sorted.slice(startIdx, startIdx + PAGE_SIZE)

  const selectedId =
    selectedParam && sorted.some((r) => r.id === selectedParam)
      ? selectedParam
      : (visibleRows[0]?.id ?? null)

  const selectedPayment = selectedId
    ? (allRows.find((r) => r.id === selectedId) ?? null)
    : null

  const paidTotal = allRows
    .filter((r) => paymentStatusBucket(r.status) === "paid")
    .reduce((sum, r) => sum + r.amount, 0)

  const paidTotalShort =
    paidTotal >= 1000
      ? `$${(paidTotal / 1000).toFixed(paidTotal % 1000 === 0 ? 0 : 1)}k`
      : `$${Math.round(paidTotal)}`

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
            <span>{allRows.length} Total</span>
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
