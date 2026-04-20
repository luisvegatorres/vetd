"use client"

import { useRouter, useSearchParams } from "next/navigation"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { ProjectTab } from "./project-types"

const TABS: { value: ProjectTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "proposal", label: "Proposal" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
]

export function ProjectsTabs({
  active,
  counts,
}: {
  active: ProjectTab
  counts: Record<ProjectTab, number>
}) {
  const router = useRouter()
  const params = useSearchParams()

  function handleChange(value: unknown) {
    if (typeof value !== "string") return
    const next = new URLSearchParams(params.toString())
    if (value === "all") next.delete("tab")
    else next.set("tab", value)
    next.delete("project")
    next.delete("page")
    const qs = next.toString()
    router.push(qs ? `/projects?${qs}` : "/projects", { scroll: false })
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
