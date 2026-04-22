"use client"

import Link from "next/link"
import { ArrowUpRight, Clock, FileText } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { Dot } from "@/components/ui/dot"
import { cn } from "@/lib/utils"
import {
  DOC_KIND_LABEL,
  DocumentActionsPopover,
} from "@/components/documents/document-actions-popover"
import {
  paymentStatusBadgeClass,
  paymentStatusLabel,
} from "@/lib/status-colors"
import {
  formatUsdMonthlyShort,
  formatUsdShortWithZero,
  isContractPending,
  isDepositPending,
  PRODUCT_TYPE_LABEL,
  projectDisplayClient,
  type ProjectRow,
} from "@/components/projects/project-types"
import { SendDepositLink } from "@/components/projects/send-deposit-link"

function daysSince(iso: string): number {
  const now = Date.now()
  const then = new Date(iso).getTime()
  return Math.max(0, Math.floor((now - then) / 86_400_000))
}

function subscriptionStatusLabel(
  status: NonNullable<ProjectRow["subscription"]>["status"]
) {
  if (status === "at_risk") return "At risk"
  return status.replace(/_/g, " ")
}

function subscriptionStatusBadgeClass(
  status: NonNullable<ProjectRow["subscription"]>["status"]
) {
  if (status === "active") {
    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
  }
  if (status === "at_risk") {
    return "bg-orange-500/10 text-orange-600 dark:text-orange-400"
  }
  return "bg-muted text-muted-foreground"
}

export function PipelineCard({
  project,
  dragging,
  readOnly,
}: {
  project: ProjectRow
  dragging?: boolean
  readOnly?: boolean
}) {
  const clientDisplay = projectDisplayClient(project)
  const productLabel = project.product_type
    ? PRODUCT_TYPE_LABEL[project.product_type]
    : null
  const personName = project.client?.name ?? null
  const subtitle =
    personName && personName !== clientDisplay ? personName : null
  const value = project.value ?? 0
  const hasOneTimeAmount =
    project.value != null || Boolean(project.subscription)
  const depositPending = isDepositPending(project)
  const contractPending = isContractPending(project)
  const age = daysSince(project.created_at)
  const sendableDocs = (project.documents ?? []).filter((d) => d.has_pdf)
  const hasFooter = !readOnly && (sendableDocs.length > 0 || depositPending)

  return (
    <Card
      size="sm"
      className={cn(
        "group transition-colors",
        readOnly ? "border-border/40" : "hover:border-border",
        dragging ? "cursor-grabbing" : !readOnly && "cursor-grab"
      )}
    >
      <CardHeader>
        <div className="min-w-0 space-y-3">
          {value > 0 ? (
            <Badge
              variant="outline"
              className={cn(
                "border-transparent tracking-wide uppercase",
                paymentStatusBadgeClass(project.payment_status)
              )}
            >
              {paymentStatusLabel(project.payment_status)}
            </Badge>
          ) : project.subscription ? (
            <Badge
              variant="outline"
              className={cn(
                "border-transparent tracking-wide uppercase",
                subscriptionStatusBadgeClass(project.subscription.status)
              )}
            >
              Recurring {subscriptionStatusLabel(project.subscription.status)}
            </Badge>
          ) : null}
          <div className="space-y-1">
            <p className="truncate font-heading text-sm leading-tight font-medium">
              {clientDisplay}
            </p>
            {subtitle ? (
              <p className="truncate text-xs leading-snug text-muted-foreground">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
        <CardAction className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-1">
            <span className="font-heading text-lg leading-none font-medium tabular-nums">
              {hasOneTimeAmount ? (
                formatUsdShortWithZero(value)
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </span>
            {project.subscription ? (
              <span className="text-xs text-muted-foreground uppercase tabular-nums">
                {formatUsdMonthlyShort(project.subscription.monthly_rate)} MRR
              </span>
            ) : null}
          </div>
          <Link
            href={`/projects/${project.id}`}
            aria-label="View project details"
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex size-7 items-center justify-center border border-border/60 text-muted-foreground transition-colors hover:border-border hover:text-foreground focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none"
          >
            <ArrowUpRight aria-hidden className="size-4" />
          </Link>
        </CardAction>
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {project.rep?.full_name ? (
            <span className="truncate">{project.rep.full_name}</span>
          ) : (
            <span>Unassigned</span>
          )}
          {productLabel ? (
            <>
              <Dot />
              <span>{productLabel}</span>
            </>
          ) : null}
          {age > 0 ? (
            <>
              <Dot />
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Clock aria-hidden className="size-3" />
                {age}d
              </span>
            </>
          ) : null}
          {contractPending ? (
            <>
              <Dot />
              <span className="text-amber-600 dark:text-amber-400">
                Contract unsigned
              </span>
            </>
          ) : null}
        </div>
      </CardContent>

      {hasFooter ? (
        <CardFooter
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="flex-col gap-2"
        >
          {sendableDocs.map((doc) => (
            <DocumentActionsPopover
              key={doc.id}
              doc={doc}
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 w-full gap-2 text-xs"
                >
                  <FileText aria-hidden />
                  Send {DOC_KIND_LABEL[doc.kind]}
                </Button>
              }
            />
          ))}
          {depositPending ? (
            <SendDepositLink
              projectId={project.id}
              className="h-8 w-full text-xs"
            />
          ) : null}
        </CardFooter>
      ) : null}
    </Card>
  )
}
