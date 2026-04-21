import type { Database } from "@/lib/supabase/types"

export type ProjectStage = Database["public"]["Enums"]["project_stage"]
export type ClientStatus = Database["public"]["Enums"]["client_status"]
export type PaymentStatus = Database["public"]["Enums"]["payment_status"]

export type StatusTone = {
  label: string
  /** Foreground text color for inline labels (e.g. stage name next to a value). */
  text: string
  /** Solid fill for bars, dots, and progress indicators. */
  bar: string
  /** Tinted surface + matching text, for pill-style badges. */
  badge: string
}

export const PROJECT_STAGE_LABEL: Record<ProjectStage, string> = {
  proposal: "Proposal",
  negotiation: "Negotiation",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
}

const PROJECT_STAGE_TONE: Record<ProjectStage, Omit<StatusTone, "label">> = {
  proposal: {
    text: "text-sky-400",
    bar: "bg-sky-400",
    badge: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  negotiation: {
    text: "text-indigo-400",
    bar: "bg-indigo-400",
    badge: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  },
  active: {
    text: "text-emerald-400",
    bar: "bg-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  completed: {
    text: "text-muted-foreground",
    bar: "bg-muted-foreground/60",
    badge: "bg-muted text-muted-foreground",
  },
  cancelled: {
    text: "text-destructive",
    bar: "bg-destructive/50",
    badge: "bg-destructive/10 text-destructive",
  },
}

export function projectStageTone(stage: ProjectStage): StatusTone {
  return { label: PROJECT_STAGE_LABEL[stage], ...PROJECT_STAGE_TONE[stage] }
}

export type LeadDerivedStatus = "new" | "contacted" | "qualified" | "archived"

const LEAD_STATUS_LABEL: Record<LeadDerivedStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  archived: "Archived",
}

const LEAD_STATUS_TONE: Record<LeadDerivedStatus, Omit<StatusTone, "label">> = {
  new: {
    text: "text-sky-400",
    bar: "bg-sky-400",
    badge: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  contacted: {
    text: "text-foreground",
    bar: "bg-foreground/60",
    badge: "bg-foreground/10 text-foreground",
  },
  qualified: {
    text: "text-indigo-400",
    bar: "bg-indigo-400",
    badge: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  },
  archived: {
    text: "text-muted-foreground",
    bar: "bg-muted-foreground/60",
    badge: "bg-muted text-muted-foreground",
  },
}

export function leadStatusTone(status: LeadDerivedStatus): StatusTone {
  return { label: LEAD_STATUS_LABEL[status], ...LEAD_STATUS_TONE[status] }
}

export type ClientDirectoryStatus =
  | "active"
  | "lead"
  | "qualified"
  | "at_risk"
  | "archived"

const CLIENT_STATUS_LABEL: Record<ClientDirectoryStatus, string> = {
  active: "Active",
  lead: "Lead",
  qualified: "Qualified",
  at_risk: "At-Risk",
  archived: "Archived",
}

const CLIENT_STATUS_TONE: Record<
  ClientDirectoryStatus,
  Omit<StatusTone, "label">
> = {
  active: {
    text: "text-emerald-400",
    bar: "bg-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  lead: {
    text: "text-sky-400",
    bar: "bg-sky-500",
    badge: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  qualified: {
    text: "text-indigo-400",
    bar: "bg-indigo-500",
    badge: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  },
  at_risk: {
    text: "text-orange-500",
    bar: "bg-orange-500",
    badge: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  archived: {
    text: "text-muted-foreground",
    bar: "bg-muted-foreground/60",
    badge: "bg-muted text-muted-foreground",
  },
}

export function clientDirectoryStatusTone(
  status: ClientDirectoryStatus,
): StatusTone {
  return { label: CLIENT_STATUS_LABEL[status], ...CLIENT_STATUS_TONE[status] }
}

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus | "succeeded", string> =
  {
    paid: "Paid",
    succeeded: "Paid",
    failed: "Failed",
    link_sent: "Link sent",
    unpaid: "Unpaid",
    refunded: "Refunded",
  }

const PAYMENT_STATUS_BADGE: Record<string, string> = {
  paid: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  succeeded: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  failed: "bg-destructive/10 text-destructive",
  link_sent: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  unpaid: "bg-orange-500/10 text-orange-500",
  pending: "bg-orange-500/10 text-orange-500",
  refunded: "bg-muted text-muted-foreground",
}

export function paymentStatusBadgeClass(status: string): string {
  return PAYMENT_STATUS_BADGE[status] ?? "bg-muted text-muted-foreground"
}

export function paymentStatusLabel(status: string): string {
  return (
    (PAYMENT_STATUS_LABEL as Record<string, string>)[status] ??
    status.replace(/_/g, " ")
  )
}
