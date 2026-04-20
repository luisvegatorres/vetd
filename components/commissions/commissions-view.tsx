"use client"

import { Check, ExternalLink } from "lucide-react"
import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"

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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { markCommissionPaid } from "@/app/(protected)/commissions/actions"
import { cn } from "@/lib/utils"

type LedgerKind = "signing_bonus" | "monthly_residual"
type LedgerStatus = "pending" | "paid" | "voided"

type LedgerRow = {
  id: string
  kind: LedgerKind
  period_month: string | null
  amount: number
  status: LedgerStatus
  paid_at: string | null
  created_at: string
  notes: string | null
  rep_id: string
  subscription_id: string
}

type ProfileRow = {
  id: string
  full_name: string | null
  role?: string | null
  employment_status?: "active" | "terminated" | null
}

type SubscriptionRow = {
  id: string
  plan: string
  monthly_rate: number
  monthly_residual_amount: number | null
  signing_bonus_amount: number | null
  status: "active" | "at_risk" | "canceled"
  started_at: string
  sold_by: string | null
  client_id: string
  first_payment_at: string | null
}

type ClientRow = { id: string; name: string; company: string | null }

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

const fmtPeriod = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
})

const KIND_LABEL: Record<LedgerKind, string> = {
  signing_bonus: "Signing bonus",
  monthly_residual: "Monthly residual",
}

const STATUS_LABEL: Record<LedgerStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  voided: "Voided",
}

const STATUS_FILTERS: { value: "all" | LedgerStatus; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending only" },
  { value: "paid", label: "Paid only" },
  { value: "voided", label: "Voided only" },
]

function clientLabel(client: ClientRow | undefined): string {
  if (!client) return "Unknown client"
  return client.company?.trim() || client.name
}

