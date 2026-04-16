"use client"

import * as React from "react"
import { getCalApi } from "@calcom/embed-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { site } from "@/lib/site"

type BookCallButtonProps = React.ComponentProps<typeof Button>

export function BookCallButton({ children, ...props }: BookCallButtonProps) {
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

  if (!site.calLink) return null

  return (
    <Button
      data-cal-namespace="discovery"
      data-cal-link={site.calLink}
      data-cal-config='{"layout":"month_view"}'
      {...props}
    >
      {children}
    </Button>
  )
}
