import { redirect } from "next/navigation"

import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableEmpty,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
} from "@/components/dashboard/data-table"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { PageHeader } from "@/components/dashboard/page-header"
import { Badge } from "@/components/ui/badge"
import {
  repActivityStatus,
  REP_ACTIVITY_THRESHOLDS,
  type RepActivityRow,
  type RepActivityStatus,
} from "@/lib/rep-activity"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

const fmtMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const fmtDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

const STATUS_LABEL: Record<RepActivityStatus, string> = {
  ramping: "Ramping",
  active: "Active",
  warning: "Slipping",
  flagged: "Flagged",
  terminated: "Terminated",
}

const STATUS_CLASS: Record<RepActivityStatus, string> = {
  ramping: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  warning: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  flagged: "bg-red-500/15 text-red-700 dark:text-red-300",
  terminated: "bg-muted text-muted-foreground",
}

function daysSince(iso: string | null): string {
  if (!iso) return "Never"
  const ms = Date.now() - new Date(iso).getTime()
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
  if (days <= 0) return "Today"
  if (days === 1) return "1 day ago"
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  return months === 1 ? "1 month ago" : `${months} months ago`
}

export default async function RepActivityPage() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user!.id)
    .single()

  if (profile?.role !== "admin") redirect("/dashboard")

  const { data, error } = await supabase
    .from("admin_rep_activity")
    .select("*")
    .order("employment_status")
    .order("active_mrr", { ascending: false })

  if (error) throw error

  const rows: (RepActivityRow & { status: RepActivityStatus })[] = (
    data ?? []
  ).map((r) => {
    const row: RepActivityRow = {
      repId: r.rep_id ?? "",
      name: r.full_name ?? "Unnamed",
      employmentStatus:
        (r.employment_status as "active" | "terminated" | null) ?? "active",
      joinedAt: r.joined_at,
      newLeads30d: r.new_leads_30d ?? 0,
      newLeads60d: r.new_leads_60d ?? 0,
      interactions30d: r.interactions_30d ?? 0,
      interactions60d: r.interactions_60d ?? 0,
      lastInteractionAt: r.last_interaction_at,
      newMrr90d: Number(r.new_mrr_90d ?? 0),
      newSubs90d: r.new_subs_90d ?? 0,
      activeSubsCount: r.active_subs_count ?? 0,
      activeMrr: Number(r.active_mrr ?? 0),
    }
    return { ...row, status: repActivityStatus(row) }
  })

  const activeCount = rows.filter((r) => r.status === "active").length
  const rampingCount = rows.filter((r) => r.status === "ramping").length
  const warningCount = rows.filter((r) => r.status === "warning").length
  const flaggedCount = rows.filter((r) => r.status === "flagged").length
  const totalResidualsAtRisk = rows
    .filter((r) => r.status === "flagged" || r.status === "warning")
    .reduce((sum, r) => sum + r.activeMrr * 0.1, 0)

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Rep activity"
      />

      <p className="text-sm text-muted-foreground">
        Contractor reps don&apos;t work fixed hours — these are the proxies that
        show whether a rep is actually working their book. Flagged reps are
        candidates for the termination clause in the commission agreement,
        which freezes their residuals.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Active reps"
          value={String(activeCount)}
          footer={
            rampingCount > 0
              ? `Meeting thresholds. ${rampingCount} rep${rampingCount === 1 ? "" : "s"} ramping.`
              : "Meeting thresholds on the 30-day window."
          }
        />
        <KpiCard
          label="Slipping"
          value={String(warningCount)}
          footer="Below threshold on 30d, still OK on 60d."
        />
        <KpiCard
          label="Flagged"
          value={String(flaggedCount)}
          footer="Below threshold on both windows."
        />
        <KpiCard
          label="Residuals at risk"
          value={fmtMoney.format(totalResidualsAtRisk)}
          footer="Monthly payout to slipping + flagged reps."
        />
      </div>

      <section className="border border-border/60">
        <header className="border-b border-border/60 p-6">
          <h2 className="font-heading text-lg font-medium">Thresholds</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A rep is Active when they meet both minimums on the trailing 30-day
            window. Update{" "}
            <code className="rounded bg-muted px-1 font-mono text-xs">
              lib/rep-activity.ts
            </code>{" "}
            to tune — the contractor agreement should reference the same
            numbers.
          </p>
          <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <li>
              <span className="text-muted-foreground">New leads / 30d:</span>{" "}
              <span className="font-medium tabular-nums">
                ≥ {REP_ACTIVITY_THRESHOLDS.minNewLeads30d}
              </span>
            </li>
            <li>
              <span className="text-muted-foreground">
                Interactions / 30d:
              </span>{" "}
              <span className="font-medium tabular-nums">
                ≥ {REP_ACTIVITY_THRESHOLDS.minInteractions30d}
              </span>
            </li>
            <li className="sm:col-span-2">
              <span className="text-muted-foreground">Grace period:</span>{" "}
              <span className="font-medium tabular-nums">
                {REP_ACTIVITY_THRESHOLDS.gracePeriodDays} days
              </span>{" "}
              <span className="text-xs text-muted-foreground">
                — flagged reps stay flagged this long before termination review.
              </span>
            </li>
          </ul>
        </header>
      </section>

      <section className="border border-border/60">
        <header className="border-b border-border/60 p-6">
          <h2 className="font-heading text-lg font-medium">Per-rep activity</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} sales rep{rows.length === 1 ? "" : "s"} on the roster.
          </p>
        </header>

        <DataTable cols="minmax(180px,1.6fr) minmax(110px,0.8fr) minmax(90px,0.6fr) minmax(110px,0.7fr) minmax(130px,1fr) minmax(120px,1fr) minmax(120px,1fr)">
          <DataTableHeader>
            <DataTableHead>Rep</DataTableHead>
            <DataTableHead>Status</DataTableHead>
            <DataTableHead>Leads (30d)</DataTableHead>
            <DataTableHead>Touches (30d)</DataTableHead>
            <DataTableHead>Last activity</DataTableHead>
            <DataTableHead>New MRR (90d)</DataTableHead>
            <DataTableHead>Active MRR</DataTableHead>
          </DataTableHeader>
          {rows.length === 0 ? (
            <DataTableEmpty>No sales reps on the roster yet.</DataTableEmpty>
          ) : (
            <DataTableBody>
              {rows.map((r) => {
                const leadsOk =
                  r.newLeads30d >= REP_ACTIVITY_THRESHOLDS.minNewLeads30d
                const touchesOk =
                  r.interactions30d >=
                  REP_ACTIVITY_THRESHOLDS.minInteractions30d
                return (
                  <DataTableRow key={r.repId}>
                    <DataTableCell>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium">
                          {r.name}
                        </span>
                        {r.joinedAt ? (
                          <span className="truncate text-xs uppercase text-muted-foreground">
                            Joined {fmtDate.format(new Date(r.joinedAt))}
                          </span>
                        ) : null}
                      </div>
                    </DataTableCell>
                    <DataTableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "border-transparent uppercase",
                          STATUS_CLASS[r.status],
                        )}
                      >
                        {STATUS_LABEL[r.status]}
                      </Badge>
                    </DataTableCell>
                    <DataTableCell>
                      <span
                        className={cn(
                          "text-sm tabular-nums",
                          !leadsOk && r.status !== "terminated" && r.status !== "ramping"
                            ? "text-destructive"
                            : undefined,
                        )}
                      >
                        {r.newLeads30d}
                      </span>
                    </DataTableCell>
                    <DataTableCell>
                      <span
                        className={cn(
                          "text-sm tabular-nums",
                          !touchesOk && r.status !== "terminated" && r.status !== "ramping"
                            ? "text-destructive"
                            : undefined,
                        )}
                      >
                        {r.interactions30d}
                      </span>
                    </DataTableCell>
                    <DataTableCell>
                      <span className="text-sm text-muted-foreground">
                        {daysSince(r.lastInteractionAt)}
                      </span>
                    </DataTableCell>
                    <DataTableCell>
                      <span className="text-sm tabular-nums">
                        {fmtMoney.format(r.newMrr90d)}
                      </span>
                      {r.newSubs90d > 0 ? (
                        <span className="ml-1 text-xs text-muted-foreground tabular-nums">
                          · {r.newSubs90d} sub{r.newSubs90d === 1 ? "" : "s"}
                        </span>
                      ) : null}
                    </DataTableCell>
                    <DataTableCell>
                      <div className="flex min-w-0 flex-col">
                        <span className="text-sm font-medium tabular-nums">
                          {fmtMoney.format(r.activeMrr)}
                        </span>
                        <span className="text-xs uppercase text-muted-foreground tabular-nums">
                          {r.activeSubsCount} active sub
                          {r.activeSubsCount === 1 ? "" : "s"}
                        </span>
                      </div>
                    </DataTableCell>
                  </DataTableRow>
                )
              })}
            </DataTableBody>
          )}
        </DataTable>
      </section>
    </div>
  )
}
