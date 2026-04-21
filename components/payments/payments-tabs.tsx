"use client"

import { useRouter, useSearchParams } from "next/navigation"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { PaymentTab } from "./payment-types"

const TABS: { value: PaymentTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "one_time", label: "One-time" },
  { value: "subscription", label: "Subscription" },
]

export function PaymentsTabs({
  active,
  counts,
}: {
  active: PaymentTab
  counts: Record<PaymentTab, number>
}) {
  const router = useRouter()
  const params = useSearchParams()

  function handleChange(value: unknown) {
    if (typeof value !== "string") return
    const next = new URLSearchParams(params.toString())
    if (value === "all") next.delete("tab")
    else next.set("tab", value)
    next.delete("payment")
    next.delete("page")
    const qs = next.toString()
    router.push(qs ? `/payments?${qs}` : "/payments", { scroll: false })
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
              className="text-overline gap-2 font-medium uppercase"
            >
              {t.label}
              <span
                className={cn(
                  "tabular-nums",
                  isActive ? "text-foreground" : "text-muted-foreground/70"
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
