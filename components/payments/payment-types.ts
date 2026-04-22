import type { ProjectProductType } from "@/components/projects/project-types"

export type PaymentKind = "one_time" | "subscription"

export type PaymentTab = "all" | "one_time" | "subscription"

export type PaymentSort = "recent" | "amount_desc" | "amount_asc"

export type PaymentStatusFilter =
  | "all"
  | "paid"
  | "open"
  | "failed"
  | "refunded"
  | "other"

export type PaymentClientRef = {
  id: string
  name: string
  company: string | null
}

export type PaymentRep = {
  id: string
  full_name: string | null
}

export type PaymentProjectRef = {
  id: string
  title: string
  product_type: ProjectProductType | null
}

export type PaymentSubscriptionRef = {
  id: string
  plan: string
  monthly_rate: number
}

export type PaymentRow = {
  id: string
  kind: PaymentKind
  amount: number
  currency: string
  /**
   * Raw status from Stripe. One-time uses `payments.status` (paid/succeeded/
   * failed/refunded/...); subscription uses `subscription_invoices.status`
   * (paid/open/void/uncollectible/draft).
   */
  status: string
  created_at: string
  paid_at: string | null
  client: PaymentClientRef | null
  rep: PaymentRep | null
  project: PaymentProjectRef | null
  subscription: PaymentSubscriptionRef | null
  stripe_id: string | null
  /** Only for subscription invoices. */
  billing_reason: string | null
  period_start: string | null
  period_end: string | null
}

export const PAYMENT_KIND_LABEL: Record<PaymentKind, string> = {
  one_time: "One-time",
  subscription: "Subscription",
}

export const PAYMENT_SORT_LABEL: Record<PaymentSort, string> = {
  recent: "Most recent",
  amount_desc: "Amount (high to low)",
  amount_asc: "Amount (low to high)",
}

export const PAYMENT_STATUS_FILTER_LABEL: Record<PaymentStatusFilter, string> =
  {
    all: "All statuses",
    paid: "Paid",
    open: "Open",
    failed: "Failed",
    refunded: "Refunded",
    other: "Other",
  }

/**
 * Collapse raw Stripe/webhook statuses into the five filter buckets shown in
 * the toolbar. Unknown statuses fall into "other".
 */
export function paymentStatusBucket(status: string): PaymentStatusFilter {
  const s = status.toLowerCase()
  if (s === "paid" || s === "succeeded") return "paid"
  if (s === "open" || s === "draft" || s === "unpaid" || s === "link_sent")
    return "open"
  if (s === "failed" || s === "uncollectible") return "failed"
  if (s === "refunded") return "refunded"
  return "other"
}

export function billingReasonLabel(reason: string | null): string {
  if (!reason) return "—"
  if (reason === "subscription_create") return "First invoice"
  if (reason === "subscription_cycle") return "Renewal"
  if (reason === "subscription_update") return "Plan change"
  if (reason === "manual") return "Manual"
  return reason.replace(/^subscription_/, "").replace(/_/g, " ")
}

export function paymentDisplayClient(row: PaymentRow): string {
  if (!row.client) return "—"
  return row.client.company ?? row.client.name
}

export function paymentSourceLabel(row: PaymentRow): string {
  if (row.kind === "subscription") {
    return row.subscription?.plan ?? "Subscription"
  }
  return row.project?.title ?? "Project"
}

/**
 * A payment is "needs attention" if its status falls in the failed bucket
 * (failed one-time payment, or `uncollectible` subscription invoice). Surfaces
 * problems that require manual follow-up.
 */
export function isPaymentFailed(row: PaymentRow): boolean {
  return paymentStatusBucket(row.status) === "failed"
}
