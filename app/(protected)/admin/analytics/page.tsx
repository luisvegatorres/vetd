import { redirect } from "next/navigation"

import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableEmpty,
  DataTableRow,
} from "@/components/dashboard/data-table"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { MrrPanel } from "@/components/dashboard/mrr-panel"
import { PageHeader } from "@/components/dashboard/page-header"
import { Badge } from "@/components/ui/badge"
import { Dot } from "@/components/ui/dot"
import {
  PROJECT_STAGE_LABEL,
  paymentStatusBadgeClass,
  paymentStatusLabel,
  projectStageTone,
  type ProjectStage,
} from "@/lib/status-colors"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

// `negotiation` is hidden from the analytics grid — its rows roll up into the
// Proposal bucket (done in the admin_analytics_pipeline_stats view). The DB
// enum is untouched for legacy rows.
const STAGES: { key: ProjectStage; label: string }[] = (
  Object.keys(PROJECT_STAGE_LABEL) as ProjectStage[]
)
  .filter((key) => key !== "negotiation")
  .map((key) => ({ key, label: PROJECT_STAGE_LABEL[key] }))

const fmtMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const fmtDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
})

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user!.id)
    .single()

  if (profile?.role !== "admin") redirect("/dashboard")

  // All aggregations are pushed into Postgres via the admin_analytics_*
  // views (see migrations/0022). The page used to fetch every row from
  // projects/payments/subscriptions/profiles and reduce in memory — at
  // realistic scale that was multi-MB per page load.
  const [kpiRes, pipelineRes, teamRes, recentPaymentsRes] = await Promise.all([
    supabase.from("admin_analytics_kpis").select("*").maybeSingle(),
    supabase.from("admin_analytics_pipeline_stats").select("*"),
    supabase.from("admin_analytics_team_performance").select("*"),
    supabase
      .from("payments")
      .select(
        `
          id, amount, status, created_at,
          project:projects!payments_project_id_fkey (stage)
        `,
      )
      .order("created_at", { ascending: false })
      .limit(8),
  ])

  if (kpiRes.error) throw kpiRes.error
  if (pipelineRes.error) throw pipelineRes.error
  if (teamRes.error) throw teamRes.error
  if (recentPaymentsRes.error) throw recentPaymentsRes.error

  const kpi = kpiRes.data ?? {
    revenue_30d: 0,
    paid_count_30d: 0,
    open_deal_value: 0,
    open_deal_count: 0,
    active_mrr: 0,
    active_plan_count: 0,
    deals_won_count: 0,
  }

  // Pipeline stats. The view returns at most one row per stage; make sure
  // the grid always shows every UI stage in a stable order, even if a stage
  // has zero rows.
  const pipelineByStage = new Map<string, { count: number; value: number }>()
  for (const row of pipelineRes.data ?? []) {
    if (!row.stage) continue
    pipelineByStage.set(row.stage, {
      count: row.project_count ?? 0,
      value: Number(row.value_total ?? 0),
    })
  }
  const stageBuckets = STAGES.map((s) => {
    const stats = pipelineByStage.get(s.key) ?? { count: 0, value: 0 }
    return { ...s, count: stats.count, value: stats.value }
  })
  const maxStageCount = Math.max(1, ...stageBuckets.map((b) => b.count))

  // Team performance. Sort matches the original page.
  const teamRows = (teamRes.data ?? [])
    .map((r) => ({
      id: r.rep_id ?? "",
      name: r.full_name ?? "Unnamed",
      role: r.role ?? "",
      openCount: r.open_count ?? 0,
      openValue: Number(r.open_value ?? 0),
      wonCount: r.won_count ?? 0,
      commission: Number(r.commission_earned ?? 0),
      activeMrr: Number(r.active_mrr ?? 0),
    }))
    .sort((a, b) => b.openValue + b.commission - (a.openValue + a.commission))

  const recentPayments = (recentPaymentsRes.data ?? []).map((p) => {
    const projectObj = Array.isArray(p.project) ? p.project[0] : p.project
    return {
      id: p.id,
      amount: Number(p.amount),
      status: p.status,
      created_at: p.created_at,
      stage: projectObj?.stage ?? null,
    }
  })

  const paid30 = Number(kpi.revenue_30d ?? 0)
  const paidCount30 = kpi.paid_count_30d ?? 0
  const openDealValue = Number(kpi.open_deal_value ?? 0)
  const openDealCount = kpi.open_deal_count ?? 0
  const activeMrr = Number(kpi.active_mrr ?? 0)
  const activePlanCount = kpi.active_plan_count ?? 0
  const dealsWonCount = kpi.deals_won_count ?? 0

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Admin" title="Analytics" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Revenue (30d)"
          value={fmtMoney.format(paid30)}
          footer={`${paidCount30} paid payments`}
        />
        <KpiCard
          label="Open Deal Value"
          value={fmtMoney.format(openDealValue)}
          footer={`${openDealCount} deals in flight`}
        />
        <KpiCard
          label="Active MRR"
          value={fmtMoney.format(activeMrr)}
          footer={`${activePlanCount} active plans`}
        />
        <KpiCard
          label="Deals Won"
          value={String(dealsWonCount)}
          footer="All time"
        />
      </div>

      <MrrPanel />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section className="border border-border/60">
          <header className="border-b border-border/60 p-6">
            <h2 className="font-heading text-lg font-medium">
              Pipeline progression
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Project count and total value by stage.
            </p>
          </header>

          <ul className="divide-y divide-border/60">
            {stageBuckets.map((b) => {
              const tone = projectStageTone(b.key)
              return (
                <li
                  key={b.key}
                  className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2 px-6 py-4"
                >
                  <p
                    className={cn(
                      "text-overline font-medium uppercase",
                      tone.text,
                    )}
                  >
                    {b.label}
                  </p>
                  <p className="font-heading text-xl font-medium tabular-nums">
                    {b.count}
                  </p>
                  <div className="h-1 w-full bg-border/40">
                    <div
                      className={cn("h-full", tone.bar)}
                      style={{
                        width: `${(b.count / maxStageCount) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-overline font-medium uppercase text-muted-foreground tabular-nums">
                    {fmtMoney.format(b.value)}
                  </p>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="border border-border/60">
          <header className="border-b border-border/60 p-6">
            <h2 className="font-heading text-lg font-medium">
              Recent payments
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Latest transactions across every project.
            </p>
          </header>

          <DataTable cols="minmax(0,1fr) auto">
            {recentPayments.length === 0 ? (
              <DataTableEmpty>No payments recorded yet.</DataTableEmpty>
            ) : (
              <DataTableBody>
                {recentPayments.map((p) => (
                  <DataTableRow key={p.id}>
                    <DataTableCell>
                      <div className="min-w-0">
                        <p className="text-sm font-medium tabular-nums">
                          {fmtMoney.format(p.amount)}
                        </p>
                        <p className="mt-1 flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                          {fmtDate.format(new Date(p.created_at))}
                          <Dot />
                          {p.stage ?? "—"}
                        </p>
                      </div>
                    </DataTableCell>
                    <DataTableCell align="end">
                      <Badge
                        variant="outline"
                        className={cn(
                          "border-transparent uppercase",
                          paymentStatusBadgeClass(p.status),
                        )}
                      >
                        {paymentStatusLabel(p.status)}
                      </Badge>
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            )}
          </DataTable>
        </section>
      </div>

      <section className="border border-border/60">
        <header className="border-b border-border/60 p-6">
          <h2 className="font-heading text-lg font-medium">Team performance</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {teamRows.length} contributors with open or closed work.
          </p>
        </header>

        {teamRows.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            No team activity yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm tabular-nums">
              <thead className="text-overline uppercase text-muted-foreground">
                <tr className="border-b border-border/60">
                  <th className="px-6 py-4 text-left font-medium">Rep</th>
                  <th className="px-6 py-4 text-right font-medium">Open</th>
                  <th className="px-6 py-4 text-right font-medium">
                    Open value
                  </th>
                  <th className="px-6 py-4 text-right font-medium">Won</th>
                  <th className="px-6 py-4 text-right font-medium">
                    Commission
                  </th>
                  <th className="px-6 py-4 text-right font-medium">MRR sold</th>
                </tr>
              </thead>
              <tbody>
                {teamRows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border/60 last:border-0"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium">{r.name}</div>
                      <div className="text-overline uppercase text-muted-foreground">
                        {r.role}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">{r.openCount}</td>
                    <td className="px-6 py-4 text-right">
                      {fmtMoney.format(r.openValue)}
                    </td>
                    <td className="px-6 py-4 text-right">{r.wonCount}</td>
                    <td className="px-6 py-4 text-right">
                      {fmtMoney.format(r.commission)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {fmtMoney.format(r.activeMrr)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
