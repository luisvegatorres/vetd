import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableEmpty,
  DataTableRow,
} from "@/components/dashboard/data-table"
import { KpiCard, KpiCardSkeleton } from "@/components/dashboard/kpi-card"
import { Badge } from "@/components/ui/badge"
import { Dot } from "@/components/ui/dot"
import { Skeleton } from "@/components/ui/skeleton"
import {
  PROJECT_STAGE_LABEL,
  paymentStatusBadgeClass,
  paymentStatusLabel,
  projectStageTone,
  type ProjectStage,
} from "@/lib/status-colors"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

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

const WEEKS = 8

function getWindows() {
  const now = new Date()
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)
  const trendStart = new Date(startOfDay)
  trendStart.setDate(trendStart.getDate() - WEEKS * 7)
  const revenueWindowStart = new Date(startOfDay)
  revenueWindowStart.setDate(revenueWindowStart.getDate() - 30)
  return { startOfDay, trendStart, revenueWindowStart }
}

function buildWeekBuckets(startOfDay: Date) {
  return Array.from({ length: WEEKS }, (_, i) => {
    const start = new Date(startOfDay)
    start.setDate(start.getDate() - (WEEKS - i) * 7)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    return { start: start.getTime(), end: end.getTime() }
  })
}

function bucketByWeek<T>(
  rows: T[],
  weekBuckets: { start: number; end: number }[],
  getDate: (r: T) => string | null | undefined,
  getValue: (r: T) => number,
) {
  const sums = new Array(WEEKS).fill(0)
  for (const r of rows) {
    const raw = getDate(r)
    if (!raw) continue
    const t = new Date(raw).getTime()
    const idx = weekBuckets.findIndex((b) => t >= b.start && t < b.end)
    if (idx >= 0) sums[idx] += getValue(r)
  }
  return sums
}

export async function AnalyticsKpis() {
  const supabase = await createClient()
  const { startOfDay, trendStart, revenueWindowStart } = getWindows()
  const weekBuckets = buildWeekBuckets(startOfDay)

  const [
    kpiRes,
    revenueTrendRes,
    openDealsTrendRes,
    newMrrTrendRes,
    dealsWonTrendRes,
  ] = await Promise.all([
    supabase.from("admin_analytics_kpis").select("*").maybeSingle(),
    supabase
      .from("payments")
      .select("amount, created_at")
      .in("status", ["paid", "succeeded"])
      .gte("created_at", revenueWindowStart.toISOString()),
    supabase
      .from("projects")
      .select("value, created_at")
      .in("stage", ["proposal", "negotiation", "active"])
      .gte("created_at", trendStart.toISOString()),
    supabase
      .from("subscriptions")
      .select("monthly_rate, first_payment_at")
      .eq("status", "active")
      .gte("first_payment_at", trendStart.toISOString()),
    supabase
      .from("projects")
      .select("updated_at")
      .eq("stage", "won")
      .gte("updated_at", trendStart.toISOString()),
  ])

  if (kpiRes.error) throw kpiRes.error

  const kpi = kpiRes.data ?? {
    revenue_30d: 0,
    paid_count_30d: 0,
    open_deal_value: 0,
    open_deal_count: 0,
    active_mrr: 0,
    active_plan_count: 0,
    deals_won_count: 0,
  }

  const revenueTrend = new Array(30).fill(0)
  for (const p of revenueTrendRes.data ?? []) {
    if (!p.created_at) continue
    const diffDays = Math.floor(
      (startOfDay.getTime() - new Date(p.created_at).getTime()) /
        (1000 * 60 * 60 * 24),
    )
    const idx = 29 - diffDays
    if (idx >= 0 && idx < 30) revenueTrend[idx] += Number(p.amount ?? 0)
  }

  const openDealTrend = bucketByWeek(
    openDealsTrendRes.data ?? [],
    weekBuckets,
    (r) => r.created_at,
    (r) => Number(r.value ?? 0),
  )
  const newMrrTrend = bucketByWeek(
    newMrrTrendRes.data ?? [],
    weekBuckets,
    (r) => r.first_payment_at,
    (r) => Number(r.monthly_rate ?? 0),
  )
  const dealsWonTrend = bucketByWeek(
    dealsWonTrendRes.data ?? [],
    weekBuckets,
    (r) => r.updated_at,
    () => 1,
  )

  return (
    <>
      <KpiCard
        label="Revenue (30d)"
        value={fmtMoney.format(Number(kpi.revenue_30d ?? 0))}
        footer={`${kpi.paid_count_30d ?? 0} paid payments`}
        trend={revenueTrend}
      />
      <KpiCard
        label="Open Deal Value"
        value={fmtMoney.format(Number(kpi.open_deal_value ?? 0))}
        footer={`${kpi.open_deal_count ?? 0} deals in flight`}
        trend={openDealTrend}
      />
      <KpiCard
        label="Active MRR"
        value={fmtMoney.format(Number(kpi.active_mrr ?? 0))}
        footer={`${kpi.active_plan_count ?? 0} active plans`}
        trend={newMrrTrend}
      />
      <KpiCard
        label="Deals Won"
        value={String(kpi.deals_won_count ?? 0)}
        footer="All time"
        trend={dealsWonTrend}
      />
    </>
  )
}

