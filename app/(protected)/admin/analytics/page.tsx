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
// Proposal bucket below. The DB enum is untouched for legacy rows.
const STAGES: { key: ProjectStage; label: string }[] = (
  Object.keys(PROJECT_STAGE_LABEL) as ProjectStage[]
)
  .filter((key) => key !== "negotiation")
  .map((key) => ({ key, label: PROJECT_STAGE_LABEL[key] }))

const OPEN_STAGES: ProjectStage[] = ["proposal", "negotiation", "active"]

const fmtMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const fmtDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
})

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user!.id)
    .single()

  if (profile?.role !== "admin") redirect("/dashboard")

  const since30 = daysAgo(30)

  const [
    { data: projects },
    { data: payments },
    { data: subscriptions },
    { data: profiles },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select(
        "id, stage, value, commission_amount, sold_by, payment_status, paid_at",
      ),
    supabase
      .from("payments")
      .select("id, amount, status, created_at, project_id")
      .order("created_at", { ascending: false }),
    supabase.from("subscriptions").select("id, monthly_rate, status, sold_by"),
    supabase.from("profiles").select("id, full_name, role"),
  ])

  const projectList = projects ?? []
  const paymentList = payments ?? []
  const subscriptionList = subscriptions ?? []
  const profileList = profiles ?? []

  const paid30 = paymentList
    .filter((p) => p.status === "paid" && p.created_at >= since30)
    .reduce((sum, p) => sum + Number(p.amount), 0)

  const paidCount30 = paymentList.filter(
    (p) => p.status === "paid" && p.created_at >= since30,
  ).length

  const openDealValue = projectList
    .filter((p) => OPEN_STAGES.includes(p.stage as ProjectStage))
    .reduce((sum, p) => sum + Number(p.value ?? 0), 0)

  const activeMrr = subscriptionList
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + Number(s.monthly_rate), 0)

  const stageBuckets = STAGES.map((s) => {
    const inStage = projectList.filter((p) =>
      s.key === "proposal"
        ? p.stage === "proposal" || p.stage === "negotiation"
        : p.stage === s.key,
    )
    return {
      ...s,
      count: inStage.length,
      value: inStage.reduce((sum, p) => sum + Number(p.value ?? 0), 0),
    }
  })

  const maxStageCount = Math.max(1, ...stageBuckets.map((b) => b.count))

  const reps = profileList.filter(
    (p) => p.role === "sales_rep" || p.role === "admin",
  )

  const teamRows = reps
    .map((rep) => {
      const repProjects = projectList.filter((p) => p.sold_by === rep.id)
      const open = repProjects.filter((p) =>
        OPEN_STAGES.includes(p.stage as ProjectStage),
      )
      const won = repProjects.filter((p) => p.stage === "completed")
      const commissionEarned = won.reduce(
        (sum, p) => sum + Number(p.commission_amount ?? 0),
        0,
      )
      const repSubs = subscriptionList.filter(
        (s) => s.sold_by === rep.id && s.status === "active",
      )
      const repMrr = repSubs.reduce(
        (sum, s) => sum + Number(s.monthly_rate),
        0,
      )
      return {
        id: rep.id,
        name: rep.full_name ?? "Unnamed",
        role: rep.role,
        openCount: open.length,
        openValue: open.reduce((sum, p) => sum + Number(p.value ?? 0), 0),
        wonCount: won.length,
        commission: commissionEarned,
        activeMrr: repMrr,
      }
    })
    .filter(
      (r) =>
        r.openCount > 0 || r.wonCount > 0 || r.activeMrr > 0 || r.commission > 0,
    )
    .sort((a, b) => b.openValue + b.commission - (a.openValue + a.commission))

  const recentPayments = paymentList.slice(0, 8)
  const projectById = new Map(projectList.map((p) => [p.id, p]))

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Admin"
        title="Analytics"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Revenue (30d)"
          value={fmtMoney.format(paid30)}
          footer={`${paidCount30} paid payments`}
        />
        <KpiCard
          label="Open Deal Value"
          value={fmtMoney.format(openDealValue)}
          footer={`${stageBuckets
            .filter((s) => OPEN_STAGES.includes(s.key))
            .reduce((sum, s) => sum + s.count, 0)} deals in flight`}
        />
        <KpiCard
          label="Active MRR"
          value={fmtMoney.format(activeMrr)}
          footer={`${subscriptionList.filter((s) => s.status === "active").length} active plans`}
        />
        <KpiCard
          label="Deals Won"
          value={String(
            projectList.filter((p) => p.stage === "completed").length,
          )}
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
                {recentPayments.map((p) => {
                  const proj = projectById.get(p.project_id)
                  return (
                    <DataTableRow key={p.id}>
                      <DataTableCell>
                        <div className="min-w-0">
                          <p className="text-sm font-medium tabular-nums">
                            {fmtMoney.format(Number(p.amount))}
                          </p>
                          <p className="mt-1 flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                            {fmtDate.format(new Date(p.created_at))}
                            <Dot />
                            {proj?.stage ?? "—"}
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
                  )
                })}
              </DataTableBody>
            )}
          </DataTable>
        </section>
      </div>

      <section className="border border-border/60">
        <header className="border-b border-border/60 p-6">
          <h2 className="font-heading text-lg font-medium">
            Team performance
          </h2>
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
                  <tr key={r.id} className="border-b border-border/60 last:border-0">
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
