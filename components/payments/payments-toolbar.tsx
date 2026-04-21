"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Search, SlidersHorizontal } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
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