export function AnalyticsKpisFallback() {
  return (
    <>
      <KpiCardSkeleton />
      <KpiCardSkeleton />
      <KpiCardSkeleton />
      <KpiCardSkeleton />
    </>
  )
}

export async function PipelineProgression() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("admin_analytics_pipeline_stats")
    .select("*")
  if (error) throw error

  const pipelineByStage = new Map<string, { count: number; value: number }>()
  for (const row of data ?? []) {
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

  return (
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
  )
}

export function PipelineProgressionFallback() {
  return (
    <section className="border border-border/60">
      <header className="border-b border-border/60 p-6">
        <Skeleton className="h-5 w-48 rounded-none" />
        <Skeleton className="mt-2 h-4 w-72 rounded-none" />
      </header>
      <ul className="divide-y divide-border/60">
        {Array.from({ length: 5 }).map((_, i) => (
          <li
            key={i}
            className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2 px-6 py-4"
          >
            <Skeleton className="h-3 w-24 rounded-none" />
            <Skeleton className="h-6 w-10 rounded-none" />
            <Skeleton className="h-1 w-full rounded-none" />
            <Skeleton className="h-3 w-16 rounded-none" />
          </li>
        ))}
      </ul>
    </section>
  )
}

export async function RecentPayments() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("payments")
    .select(
      `
        id, amount, status, created_at,
        project:projects!payments_project_id_fkey (stage)
      `,
    )
    .order("created_at", { ascending: false })
    .limit(8)
  if (error) throw error

  const recentPayments = (data ?? []).map((p) => {
    const projectObj = Array.isArray(p.project) ? p.project[0] : p.project
    return {
      id: p.id,
      amount: Number(p.amount),
      status: p.status,
      created_at: p.created_at,
      stage: projectObj?.stage ?? null,
    }
  })

  return (
    <section className="border border-border/60">
      <header className="border-b border-border/60 p-6">
        <h2 className="font-heading text-lg font-medium">Recent payments</h2>
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
  )
}

export function RecentPaymentsFallback() {
  return (
    <section className="border border-border/60">
      <header className="border-b border-border/60 p-6">
        <Skeleton className="h-5 w-40 rounded-none" />
        <Skeleton className="mt-2 h-4 w-72 rounded-none" />
      </header>
      <div className="flex flex-col gap-3 p-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-none" />
        ))}
      </div>
    </section>
  )
}

export async function TeamPerformance() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("admin_analytics_team_performance")
    .select("*")
  if (error) throw error

  const teamRows = (data ?? [])
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

  return (
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
  )
}

export function TeamPerformanceFallback() {
  return (
    <section className="border border-border/60">
      <header className="border-b border-border/60 p-6">
        <Skeleton className="h-5 w-40 rounded-none" />
        <Skeleton className="mt-2 h-4 w-56 rounded-none" />
      </header>
      <div className="flex flex-col gap-3 p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-none" />
        ))}
      </div>
    </section>
  )
}

export function MrrPanelFallback() {
  return (
    <section className="border border-border/60 p-6">
      <Skeleton className="h-5 w-40 rounded-none" />
      <Skeleton className="mt-2 h-4 w-64 rounded-none" />
      <Skeleton className="mt-6 h-48 w-full rounded-none" />
    </section>
  )
}
