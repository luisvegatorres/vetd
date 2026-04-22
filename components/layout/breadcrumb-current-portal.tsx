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
