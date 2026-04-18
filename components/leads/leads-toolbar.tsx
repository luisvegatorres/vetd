"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import * as React from "react"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
    <div className="relative w-full max-w-80">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder="Search name, company, intent"
        className="h-8 pl-8 text-sm"
      />
    </div>
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

  return (
    <div className="flex items-center gap-2">
      <Select
        value={source}
        onValueChange={(v) =>
          pushWith((next) => {
            if (!v || v === "all") next.delete("source")
            else next.set("source", v)
          })
        }
      >
        <SelectTrigger size="sm" className="w-32">
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
            {(Object.entries(SOURCE_LABEL) as [ClientSource, string][]).map(
              ([v, label]) => (
                <SelectItem key={v} value={v}>
                  {label}
                </SelectItem>
              ),
            )}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        value={sort}
        onValueChange={(v) =>
          pushWith((next) => {
            if (!v || v === "score") next.delete("sort")
            else next.set("sort", v)
          })
        }
      >
        <SelectTrigger size="sm" className="w-32">
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
  )
}
