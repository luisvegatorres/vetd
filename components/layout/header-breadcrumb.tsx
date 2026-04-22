"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  leads: "Leads",
  pipeline: "Pipeline",
  projects: "Projects",
  clients: "Clients",
  payments: "Payments",
  commissions: "Commissions",
  documents: "Documents",
  templates: "Templates",
  settings: "Settings",
  admin: "Admin",
  analytics: "Analytics",
  "rep-activity": "Rep Activity",
  users: "Users",
  new: "New",
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Paths that correspond to a real page. Parent segments not in this set
// render as plain text so the crumb can't lead to a 404.
const NAVIGABLE_ROUTES = new Set<string>([
  "/dashboard",
  "/leads",
  "/pipeline",
  "/projects",
  "/clients",
  "/payments",
  "/commissions",
  "/documents",
  "/settings",
])

function labelFor(seg: string) {
  return (
    ROUTE_LABELS[seg] ??
    seg
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  )
}

export function HeaderBreadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  if (segments.length === 0) return null

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((seg, i) => {
          const isLast = i === segments.length - 1
          const href = "/" + segments.slice(0, i + 1).join("/")
          const isDynamic = UUID_RE.test(seg)
          const isNavigable = NAVIGABLE_ROUTES.has(href)

          return (
            <React.Fragment key={href}>
              {i > 0 ? <BreadcrumbSeparator /> : null}
              {isLast && isDynamic ? (
                <span id="breadcrumb-parent-slot" className="contents" />
              ) : null}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>
                    {isDynamic ? (
                      <span
                        id="breadcrumb-current-slot"
                        className="inline-flex items-center"
                      />
                    ) : (
                      labelFor(seg)
                    )}
                  </BreadcrumbPage>
                ) : isNavigable ? (
                  <BreadcrumbLink render={<Link href={href} />}>
                    {labelFor(seg)}
                  </BreadcrumbLink>
                ) : (
                  <span>{labelFor(seg)}</span>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
