import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  MrrDataTable,
  type MrrRow,
  type MrrStatus,
} from "@/components/dashboard/mrr-data-table"
import {
  MrrTrendChart,
  type MrrTrendPoint,
} from "@/components/dashboard/mrr-trend-chart"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

const fmtMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const fmtSince = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
})

function formatSince(iso: string) {
  const [y, m, d] = iso.split("-").map(Number)
  return fmtSince.format(new Date(y, (m ?? 1) - 1, d ?? 1))
}

const fmtTrendMonth = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "2-digit",
})

type TrendSubscription = {
  monthly_rate: number | string | null
  started_at: string | null
  canceled_at: string | null
}

function buildMrrTrend(subs: TrendSubscription[]): MrrTrendPoint[] {
  const now = new Date()
  const points: MrrTrendPoint[] = []
  for (let i = 10; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() - i + 1,
      0,
      23,
      59,
      59,
    )
    const mrr = subs.reduce((sum, s) => {
      if (!s.started_at) return sum
      const started = new Date(s.started_at)
      if (started > monthEnd) return sum
      if (s.canceled_at) {
        const canceled = new Date(s.canceled_at)
        if (canceled < monthStart) return sum
      }
      return sum + Number(s.monthly_rate ?? 0)
    }, 0)
    points.push({
      month: fmtTrendMonth.format(monthStart),
      mrr,
      projected: i === 0 || undefined,
    })
  }
  return points
}

function formatPersonName(fullName: string | null) {
  if (!fullName) return "Unassigned"
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

export async function MrrPanel() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      `
        product,
        plan,
        monthly_rate,
        status,
        started_at,
        canceled_at,
        clients ( name ),
        sold_by:profiles!subscriptions_sold_by_fkey ( full_name )
      `,
    )
    .order("started_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to load subscriptions: ${error.message}`)
  }

  const rows: MrrRow[] = (data ?? []).map((row) => {
    const client = Array.isArray(row.clients) ? row.clients[0] : row.clients
    const soldByProfile = Array.isArray(row.sold_by)
      ? row.sold_by[0]
      : row.sold_by
    return {
      client: client?.name ?? "Unknown client",
      soldBy: formatPersonName(soldByProfile?.full_name ?? null),
      product: row.product,
      plan: row.plan,
      since: formatSince(row.started_at),
      status: row.status as MrrStatus,
      mrr: Number(row.monthly_rate),
    }
  })

  const totals = rows.reduce(
    (acc, r) => {
      acc.counts[r.status] = (acc.counts[r.status] ?? 0) + 1
      acc.mrrByStatus[r.status] = (acc.mrrByStatus[r.status] ?? 0) + r.mrr
      return acc
    },
    {
      counts: {} as Record<MrrStatus, number>,
      mrrByStatus: {} as Record<MrrStatus, number>,
    },
  )

  const currentMrr = totals.mrrByStatus.active ?? 0
  const atRiskMrr = totals.mrrByStatus.at_risk ?? 0
  const canceledMrr = totals.mrrByStatus.canceled ?? 0

  const trend = buildMrrTrend(data ?? [])

  return (
    <Card className="gap-0 py-0">
      <header className="flex items-center justify-between gap-4 border-b border-border/60 p-6">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="font-heading text-lg font-medium">
            Recurring products
          </h2>
          <p className="text-sm text-muted-foreground">
            {totals.counts.active ?? 0} active ▪{" "}
            {totals.counts.at_risk ?? 0} at-risk ▪{" "}
            {totals.counts.canceled ?? 0} canceled
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Plus />
          New plan
        </Button>
      </header>

      <div className="grid items-stretch gap-0 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <MrrSummary
          currentMrr={currentMrr}
          atRiskMrr={atRiskMrr}
          canceledMrr={canceledMrr}
          trend={trend}
        />
        <MrrDataTable rows={rows} />
      </div>
    </Card>
  )
}

function MrrSummary({
  currentMrr,
  atRiskMrr,
  canceledMrr,
  trend,
}: {
  currentMrr: number
  atRiskMrr: number
  canceledMrr: number
  trend: MrrTrendPoint[]
}) {
  const arr = currentMrr * 12
  const latest = trend[trend.length - 1]
  const nowLabel = latest ? latest.month.split(" ")[0] : ""
  const mrrK = `${((latest?.mrr ?? currentMrr) / 1000).toFixed(2)}K`

  return (
    <div className="grid grid-rows-[auto_auto_auto] divide-y divide-border/60 lg:border-r lg:border-border/60">
      <div className="p-6">
        <p className="text-overline font-medium uppercase text-muted-foreground">
          Current MRR
        </p>
        <div className="mt-3 flex items-baseline gap-3">
          <p className="font-heading text-4xl font-medium tabular-nums">
            {fmtMoney.format(currentMrr)}
          </p>
        </div>
        <p className="mt-2 text-overline font-medium uppercase text-muted-foreground">
          Annualised ▪ {fmtMoney.format(arr)} ARR
        </p>
      </div>

      <div className="p-6">
        <div className="flex items-baseline justify-between">
          <p className="text-overline font-medium uppercase text-muted-foreground">
            11-month trend
          </p>
          <p className="text-overline font-medium uppercase text-muted-foreground">
            {nowLabel} ▪ ${mrrK}
          </p>
        </div>
        <div className="mt-4">
          <MrrTrendChart data={trend} />
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-border/60">
        <SummaryStat
          label="At-risk"
          value={fmtMoney.format(atRiskMrr)}
          valueClass={atRiskMrr > 0 ? "text-orange-500" : undefined}
        />
        <SummaryStat
          label="Canceled MRR"
          value={fmtMoney.format(canceledMrr)}
          valueClass={canceledMrr > 0 ? "text-destructive" : undefined}
        />
        <SummaryStat label="Churn (30d)" value="0.0%" />
      </div>
    </div>
  )
}

function SummaryStat({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="p-6">
      <p className="text-overline font-medium uppercase text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-3 font-heading text-2xl font-medium tabular-nums",
          valueClass,
        )}
      >
        {value}
      </p>
    </div>
  )
}
