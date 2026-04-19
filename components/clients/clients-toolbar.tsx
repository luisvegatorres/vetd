"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import * as React from "react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Sort = "lifetime" | "mrr" | "name" | "recent"

const SORT_LABEL: Record<Sort, string> = {
  lifetime: "Lifetime",
  mrr: "MRR",
  name: "Name",
  recent: "Recently added",
}

function useClientsNav() {
  const router = useRouter()
  const params = useSearchParams()

  return React.useCallback(
    (mutator: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString())
      mutator(next)
      next.delete("client")
      next.delete("page")
      const qs = next.toString()
      router.push(qs ? `/clients?${qs}` : "/clients", { scroll: false })
    },
    [params, router],
  )
}

export function ClientsSearch({ q }: { q: string }) {
  const pushWith = useClientsNav()
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
    <InputGroup className="h-8 w-full max-w-80">
      <InputGroupAddon>
        <Search aria-hidden className="size-3.5" />
      </InputGroupAddon>
      <InputGroupInput
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder="Search name, contact, industry"
        className="text-sm"
      />
    </InputGroup>
  )
}

export function ClientsFilters({
  industry,
  sort,
  industries,
}: {
  industry: string
  sort: Sort
  industries: string[]
}) {
  const pushWith = useClientsNav()

  return (
    <div className="flex items-center gap-2">
      <Select
        value={industry}
        onValueChange={(v) =>
          pushWith((next) => {
            if (!v || v === "all") next.delete("industry")
            else next.set("industry", v)
          })
        }
      >
        <SelectTrigger size="sm" className="w-40">
          <SelectValue placeholder="All industries">
            {(value) => (!value || value === "all" ? "All industries" : value)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Industry</SelectLabel>
            <SelectItem value="all">All industries</SelectItem>
            {industries.map((label) => (
              <SelectItem key={label} value={label}>
                {label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        value={sort}
        onValueChange={(v) =>
          pushWith((next) => {
            if (!v || v === "lifetime") next.delete("sort")
            else next.set("sort", v)
          })
        }
      >
        <SelectTrigger size="sm" className="w-36">
          <SelectValue placeholder="Lifetime">
            {(value) =>
              value ? (SORT_LABEL[value as Sort] ?? "Lifetime") : "Lifetime"
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Sort by</SelectLabel>
            <SelectItem value="lifetime">Lifetime</SelectItem>
            <SelectItem value="mrr">MRR</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="recent">Recently added</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
