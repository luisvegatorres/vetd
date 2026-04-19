"use client"

import * as React from "react"
import { getCalApi } from "@calcom/embed-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { site } from "@/lib/site"

export type BookCallPrefill = {
  name?: string
  email?: string
  notes?: string
  guests?: string[]
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
    ;(async () => {
      const cal = await getCalApi({ namespace: "discovery" })
      cal("ui", {
        theme: (resolvedTheme === "dark" ? "dark" : "light") as "light" | "dark",
        hideEventTypeDetails: false,
        layout: "month_view",
      })
    })()
  }, [resolvedTheme])

  const config = React.useMemo(() => {
    const base: Record<string, unknown> = { layout: "month_view" }
    if (prefill?.name) base.name = prefill.name
    if (prefill?.email) base.email = prefill.email
    if (prefill?.notes) base.notes = prefill.notes
    if (prefill?.guests?.length) base.guests = prefill.guests
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
