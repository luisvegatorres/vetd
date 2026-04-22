"use client"

import * as React from "react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { site } from "@/lib/site"

export type BookCallPrefill = {
  name?: string
  email?: string
  notes?: string
  guests?: string[]
  responses?: Record<string, string | undefined>
}

type BookCallButtonProps = React.ComponentProps<typeof Button> & {
  prefill?: BookCallPrefill
}

export function BookCallButton({
  children,
  prefill,
  ...props
}: BookCallButtonProps) {
  const { resolvedTheme } = useTheme()

  React.useEffect(() => {
    if (!site.calLink) return
    let cancelled = false
    ;(async () => {
      const { getCalApi } = await import("@calcom/embed-react")
      if (cancelled) return
      const cal = await getCalApi({ namespace: "discovery" })
      cal("ui", {
        theme: (resolvedTheme === "dark" ? "dark" : "light") as "light" | "dark",
        hideEventTypeDetails: false,
        layout: "month_view",
      })
    })()
    return () => {
      cancelled = true
    }
  }, [resolvedTheme])

  const config = React.useMemo(() => {
    const base: Record<string, unknown> = { layout: "month_view" }
    if (prefill?.name) base.name = prefill.name
    if (prefill?.email) base.email = prefill.email
    if (prefill?.notes) base.notes = prefill.notes
    if (prefill?.guests?.length) base.guests = prefill.guests
    if (prefill?.responses) {
      for (const [key, value] of Object.entries(prefill.responses)) {
        if (value && value.trim().length > 0) base[key] = value
      }
    }
    return JSON.stringify(base)
  }, [prefill])

  if (!site.calLink) return null

  return (
    <Button
      data-cal-namespace="discovery"
      data-cal-link={site.calLink}
      data-cal-config={config}
      {...props}
    >
      {children}
    </Button>
  )
}
