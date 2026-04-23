"use client"

import * as React from "react"
import { createPortal } from "react-dom"

import {
  BreadcrumbItem,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export function BreadcrumbCurrentPortal({
  children,
}: {
  children: React.ReactNode
}) {
  const [target, setTarget] = React.useState<HTMLElement | null>(null)

  React.useEffect(() => {
    // Look up the slot element after mount; the slot is rendered by the
    // header above us in the tree.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTarget(document.getElementById("breadcrumb-current-slot"))
  }, [])

  if (!target) return null
  return createPortal(children, target)
}

export function BreadcrumbParentPortal({
  children,
}: {
  children: React.ReactNode
}) {
  const [target, setTarget] = React.useState<HTMLElement | null>(null)

  React.useEffect(() => {
    // Look up the slot element after mount; the slot is rendered by the
    // header above us in the tree.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTarget(document.getElementById("breadcrumb-parent-slot"))
  }, [])

  if (!target) return null
  return createPortal(
    <>
      <BreadcrumbItem>{children}</BreadcrumbItem>
      <BreadcrumbSeparator />
    </>,
    target,
  )
}
