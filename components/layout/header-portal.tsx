"use client"

import * as React from "react"
import { createPortal } from "react-dom"

export function HeaderPortal({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = React.useState<HTMLElement | null>(null)

  React.useEffect(() => {
    setTarget(document.getElementById("header-slot"))
  }, [])

  if (!target) return null
  return createPortal(children, target)
}
