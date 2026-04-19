"use client"

import { useRouter, useSearchParams } from "next/navigation"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { ClientTab } from "./client-types"

const TABS: { value: ClientTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "lead", label: "Lead" },
  { value: "qualified", label: "Qualified" },
  { value: "at_risk", label: "At-Risk" },
  { value: "archived", label: "Archived" },
]

export function ClientsTabs({
  active,
  counts,
}: {
  active: ClientTab
  counts: Record<ClientTab, number>
}) {
  const router = useRouter()
  const params = useSearchParams()

  function handleChange(value: unknown) {
    if (typeof value !== "string") return
    const next = new URLSearchParams(params.toString())
    if (value === "all") next.delete("tab")
    else next.set("tab", value)
    next.delete("client")
    next.delete("page")
    const qs = next.toString()
    router.push(qs ? `/clients?${qs}` : "/clients", { scroll: false })
  }

  return (
    <Tabs value={active} onValueChange={handleChange}>
      <TabsList>
        {TABS.map((t) => {
          const isActive = t.value === active
          return (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="gap-2 text-overline font-medium uppercase"
            >
              {t.label}
              <span
                className={cn(
                  "tabular-nums",
                  isActive ? "text-foreground" : "text-muted-foreground/70",
                )}
              >
                {counts[t.value]}
              </span>
            </TabsTrigger>
          )
        })}
      </TabsList>
    </Tabs>
  )
}
