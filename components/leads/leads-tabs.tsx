"use client"

import { useRouter, useSearchParams } from "next/navigation"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { LeadTab } from "./lead-types"

const TABS: { value: LeadTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "archived", label: "Archived" },
]

export function LeadsTabs({
  active,
  counts,
}: {
  active: LeadTab
  counts: Record<LeadTab, number>
}) {
  const router = useRouter()
  const params = useSearchParams()

  function handleChange(value: unknown) {
    if (typeof value !== "string") return
    const next = new URLSearchParams(params.toString())
    if (value === "all") next.delete("tab")
    else next.set("tab", value)
    next.delete("lead")
    const qs = next.toString()
    router.push(qs ? `/leads?${qs}` : "/leads", { scroll: false })
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
              className="gap-2 text-overline font-medium uppercase tracking-ui"
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
