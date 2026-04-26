import { ArrowRight } from "lucide-react"

import { KpiCard } from "@/components/dashboard/kpi-card"
import { createClient } from "@/lib/supabase/server"

const fmtMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const fmtMonth = new Intl.DateTimeFormat("en-US", { month: "long" })

const WEEKS = 8

function getTimeWindows(now = new Date()) {
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const trendStart = new Date(startOfDay)
  trendStart.setDate(trendStart.getDate() - WEEKS * 7)
  return {
    now,
    startOfDay,
    monthStart,
    nextMonthStart,
    prevMonthStart,
    trendStart,
  }
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

export async function OpenDealsKpi() {
  const supabase = await createClient()
  const { startOfDay, trendStart } = getTimeWindows()
  const weekBuckets = buildWeekBuckets(startOfDay)

  const [openDealsRes, openDealsTrendRes] = await Promise.all([
    supabase
      .from("projects")
      .select("value")
      .in("stage", ["proposal", "negotiation", "active"]),
    supabase
      .from("projects")
      .select("value, created_at")
      .in("stage", ["proposal", "negotiation", "active"])
      .gte("created_at", trendStart.toISOString()),
  ])

  const openDeals = openDealsRes.data ?? []
  const openDealCount = openDeals.length
  const openDealValue = openDeals.reduce(
    (sum, r) => sum + Number(r.value ?? 0),
    0,
  )

  const trend = bucketByWeek(
    openDealsTrendRes.data ?? [],
    weekBuckets,
    (r) => r.created_at,
    (r) => Number(r.value ?? 0),
  )

  return (
    <KpiCard
      label="Open Deal Value"
      value={fmtMoney.format(openDealValue)}
      badge={`${openDealCount} ${openDealCount === 1 ? "deal" : "deals"}`}
      badgeTone="neutral"
      footer={
        openDealCount
          ? `Across ${openDealCount} ${openDealCount === 1 ? "deal" : "deals"}`
          : "No open deals"
      }
      trend={trend}
    />
  )
}

export async function RevenueKpi() {
  const supabase = await createClient()
  const { now, monthStart, nextMonthStart, prevMonthStart } = getTimeWindows()

  const [thisMonthRes, lastMonthRes, revenueTrendRes] = await Promise.all([
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
      .from("payments")
      .select("amount, created_at")
      .in("status", ["paid", "succeeded"])
      .gte("created_at", monthStart.toISOString())
      .lt("created_at", nextMonthStart.toISOString()),
  ])

  const thisMonthPayments = thisMonthRes.data ?? []
  const lastMonthPayments = lastMonthRes.data ?? []
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

  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate()
  const trend = new Array(daysInMonth).fill(0)
  for (const p of revenueTrendRes.data ?? []) {
    if (!p.created_at) continue
    const d = new Date(p.created_at).getDate()
    trend[d - 1] += Number(p.amount ?? 0)
  }

  return (
    <KpiCard
      label="Revenue This Month"
      value={fmtMoney.format(revenueThisMonth)}
      badge={
        revenueDelta != null
          ? `${revenueDelta >= 0 ? "+" : ""}${revenueDelta.toFixed(1)}%`
          : undefined
      }
      badgeTone={
        revenueDelta != null && revenueDelta >= 0 ? "positive" : "neutral"
      }
      footer={`${fmtMonth.format(now)} ▪ ${thisMonthPayments.length} ${
        thisMonthPayments.length === 1 ? "payment" : "payments"
      }`}
      trend={trend}
    />
  )
}

export async function CommissionsKpi() {
  const supabase = await createClient()
  const { startOfDay, monthStart, nextMonthStart, trendStart } =
    getTimeWindows()
  const weekBuckets = buildWeekBuckets(startOfDay)

  const [commissionsRes, commissionsTrendRes] = await Promise.all([
    supabase
      .from("project_commission_ledger")
      .select("amount, rep_id")
      .eq("status", "pending")
      .gte("created_at", monthStart.toISOString())
      .lt("created_at", nextMonthStart.toISOString()),
    supabase
      .from("project_commission_ledger")
      .select("amount, created_at")
      .eq("status", "pending")
      .gte("created_at", trendStart.toISOString()),
  ])

  const commissionsRows = commissionsRes.data ?? []
  const commissionsOwed = commissionsRows.reduce(
    (sum, r) => sum + Number(r.amount ?? 0),
    0,
  )
  const commissionRepCount = new Set(
    commissionsRows.map((r) => r.rep_id).filter(Boolean),
  ).size

  const trend = bucketByWeek(
    commissionsTrendRes.data ?? [],
    weekBuckets,
    (r) => r.created_at,
    (r) => Number(r.amount ?? 0),
  )

  return (
    <KpiCard
      label="Commissions Owed"
      value={fmtMoney.format(commissionsOwed)}
      badge={`${commissionRepCount} ${commissionRepCount === 1 ? "rep" : "reps"}`}
      badgeTone="neutral"
      footer="Pending payout this cycle"
      trend={trend}
    />
  )
}

export async function WinRateKpi() {
  const supabase = await createClient()
  const { startOfDay, trendStart } = getTimeWindows()
  const weekBuckets = buildWeekBuckets(startOfDay)

  const [clientsClosedRes, clientsTrendRes] = await Promise.all([
    supabase
      .from("clients")
      .select("status")
      .in("status", ["active_client", "lost"]),
    supabase
      .from("clients")
      .select("status, updated_at")
      .in("status", ["active_client", "lost"])
      .gte("updated_at", trendStart.toISOString()),
  ])

  const closedClients = clientsClosedRes.data ?? []
  const wonClients = closedClients.filter(
    (c) => c.status === "active_client",
  ).length
  const lostClients = closedClients.length - wonClients
  const winRate =
    closedClients.length > 0 ? (wonClients / closedClients.length) * 100 : null

  const clientsTrendRows = clientsTrendRes.data ?? []
  const wonByWeek = bucketByWeek(
    clientsTrendRows.filter((c) => c.status === "active_client"),
    weekBuckets,
    (r) => r.updated_at,
    () => 1,
  )
  const closedByWeek = bucketByWeek(
    clientsTrendRows,
    weekBuckets,
    (r) => r.updated_at,
    () => 1,
  )
  const winRateTrend = wonByWeek.map((won, i) =>
    closedByWeek[i] > 0 ? (won / closedByWeek[i]) * 100 : 0,
  )

  return (
    <KpiCard
      label={
        <>
          Lead <ArrowRight className="size-3" aria-hidden /> Won Rate
        </>
      }
      value={winRate != null ? `${Math.round(winRate)}%` : "—"}
      badge={
        closedClients.length > 0
          ? `${wonClients} won ▪ ${lostClients} lost`
          : undefined
      }
      badgeTone="neutral"
      footer={
        closedClients.length > 0 ? "All-time close rate" : "No closed deals yet"
      }
      trend={winRateTrend}
    />
  )
}
