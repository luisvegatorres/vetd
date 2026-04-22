import { ArrowRight } from "lucide-react"

import { AutoRefresh } from "@/components/dashboard/auto-refresh"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { PageHeader } from "@/components/dashboard/page-header"
import { Dot } from "@/components/ui/dot"
import { PipelineSnapshot } from "@/components/dashboard/pipeline-snapshot"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { TodaysFocus } from "@/components/dashboard/todays-focus"
import { createClient } from "@/lib/supabase/server"

function getGreeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

const fmtMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const fmtMonth = new Intl.DateTimeFormat("en-US", { month: "long" })

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()

  const now = new Date()
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(startOfDay)
  endOfDay.setDate(endOfDay.getDate() + 1)
  const todayIso = now.toISOString()

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const WEEKS = 8
  const trendStart = new Date(startOfDay)
  trendStart.setDate(trendStart.getDate() - WEEKS * 7)

  const [
    profileRes,
    dealsRes,
    overdueRes,
    meetingsRes,
    openDealsRes,
    thisMonthPaymentsRes,
    lastMonthPaymentsRes,
    commissionsRes,
    clientsClosedRes,
    openDealsTrendRes,
    revenueTrendRes,
    commissionsTrendRes,
    clientsTrendRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", auth!.user!.id)
      .single(),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .in("stage", ["proposal", "negotiation", "active"]),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .in("payment_status", ["unpaid", "link_sent"])
      .lt("deadline", todayIso),
    supabase
      .from("interactions")
      .select("id", { count: "exact", head: true })
      .eq("type", "meeting")
      .gte("occurred_at", startOfDay.toISOString())
      .lt("occurred_at", endOfDay.toISOString()),
    supabase
      .from("projects")
      .select("value")
      .in("stage", ["proposal", "negotiation", "active"]),
    supabase
      .from("payments")
      .select("amount")
      .in("status", ["paid", "succeeded"])
      .gte("created_at", monthStart.toISOString())
      .lt("created_at", nextMonthStart.toISOString()),
    supabase
      .from("payments")
      .select("amount")
      .in("status", ["paid", "succeeded"])
      .gte("created_at", prevMonthStart.toISOString())
      .lt("created_at", monthStart.toISOString()),
    supabase
      .from("project_commission_ledger")
      .select("amount, rep_id")
      .eq("status", "pending")
      .gte("created_at", monthStart.toISOString())
      .lt("created_at", nextMonthStart.toISOString()),
    supabase
      .from("clients")
      .select("status")
      .in("status", ["active_client", "lost"]),
    supabase
      .from("projects")
      .select("value, created_at")
      .in("stage", ["proposal", "negotiation", "active"])
      .gte("created_at", trendStart.toISOString()),
    supabase
      .from("payments")
      .select("amount, created_at")
      .in("status", ["paid", "succeeded"])
      .gte("created_at", monthStart.toISOString())
      .lt("created_at", nextMonthStart.toISOString()),
    supabase
      .from("project_commission_ledger")
      .select("amount, created_at")
      .eq("status", "pending")
      .gte("created_at", trendStart.toISOString()),
    supabase
      .from("clients")
      .select("status, updated_at")
      .in("status", ["active_client", "lost"])
      .gte("updated_at", trendStart.toISOString()),
  ])

  const firstName =
    profileRes.data?.full_name?.trim().split(/\s+/)[0] ??
    auth?.user?.email?.split("@")[0] ??
    "there"

  const title = (
    <span className="flex flex-wrap items-center gap-3">
      <span>{dealsRes.count ?? 0} Deals Moving</span>
      <Dot />
      <span>{overdueRes.count ?? 0} Payments Overdue</span>
      <Dot />
      <span>{meetingsRes.count ?? 0} Meetings Today</span>
    </span>
  )

  const openDeals = openDealsRes.data ?? []
  const openDealCount = openDeals.length
  const openDealValue = openDeals.reduce(
    (sum, r) => sum + Number(r.value ?? 0),
    0,
  )

  const thisMonthPayments = thisMonthPaymentsRes.data ?? []
  const lastMonthPayments = lastMonthPaymentsRes.data ?? []
  const revenueThisMonth = thisMonthPayments.reduce(
    (sum, r) => sum + Number(r.amount ?? 0),
    0,
  )
  const revenueLastMonth = lastMonthPayments.reduce(
    (sum, r) => sum + Number(r.amount ?? 0),
    0,
  )
  const revenueDelta =
    revenueLastMonth > 0
      ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
      : null

  const commissionsRows = commissionsRes.data ?? []
  const commissionsOwed = commissionsRows.reduce(
    (sum, r) => sum + Number(r.amount ?? 0),
    0,
  )
  const commissionRepCount = new Set(
    commissionsRows.map((r) => r.rep_id).filter(Boolean),
  ).size

  const closedClients = clientsClosedRes.data ?? []
  const wonClients = closedClients.filter(
    (c) => c.status === "active_client",
  ).length
  const lostClients = closedClients.length - wonClients
  const winRate =
    closedClients.length > 0 ? (wonClients / closedClients.length) * 100 : null

  const weekBuckets = Array.from({ length: WEEKS }, (_, i) => {
    const start = new Date(startOfDay)
    start.setDate(start.getDate() - (WEEKS - i) * 7)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    return { start: start.getTime(), end: end.getTime() }
  })

  const bucketByWeek = <T,>(
    rows: T[],
    getDate: (r: T) => string | null | undefined,
    getValue: (r: T) => number,
  ) => {
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

  const openDealTrend = bucketByWeek(
    openDealsTrendRes.data ?? [],
    (r) => r.created_at,
    (r) => Number(r.value ?? 0),
  )

  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate()
  const revenueTrend = new Array(daysInMonth).fill(0)
  for (const p of revenueTrendRes.data ?? []) {
    if (!p.created_at) continue
    const d = new Date(p.created_at).getDate()
    revenueTrend[d - 1] += Number(p.amount ?? 0)
  }

  const commissionsTrend = bucketByWeek(
    commissionsTrendRes.data ?? [],
    (r) => r.created_at,
    (r) => Number(r.amount ?? 0),
  )

  const clientsTrendRows = clientsTrendRes.data ?? []
  const wonByWeek = bucketByWeek(
    clientsTrendRows.filter((c) => c.status === "active_client"),
    (r) => r.updated_at,
    () => 1,
  )
  const closedByWeek = bucketByWeek(
    clientsTrendRows,
    (r) => r.updated_at,
    () => 1,
  )
  const winRateTrend = wonByWeek.map((won, i) =>
    closedByWeek[i] > 0 ? (won / closedByWeek[i]) * 100 : 0,
  )

  const KPIS = [
    {
      label: "Open Deal Value",
      value: fmtMoney.format(openDealValue),
      badge: `${openDealCount} ${openDealCount === 1 ? "deal" : "deals"}`,
      badgeTone: "neutral" as const,
      footer: openDealCount
        ? `Across ${openDealCount} ${openDealCount === 1 ? "deal" : "deals"}`
        : "No open deals",
      trend: openDealTrend,
    },
    {
      label: "Revenue This Month",
      value: fmtMoney.format(revenueThisMonth),
      badge:
        revenueDelta != null
          ? `${revenueDelta >= 0 ? "+" : ""}${revenueDelta.toFixed(1)}%`
          : undefined,
      badgeTone: (revenueDelta != null && revenueDelta >= 0
        ? "positive"
        : "neutral") as "positive" | "neutral",
      footer: `${fmtMonth.format(now)} ▪ ${thisMonthPayments.length} ${
        thisMonthPayments.length === 1 ? "payment" : "payments"
      }`,
      trend: revenueTrend,
    },
    {
      label: "Commissions Owed",
      value: fmtMoney.format(commissionsOwed),
      badge: `${commissionRepCount} ${commissionRepCount === 1 ? "rep" : "reps"}`,
      badgeTone: "neutral" as const,
      footer: "Pending payout this cycle",
      trend: commissionsTrend,
    },
    {
      label: (
        <>
          Lead <ArrowRight className="size-3" aria-hidden /> Won Rate
        </>
      ),
      value: winRate != null ? `${Math.round(winRate)}%` : "—",
      badge:
        closedClients.length > 0
          ? `${wonClients} won ▪ ${lostClients} lost`
          : undefined,
      badgeTone: "neutral" as const,
      footer:
        closedClients.length > 0
          ? "All-time close rate"
          : "No closed deals yet",
      trend: winRateTrend,
    },
  ]

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow={`${getGreeting()}, ${firstName}`}
        title={title}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((kpi, i) => (
          <KpiCard key={i} {...kpi} />
        ))}
      </div>

      <QuickActions />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <PipelineSnapshot />
        </div>
        <TodaysFocus />
      </div>

      <AutoRefresh />
    </div>
  )
}
