"use client"

import { useRouter, useSearchParams } from "next/navigation"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type PipelineRange = "month" | "30d" | "quarter"

const TABS: { value: PipelineRange; label: string }[] = [
  { value: "month", label: "This month" },
  { value: "30d", label: "Last 30d" },
  { value: "quarter", label: "Quarter" },
]

export function PipelineRangeTabs({ active }: { active: PipelineRange }) {
  const router = useRouter()
  const params = useSearchParams()

  function handleChange(value: unknown) {
    if (typeof value !== "string") return
    const next = new URLSearchParams(params.toString())
    if (value === "month") next.delete("range")
    else next.set("range", value)
    const qs = next.toString()
    router.push(qs ? `/pipeline?${qs}` : "/pipeline", { scroll: false })
  }

  return (
    <Tabs value={active} onValueChange={handleChange}>
      <TabsList>
        {TABS.map((t) => (
          <TabsTrigger
            key={t.value}
            value={t.value}
            className="text-overline font-medium uppercase"
          >
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
