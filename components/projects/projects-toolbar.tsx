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
  PRODUCT_TYPE_LABEL,
  type PaymentStatus,
  type ProjectProductType,
} from "./project-types"
import { PAYMENT_STATUS_LABEL } from "@/lib/status-colors"

type Sort = "recent" | "value" | "deadline" | "stage"

const SORT_LABEL: Record<Sort, string> = {
  recent: "Recently added",
  value: "One-time value",
  deadline: "Deadline",
  stage: "Stage",
}

function useProjectsNav() {
  const router = useRouter()
  const params = useSearchParams()

  return React.useCallback(
    (mutator: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString())
      mutator(next)
      next.delete("project")
      next.delete("page")
      const qs = next.toString()
      router.push(qs ? `/projects?${qs}` : "/projects", { scroll: false })
    },
    [params, router]
  )
}

export function ProjectsSearch({ q }: { q: string }) {
  const pushWith = useProjectsNav()
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
        placeholder="Search title, client, product"
        className="text-sm"
      />
    </InputGroup>
  )
}

export function ProjectsFilters({
  product,
  rep,
  payment,
  sort,
  reps,
}: {
  product: ProjectProductType | "all"
  rep: string
  payment: PaymentStatus | "all"
  sort: Sort
  reps: { id: string; full_name: string | null }[]
}) {
  const pushWith = useProjectsNav()

  const activeCount =
    (product !== "all" ? 1 : 0) +
    (rep !== "all" ? 1 : 0) +
    (payment !== "all" ? 1 : 0) +
    (sort !== "recent" ? 1 : 0)

  function resetAll() {
    pushWith((next) => {
      next.delete("product")
      next.delete("rep")
      next.delete("payment")
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
              Product
            </p>
            <Select
              value={product}
              onValueChange={(v) =>
                pushWith((next) => {
                  if (!v || v === "all") next.delete("product")
                  else next.set("product", v)
                })
              }
            >
              <SelectTrigger size="sm" className="w-full">
                <SelectValue placeholder="All products">
                  {(value) =>
                    !value || value === "all"
                      ? "All products"
                      : (PRODUCT_TYPE_LABEL[value as ProjectProductType] ??
                        "All products")
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Product</SelectLabel>
                  <SelectItem value="all">All products</SelectItem>
                  {(
                    Object.entries(PRODUCT_TYPE_LABEL) as [
                      ProjectProductType,
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
              One-time payment
            </p>
            <Select
              value={payment}
              onValueChange={(v) =>
                pushWith((next) => {
                  if (!v || v === "all") next.delete("payment")
                  else next.set("payment", v)
                })
              }
            >
              <SelectTrigger size="sm" className="w-full">
                <SelectValue placeholder="All one-time">
                  {(value) =>
                    !value || value === "all"
                      ? "All one-time"
                      : (PAYMENT_STATUS_LABEL[value as PaymentStatus] ??
                        "All one-time")
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>One-time payment</SelectLabel>
                  <SelectItem value="all">All one-time</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="link_sent">Link sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
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
                <SelectValue placeholder="Recently added">
                  {(value) =>
                    value
                      ? (SORT_LABEL[value as Sort] ?? "Recently added")
                      : "Recently added"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Sort by</SelectLabel>
                  <SelectItem value="recent">Recently added</SelectItem>
                  <SelectItem value="value">One-time value</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="stage">Stage</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