export function CommissionsView({
  ledger,
  profiles,
  subscriptions,
  clients,
  assignedClientsCount = 0,
  currentUserId,
  isAdmin,
}: {
  ledger: LedgerRow[]
  profiles: ProfileRow[]
  subscriptions: SubscriptionRow[]
  clients: ClientRow[]
  assignedClientsCount?: number
  currentUserId: string
  isAdmin: boolean
}) {
  const [statusFilter, setStatusFilter] = useState<"all" | LedgerStatus>(
    "pending",
  )
  const [repFilter, setRepFilter] = useState<string>("all")
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const profileMap = useMemo(
    () => new Map(profiles.map((p) => [p.id, p])),
    [profiles],
  )
  const subscriptionMap = useMemo(
    () => new Map(subscriptions.map((s) => [s.id, s])),
    [subscriptions],
  )
  const clientMap = useMemo(
    () => new Map(clients.map((c) => [c.id, c])),
    [clients],
  )

  const filteredLedger = useMemo(() => {
    return ledger.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false
      if (isAdmin && repFilter !== "all" && row.rep_id !== repFilter) {
        return false
      }
      return true
    })
  }, [ledger, statusFilter, repFilter, isAdmin])

  const totals = useMemo(() => {
    const scope = isAdmin
      ? ledger
      : ledger.filter((r) => r.rep_id === currentUserId)
    const pending = scope
      .filter((r) => r.status === "pending")
      .reduce((sum, r) => sum + Number(r.amount), 0)
    const paid = scope
      .filter((r) => r.status === "paid")
      .reduce((sum, r) => sum + Number(r.amount), 0)
    return { pending, paid }
  }, [ledger, isAdmin, currentUserId])

  const myActiveSubs = useMemo(
    () =>
      subscriptions.filter(
        (s) => s.sold_by === currentUserId && s.status === "active",
      ),
    [subscriptions, currentUserId],
  )
  const myMrc = useMemo(
    () =>
      myActiveSubs.reduce(
        (sum, s) => sum + Number(s.monthly_residual_amount ?? 0),
        0,
      ),
    [myActiveSubs],
  )

  // Admin-only team rollup: one row per rep with active subs, MRC, and ledger
  // totals. Terminated reps keep their ledger history but MRC projects to $0
  // because residuals stop accruing on termination.
  const teamRollup = useMemo(() => {
    if (!isAdmin) return []
    return profiles
      .map((p) => {
        const repSubs = subscriptions.filter((s) => s.sold_by === p.id)
        const activeSubs = repSubs.filter((s) => s.status === "active")
        const mrc = activeSubs.reduce(
          (sum, s) => sum + Number(s.monthly_residual_amount ?? 0),
          0,
        )
        const repLedger = ledger.filter((l) => l.rep_id === p.id)
        const pending = repLedger
          .filter((l) => l.status === "pending")
          .reduce((sum, l) => sum + Number(l.amount), 0)
        const paid = repLedger
          .filter((l) => l.status === "paid")
          .reduce((sum, l) => sum + Number(l.amount), 0)
        return {
          id: p.id,
          name: p.full_name ?? "Unnamed",
          role: p.role ?? null,
          employment: p.employment_status ?? null,
          activeSubsCount: activeSubs.length,
          mrc: p.employment_status === "terminated" ? 0 : mrc,
          pending,
          paid,
          touched: repSubs.length > 0 || repLedger.length > 0,
        }
      })
      .filter((r) => r.touched || r.employment === "active")
      .sort((a, b) => b.mrc + b.pending - (a.mrc + a.pending))
  }, [isAdmin, profiles, subscriptions, ledger])

  const teamMrc = useMemo(
    () => teamRollup.reduce((sum, r) => sum + r.mrc, 0),
    [teamRollup],
  )

  // Rep book-of-business: roll up subscriptions they sold.
  const myBook = useMemo(() => {
    const myId = currentUserId
    return subscriptions
      .filter((s) => s.sold_by === myId)
      .map((s) => {
        const client = clientMap.get(s.client_id)
        const ledgerRows = ledger.filter((l) => l.subscription_id === s.id)
        const monthsPaid = ledgerRows.filter(
          (l) => l.kind === "monthly_residual" && l.status !== "voided",
        ).length
        const totalEarned = ledgerRows
          .filter((l) => l.status !== "voided")
          .reduce((sum, l) => sum + Number(l.amount), 0)
        return {
          id: s.id,
          clientLabel: clientLabel(client),
          plan: s.plan,
          monthlyRate: s.monthly_rate,
          residual: s.monthly_residual_amount,
          status: s.status,
          startedAt: s.started_at,
          firstPaymentAt: s.first_payment_at,
          monthsPaid,
          totalEarned,
        }
      })
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
  }, [subscriptions, ledger, currentUserId, clientMap])

  function handleMarkPaid(id: string) {
    setPendingId(id)
    startTransition(async () => {
      const result = await markCommissionPaid(id)
      if (result.ok) {
        toast.success("Marked as paid")
      } else {
        toast.error(result.error)
      }
      setPendingId(null)
    })
  }

  return (
    <div className="space-y-8">
      <div
        className={cn(
          "grid gap-4 sm:grid-cols-2",
          isAdmin ? "xl:grid-cols-3" : "xl:grid-cols-4",
        )}
      >
        {isAdmin ? (
          <KpiCard
            label="Team MRC"
            value={fmtMoney.format(teamMrc)}
            footer="Projected residual payout next cycle."
          />
        ) : (
          <>
            <KpiCard
              label="Clients assigned"
              value={String(assignedClientsCount)}
              footer="Everyone in your pipeline, leads through closed."
            />
            <KpiCard
              label="Active subscriptions"
              value={String(myActiveSubs.length)}
              footer={`Projects MRC of ${fmtMoney.format(myMrc)} next cycle.`}
            />
          </>
        )}
        <KpiCard
          label={isAdmin ? "Pending payouts" : "Owed to you"}
          value={fmtMoney.format(totals.pending)}
          footer="Across all pending ledger rows."
        />
        <KpiCard
          label={isAdmin ? "Paid year-to-date" : "Earned to date"}
          value={fmtMoney.format(totals.paid)}
          footer="Across all paid ledger rows."
        />
      </div>

      {isAdmin ? (
        <section className="border border-border/60">
          <header className="border-b border-border/60 p-6">
            <h2 className="font-heading text-lg font-medium">Team roster</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Per-rep breakdown of active subscriptions, monthly recurring
              commission, and payouts. Residuals freeze when a rep flips to
              terminated.
            </p>
          </header>

          <DataTable cols="minmax(200px,1.6fr) minmax(110px,0.8fr) minmax(90px,0.6fr) minmax(110px,1fr) minmax(110px,1fr) minmax(110px,1fr)">
            <DataTableHeader>
              <DataTableHead>Rep</DataTableHead>
              <DataTableHead>Employment</DataTableHead>
              <DataTableHead align="end">Active subs</DataTableHead>
              <DataTableHead align="end">MRC</DataTableHead>
              <DataTableHead align="end">Pending</DataTableHead>
              <DataTableHead align="end">Paid</DataTableHead>
            </DataTableHeader>
            {teamRollup.length === 0 ? (
              <DataTableEmpty>No team members yet.</DataTableEmpty>
            ) : (
              <DataTableBody>
                {teamRollup.map((r) => (
                  <DataTableRow key={r.id}>
                    <DataTableCell>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium">
                          {r.name}
                        </span>
                        {r.role ? (
                          <span className="truncate text-xs uppercase text-muted-foreground">
                            {r.role.replace("_", " ")}
                          </span>
                        ) : null}
                      </div>
                    </DataTableCell>
                    <DataTableCell>
                      {r.employment ? (
                        <Badge
                          variant="outline"
                          className={cn(
                            "border-transparent uppercase",
                            r.employment === "active" &&
                              "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                            r.employment === "terminated" &&
                              "bg-muted text-muted-foreground",
                          )}
                        >
                          {r.employment}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </DataTableCell>
                    <DataTableCell align="end">
                      <span className="text-sm tabular-nums">
                        {r.activeSubsCount}
                      </span>
                    </DataTableCell>
                    <DataTableCell align="end">
                      <span className="text-sm font-medium tabular-nums">
                        {fmtMoney.format(r.mrc)}
                      </span>
                    </DataTableCell>
                    <DataTableCell align="end">
                      <span
                        className={cn(
                          "text-sm tabular-nums",
                          r.pending > 0 && "font-medium",
                        )}
                      >
                        {fmtMoney.format(r.pending)}
                      </span>
                    </DataTableCell>
                    <DataTableCell align="end">
                      <span className="text-sm tabular-nums text-muted-foreground">
                        {fmtMoney.format(r.paid)}
                      </span>
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            )}
          </DataTable>
        </section>
      ) : null}

      {!isAdmin ? (
        <section className="border border-border/60">
          <header className="border-b border-border/60 p-6">
            <h2 className="font-heading text-lg font-medium">My subscriptions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Active recurring clients you closed. Stay in touch — every month
              they stay is a residual you earn.
            </p>
          </header>

          <DataTable cols="minmax(0,1fr) auto auto auto auto">
            <DataTableHeader>
              <DataTableHead>Client</DataTableHead>
              <DataTableHead align="end">Plan</DataTableHead>
              <DataTableHead align="end">Months paid</DataTableHead>
              <DataTableHead align="end">Earned</DataTableHead>
              <DataTableHead align="end">Status</DataTableHead>
            </DataTableHeader>
            {myBook.length === 0 ? (
              <DataTableEmpty>
                You haven&apos;t closed any subscriptions yet.
              </DataTableEmpty>
            ) : (
              <DataTableBody>
                {myBook.map((row) => (
                  <DataTableRow key={row.id}>
                    <DataTableCell>
                      <p className="text-sm font-medium">{row.clientLabel}</p>
                      <p className="mt-1 text-xs uppercase text-muted-foreground">
                        Since {fmtDate.format(new Date(row.startedAt))}
                      </p>
                    </DataTableCell>
                    <DataTableCell align="end">
                      <span className="text-sm tabular-nums">
                        {row.plan}
                      </span>
                      <span className="ml-1 text-xs text-muted-foreground tabular-nums">
                        ${row.monthlyRate}/mo
                      </span>
                    </DataTableCell>
                    <DataTableCell align="end">
                      <span className="text-sm tabular-nums">
                        {row.monthsPaid}
                      </span>
                    </DataTableCell>
                    <DataTableCell align="end">
                      <span className="text-sm font-medium tabular-nums">
                        {fmtMoney.format(row.totalEarned)}
                      </span>
                    </DataTableCell>
                    <DataTableCell align="end">
                      <Badge
                        variant="outline"
                        className={cn(
                          "border-transparent uppercase",
                          row.status === "active" &&
                            "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                          row.status === "at_risk" &&
                            "bg-amber-500/15 text-amber-700 dark:text-amber-300",
                          row.status === "canceled" &&
                            "bg-muted text-muted-foreground",
                        )}
                      >
                        {row.status.replace("_", " ")}
                      </Badge>
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            )}
          </DataTable>
        </section>
      ) : null}

      <section className="border border-border/60">
        <header className="flex flex-col gap-4 border-b border-border/60 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-lg font-medium">
              {isAdmin ? "Commission ledger" : "Payout history"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isAdmin
                ? "Every signing bonus and monthly residual generated by Stripe webhook events."
                : "Every signing bonus and monthly residual you've earned."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(v) =>
                setStatusFilter(v as "all" | LedgerStatus)
              }
            >
              <SelectTrigger className="w-44">
                <SelectValue>
                  {(value) =>
                    STATUS_FILTERS.find((s) => s.value === value)?.label ?? ""
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Status</SelectLabel>
                  {STATUS_FILTERS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            {isAdmin ? (
              <Select
                value={repFilter}
                onValueChange={(v) => setRepFilter(v ?? "all")}
              >
                <SelectTrigger className="w-44">
                  <SelectValue>
                    {(value) =>
                      value === "all"
                        ? "All reps"
                        : (profileMap.get(value)?.full_name ?? "Unknown rep")
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Rep</SelectLabel>
                    <SelectItem value="all">All reps</SelectItem>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name ?? "Unnamed"}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            ) : null}
          </div>
        </header>

        <DataTable
          cols={
            isAdmin
              ? "minmax(180px,1.6fr) minmax(100px,0.7fr) minmax(140px,1.2fr) minmax(120px,1fr) minmax(110px,1fr) minmax(70px,0.6fr) minmax(120px,1fr)"
              : "minmax(180px,1.6fr) minmax(100px,0.7fr) minmax(120px,1fr) minmax(110px,1fr) minmax(70px,0.6fr) minmax(120px,1fr)"
          }
        >
          <DataTableHeader>
            <DataTableHead>Client</DataTableHead>
            <DataTableHead>Subscription</DataTableHead>
            {isAdmin ? <DataTableHead>Rep</DataTableHead> : null}
            <DataTableHead>Type</DataTableHead>
            <DataTableHead>Period</DataTableHead>
            <DataTableHead align="end">Amount</DataTableHead>
            <DataTableHead align="end">Status</DataTableHead>
          </DataTableHeader>
          {filteredLedger.length === 0 ? (
            <DataTableEmpty>
              No ledger rows match this filter.
            </DataTableEmpty>
          ) : (
            <DataTableBody>
              {filteredLedger.map((row) => {
                const sub = subscriptionMap.get(row.subscription_id)
                const client = sub ? clientMap.get(sub.client_id) : undefined
                const rep = profileMap.get(row.rep_id)
                return (
                  <DataTableRow key={row.id}>
                    <DataTableCell>
                      <span className="truncate text-sm font-medium">
                        {clientLabel(client)}
                      </span>
                    </DataTableCell>
                    <DataTableCell>
                      {sub?.plan ? (
                        <Badge variant="outline" className="uppercase">
                          {sub.plan}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </DataTableCell>
                    {isAdmin ? (
                      <DataTableCell>
                        <span className="text-sm">
                          {rep?.full_name ?? "Unknown"}
                        </span>
                      </DataTableCell>
                    ) : null}
                    <DataTableCell>
                      <span className="text-sm">{KIND_LABEL[row.kind]}</span>
                    </DataTableCell>
                    <DataTableCell>
                      <span className="text-sm tabular-nums">
                        {row.period_month
                          ? fmtPeriod.format(new Date(row.period_month))
                          : fmtDate.format(new Date(row.created_at))}
                      </span>
                    </DataTableCell>
                    <DataTableCell align="end">
                      <span className="text-sm font-medium tabular-nums">
                        {fmtMoney.format(Number(row.amount))}
                      </span>
                    </DataTableCell>
                    <DataTableCell align="end">
                      {isAdmin && row.status === "pending" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          disabled={pendingId === row.id}
                          onClick={() => handleMarkPaid(row.id)}
                        >
                          <Check aria-hidden />
                          Mark paid
                        </Button>
                      ) : (
                        <Badge
                          variant="outline"
                          className={cn(
                            "border-transparent uppercase",
                            row.status === "paid" &&
                              "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                            row.status === "pending" &&
                              "bg-amber-500/15 text-amber-700 dark:text-amber-300",
                            row.status === "voided" &&
                              "bg-muted text-muted-foreground",
                          )}
                        >
                          {STATUS_LABEL[row.status]}
                        </Badge>
                      )}
                    </DataTableCell>
                  </DataTableRow>
                )
              })}
            </DataTableBody>
          )}
        </DataTable>
      </section>

      {isAdmin ? null : (
        <p className="text-xs text-muted-foreground">
          <ExternalLink aria-hidden className="inline size-3" /> Residuals
          continue every month while you&apos;re employed and the subscription
          remains active. Stay in touch with your clients to keep them happy.
        </p>
      )}
    </div>
  )
}
