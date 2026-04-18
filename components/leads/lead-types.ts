import type { Database } from "@/lib/supabase/types"

export type ClientStatus = Database["public"]["Enums"]["client_status"]
export type ClientSource = Database["public"]["Enums"]["client_source"]

export type LeadTab = "all" | "new" | "contacted" | "qualified" | "archived"
export type LeadDerivedStatus = Exclude<LeadTab, "all">

export type LeadOwner = {
  id: string
  full_name: string | null
}

export type LeadRow = {
  id: string
  lead_number: number
  name: string
  company: string | null
  email: string | null
  phone: string | null
  score: number | null
  intent: string | null
  budget: string | null
  notes: string | null
  source: ClientSource
  status: ClientStatus
  created_at: string
  owner: LeadOwner | null
  has_interactions: boolean
}

export const SOURCE_LABEL: Record<ClientSource, string> = {
  contact_form: "Contact form",
  referral: "Referral",
  cold_outreach: "Outbound",
  social: "Social",
  event: "Event",
  rep_field: "Rep field",
  other: "Other",
}

export function deriveStatus(row: {
  status: ClientStatus
  has_interactions: boolean
}): LeadDerivedStatus {
  if (row.status === "qualified") return "qualified"
  if (row.status === "archived" || row.status === "lost") return "archived"
  return row.has_interactions ? "contacted" : "new"
}

export function scoreBarColorClass(score: number | null) {
  if (score == null) return "bg-muted-foreground/60"
  if (score >= 70) return "bg-emerald-500"
  if (score >= 40) return "bg-amber-500"
  return "bg-red-500"
}

export function formatLeadNumber(n: number) {
  return `L-${n.toString().padStart(3, "0")}`
}

export function formatAge(iso: string, now = new Date()) {
  const created = new Date(iso)
  const diffMs = now.getTime() - created.getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 60) return `${Math.max(mins, 1)}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w`
  const months = Math.floor(days / 30)
  return `${months}mo`
}

