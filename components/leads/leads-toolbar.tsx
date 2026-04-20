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
import { SOURCE_LABEL, type ClientSource } from "./lead-types"

type Sort = "score" | "age" | "name"

const SORT_LABEL: Record<Sort, string> = {
  score: "Score",
  age: "Age",
  name: "Name",
}

function useLeadsNav() {
  const router = useRouter()
  const params = useSearchParams()

  return React.useCallback(
    (mutator: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString())
      mutator(next)
      next.delete("lead")
      const qs = next.toString()
      router.push(qs ? `/leads?${qs}` : "/leads", { scroll: false })
    },
    [params, router],
  )
}

export function LeadsSearch({ q }: { q: string }) {
  const pushWith = useLeadsNav()
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
        placeholder="Search name, business, intent"
        className="text-sm"
      />
    </InputGroup>
  )
}

export function LeadsFilters({
  source,
  sort,
}: {
  source: ClientSource | "all"
  sort: Sort
}) {
  const pushWith = useLeadsNav()

  const activeCount =
    (source !== "all" ? 1 : 0) + (sort !== "score" ? 1 : 0)

  function resetAll() {
    pushWith((next) => {
      next.delete("source")
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
                  "bg-primary text-[10px] font-medium tabular-nums text-primary-foreground",
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
          <p className="text-overline font-medium uppercase text-muted-foreground">
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
            <p className="text-overline font-medium uppercase text-muted-foreground">
              Source
            </p>
            <Select
              value={source}
              onValueChange={(v) =>
                pushWith((next) => {
                  if (!v || v === "all") next.delete("source")
                  else next.set("source", v)
                })
              }
            >
              <SelectTrigger size="sm" className="w-full">
                <SelectValue placeholder="All sources">
                  {(value) =>
                    !value || value === "all"
                      ? "All sources"
                      : (SOURCE_LABEL[value as ClientSource] ?? "All sources")
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Source</SelectLabel>
                  <SelectItem value="all">All sources</SelectItem>
                  {(
                    Object.entries(SOURCE_LABEL) as [ClientSource, string][]
                  ).map(([v, label]) => (
                    <SelectItem key={v} value={v}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-overline font-medium uppercase text-muted-foreground">
              Sort by
            </p>
            <Select
              value={sort}
              onValueChange={(v) =>
                pushWith((next) => {
                  if (!v || v === "score") next.delete("sort")
                  else next.set("sort", v)
                })
              }
            >
              <SelectTrigger size="sm" className="w-full">
                <SelectValue placeholder="Score">
                  {(value) =>
                    value ? (SORT_LABEL[value as Sort] ?? "Score") : "Score"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Sort by</SelectLabel>
                  <SelectItem value="score">Score</SelectItem>
                  <SelectItem value="age">Age</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
