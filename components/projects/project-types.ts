import type { Database } from "@/lib/supabase/types"

export type ProjectStage = Database["public"]["Enums"]["project_stage"]
export type PaymentStatus = Database["public"]["Enums"]["payment_status"]
export type ProjectProductType =
  Database["public"]["Enums"]["project_product_type"]
export type InteractionType =
  Database["public"]["Enums"]["interaction_type"]

export type ProjectTab = "all" | ProjectStage

export const PRODUCT_TYPE_LABEL: Record<ProjectProductType, string> = {
  business_website: "Website",
  mobile_app: "Mobile App",
  web_app: "SaaS Product",
  ai_integration: "AI Integration",
}

export type ProjectClientRef = {
  id: string
  name: string
  company: string | null
}

export type ProjectRep = {
  id: string
  full_name: string | null
}

export type ProjectPayment = {
  amount: number
  status: string
}

export type ProjectInteraction = {
  type: InteractionType
  created_at: string
  summary: string | null
}

export type ProjectSubscription = {
  id: string
  plan: string
  product: string
  monthly_rate: number
  status: Database["public"]["Enums"]["subscription_status"]
  started_at: string
}

export type ProjectRow = {
  id: string
  title: string
  description: string | null
  stage: ProjectStage
  value: number | null
  currency: string
  financing_enabled: boolean
  start_date: string | null
  deadline: string | null
  completed_at: string | null
  commission_rate: number | null
  commission_flat: number | null
  commission_amount: number | null
  payment_status: PaymentStatus
  stripe_checkout_session_id: string | null
  paid_at: string | null
  product_type: ProjectProductType | null
  deposit_rate: number
  deposit_amount: number | null
  deposit_paid_at: string | null
  created_at: string
  client: ProjectClientRef | null
  rep: ProjectRep | null
  payments: ProjectPayment[]
  interactions: ProjectInteraction[]
  subscription: ProjectSubscription | null
}

export function projectDisplayClient(row: ProjectRow): string {
  if (!row.client) return "—"
  return row.client.company ?? row.client.name
}

export function isDepositPending(row: {
  value: number | null
  deposit_paid_at: string | null
  stage: ProjectStage
}): boolean {
  if (!row.value || row.value <= 0) return false
  if (row.deposit_paid_at) return false
  if (row.stage === "completed" || row.stage === "cancelled") return false
  return true
}

export function formatUsdShort(amount: number) {
  if (amount === 0) return "—"
  if (amount >= 1000) {
    const k = amount / 1000
    const trimmed = k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)
    return `$${trimmed}k`
  }
  return `$${Math.round(amount)}`
}

export function formatUsdFull(amount: number) {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  })
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function formatMonthYear(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" })
}
