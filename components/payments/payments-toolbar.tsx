"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { CalendarIcon, Search, SlidersHorizontal, X } from "lucide-react"
import * as React from "react"
import type { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  PAYMENT_SORT_LABEL,
  PAYMENT_STATUS_FILTER_LABEL,
  type PaymentSort,
  type PaymentStatusFilter,
} from "./payment-types"

function parseIsoDate(iso: string | null | undefined): Date | undefined {
  if (!iso) return undefined
  const [y, m, d] = iso.split("-").map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}

function toIsoDate(date: Date | undefined): string {
  if (!date) return ""
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function formatRangeLabel(from?: Date, to?: Date): string {
  if (!from && !to) return "All time"
  const short = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  if (from && to) {
    const sameYear = from.getFullYear() === to.getFullYear()
    const thisYear = new Date().getFullYear() === to.getFullYear()
    const suffix = sameYear && !thisYear ? `, ${to.getFullYear()}` : ""
    return `${short(from)} – ${short(to)}${suffix}`
  }
  const only = (from ?? to)!
  return `From ${short(only)}`
}

function usePaymentsNav() {
  const router = useRouter()
  const params = useSearchParams()

  return React.useCallback(
    (mutator: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString())
      mutator(next)
      next.delete("payment")
      next.delete("page")
      const qs = next.toString()
      router.push(qs ? `/payments?${qs}` : "/payments", { scroll: false })
    },
    [params, router]
  )
}

export function PaymentsSearch({ q }: { q: string }) {
  const pushWith = usePaymentsNav()
  const [local, setLocal] = React.useState(q)

  React.useEffect(() => {
    const handle = setTimeout(() => {
      if (local === q) return
      pushWith((next) => {
        if (local) next.set("q", local)
        else next.delete("q")
      })
    }, 250)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local])

  return (
    <InputGroup className="h-8 w-96 max-w-full">
      <InputGroupAddon>
        <Search aria-hidden className="size-3.5" />
      </InputGroupAddon>
      <InputGroupInput
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder="Search client, project, plan, Stripe id"
        className="text-sm"
      />
    </InputGroup>
  )
}

export function PaymentsDateRange({
  from,
  to,
}: {
  from: string
  to: string
}) {
  const pushWith = usePaymentsNav()
  const fromDate = parseIsoDate(from)
  const toDate = parseIsoDate(to)
  const hasRange = Boolean(fromDate || toDate)
  const label = formatRangeLabel(fromDate, toDate)

  const [range, setRange] = React.useState<DateRange | undefined>(() =>
    fromDate || toDate ? { from: fromDate, to: toDate } : undefined
  )

  // Re-seed local state if the URL changes (e.g. clear button, deep link).
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRange(
      fromDate || toDate ? { from: fromDate, to: toDate } : undefined
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to])

  // Push to URL only when both endpoints are picked AND differ from URL state.
  // This prevents partial (one-click) selections from firing navigation.
  React.useEffect(() => {
    if (!range?.from || !range?.to) return
    const nextFrom = toIsoDate(range.from)
    const nextTo = toIsoDate(range.to)
    if (nextFrom === from && nextTo === to) return
    pushWith((params) => {
      params.set("from", nextFrom)
      params.set("to", nextTo)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range])

  function clear(event: React.MouseEvent) {
    event.stopPropagation()
    setRange(undefined)
    pushWith((params) => {
      params.delete("from")
      params.delete("to")
    })
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 gap-2 font-normal",
              !hasRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon aria-hidden className="size-3.5" />
            <span>{label}</span>
            {hasRange ? (
              <span
                role="button"
                aria-label="Clear date range"
                tabIndex={0}
                onClick={clear}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    clear(e as unknown as React.MouseEvent)
                  }
                }}
                className="-mr-1 inline-flex size-4 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X aria-hidden className="size-3" />
              </span>
            ) : null}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-auto p-0">
        <Calendar
          mode="range"
          defaultMonth={range?.from ?? fromDate ?? new Date()}
          selected={range}
          onSelect={setRange}
          numberOfMonths={2}
          disabled={(date) => date > new Date()}
        />
      </PopoverContent>
    </Popover>
  )
}

export function PaymentsFilters({
  status,
  rep,
  sort,
  reps,
}: {
  status: PaymentStatusFilter
  rep: string
  sort: PaymentSort
  reps: { id: string; full_name: string | null }[]
}) {
  const pushWith = usePaymentsNav()

  const activeCount =
    (status !== "all" ? 1 : 0) +
    (rep !== "all" ? 1 : 0) +
    (sort !== "recent" ? 1 : 0)

  function resetAll() {
    pushWith((next) => {
      next.delete("status")
      next.delete("rep")
      next.delete("sort")
    })
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Filters"
            className="relative"
          >
            <SlidersHorizontal aria-hidden />
            {activeCount > 0 ? (
              <span
                aria-hidden
                className={cn(
                  "absolute -top-1 -right-1 flex size-4 items-center justify-center",
                  "bg-primary text-[10px] font-medium text-primary-foreground tabular-nums"
                )}
              >
                {activeCount}
              </span>
            ) : null}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-72 gap-4">
        <div className="flex items-center justify-between">
          <p className="text-overline font-medium text-muted-foreground uppercase">
            Filters
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto px-2 py-0 text-xs font-medium uppercase"
            onClick={resetAll}
            disabled={activeCount === 0}
          >
            Reset
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <p className="text-overline font-medium text-muted-foreground uppercase">
              Status
            </p>
            <Select
              value={status}
              onValueChange={(v) =>
                pushWith((next) => {
                  if (!v || v === "all") next.delete("status")
                  else next.set("status", v)
                })
              }
            >
              <SelectTrigger size="sm" className="w-full">
                <SelectValue placeholder="All statuses">
                  {(value) =>
                    value
                      ? (PAYMENT_STATUS_FILTER_LABEL[
                          value as PaymentStatusFilter
                        ] ?? "All statuses")
                      : "All statuses"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Status</SelectLabel>
                  {(
                    Object.entries(PAYMENT_STATUS_FILTER_LABEL) as [
                      PaymentStatusFilter,
                      string,
                    ][]
                  ).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-overline font-medium text-muted-foreground uppercase">
              Rep
            </p>
            <Select
              value={rep}
              onValueChange={(v) =>
                pushWith((next) => {
                  if (!v || v === "all") next.delete("rep")
                  else next.set("rep", v)
                })
              }
            >
              <SelectTrigger size="sm" className="w-full">
                <SelectValue placeholder="All reps">
                  {(value) => {
                    if (!value || value === "all") return "All reps"
                    const found = reps.find((r) => r.id === value)
                    return found?.full_name ?? "All reps"
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Rep</SelectLabel>
                  <SelectItem value="all">All reps</SelectItem>
                  {reps.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.full_name ?? "Unnamed rep"}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-overline font-medium text-muted-foreground uppercase">
              Sort by
            </p>
            <Select
              value={sort}
              onValueChange={(v) =>
                pushWith((next) => {
                  if (!v || v === "recent") next.delete("sort")
                  else next.set("sort", v)
                })
              }
            >
              <SelectTrigger size="sm" className="w-full">
                <SelectValue placeholder="Most recent">
                  {(value) =>
                    value
                      ? (PAYMENT_SORT_LABEL[value as PaymentSort] ??
                        "Most recent")
                      : "Most recent"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Sort by</SelectLabel>
                  {(
                    Object.entries(PAYMENT_SORT_LABEL) as [PaymentSort, string][]
                  ).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
