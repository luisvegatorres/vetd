import type { Database } from "@/lib/supabase/types"

export type ClientStatus = Database["public"]["Enums"]["client_status"]
export type SubscriptionStatus =
  Database["public"]["Enums"]["subscription_status"]
export type ProjectStage = Database["public"]["Enums"]["project_stage"]
export type PaymentStatus = Database["public"]["Enums"]["payment_status"]

export type ClientTab =
  | "all"
  | "active"
  | "lead"
  | "qualified"
  | "at_risk"
  | "archived"
export type ClientDerivedStatus = Exclude<ClientTab, "all">

export type ClientOwner = {
  id: string
  full_name: string | null
}

export type ClientProjectSummary = {
  id: string
  title: string
  stage: ProjectStage
  payment_status: PaymentStatus
  value: number | null
}

export type ClientSubscriptionSummary = {
  id: string
  product: string
  plan: string
  monthly_rate: number
  status: SubscriptionStatus
  started_at: string
}

export type ClientRow = {
  id: string
  client_number: number
  name: string
  company: string | null
  email: string | null
  phone: string | null
  industry: string | null
  location: string | null
  status: ClientStatus
  notes: string | null
  created_at: string
  owner: ClientOwner | null
  lifetime: number
  mrr: number
  projects: ClientProjectSummary[]
  subscriptions: ClientSubscriptionSummary[]
}

export function deriveClientStatus(row: {
  status: ClientStatus
  subscriptions: { status: SubscriptionStatus }[]
}): ClientDerivedStatus {
  if (row.status === "archived" || row.status === "lost") return "archived"
  if (row.status === "lead") return "lead"
  if (row.status === "qualified") return "qualified"
  const hasAtRisk = row.subscriptions.some((s) => s.status === "at_risk")
  if (hasAtRisk) return "at_risk"
  return "active"
}

export function formatClientNumber(n: number) {
  return `C-${n.toString().padStart(2, "0")}`
}

export function clientDisplayName(row: { name: string; company: string | null }) {
  return row.company ?? row.name
}

export function formatMonthYear(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" })
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

/** Two-letter initials, taking the first character of the first two words. */
export function initialsOf(input: string): string {
  const words = input.trim().split(/\s+/).slice(0, 2)
  const letters = words.map((w) => w[0] ?? "").join("")
  return letters.toUpperCase() || "—"
}
