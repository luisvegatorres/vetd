"use client"

import Link from "next/link"
import { ArrowUpRight, Clock, FileText } from "lucide-react"
import { toast } from "sonner"

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
  paymentStatusBadgeClass,
  paymentStatusLabel,
} from "@/lib/status-colors"
import {
  formatUsdShort,
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

function stripClientPrefix(title: string, client: string): string {
  if (!client || client === "—") return title
  const trimmed = title.trimStart()
  if (!trimmed.toLowerCase().startsWith(client.toLowerCase())) return title
  const rest = trimmed.slice(client.length).replace(/^\s*[·•\-–—:|]\s*/, "")
  return rest.length > 0 ? rest : title
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
  const titleDisplay = stripClientPrefix(project.title, clientDisplay)
  const value = project.value ?? 0
  const depositPending = isDepositPending(project)
  const age = daysSince(project.created_at)

  return (
    <Card
      size="sm"
      className={cn(
        "group transition-colors",
        readOnly
          ? "border-border/40"
          : "hover:border-border",
        dragging ? "cursor-grabbing" : !readOnly && "cursor-grab",
      )}
    >
      <CardHeader>
        <div className="min-w-0 space-y-3">
          <Badge
            variant="outline"
            className={cn(
              "border-transparent uppercase tracking-wide",
              paymentStatusBadgeClass(project.payment_status),
            )}
          >
            {paymentStatusLabel(project.payment_status)}
          </Badge>
          <div className="space-y-1">
            <p className="truncate font-heading text-sm font-medium leading-tight">
              {clientDisplay}
            </p>
            <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
              {titleDisplay}
            </p>
          </div>
        </div>
        <CardAction className="flex items-center gap-3">
          <span className="font-heading text-lg font-medium leading-none tabular-nums">
            {value > 0 ? (
              formatUsdShort(value)
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </span>
          <Link
            href={`/projects/${project.id}`}
            aria-label="View project details"
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex size-7 items-center justify-center border border-border/60 text-muted-foreground transition-colors hover:border-border hover:text-foreground focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
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
        </div>
      </CardContent>

      {!readOnly ? (
        <CardFooter
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="flex-col gap-2"
        >
          <Button
            type="button"
            variant="outline"
            className="h-8 w-full gap-2 text-xs"
            onClick={() =>
              toast.info("Contract sending is coming soon", {
                description:
                  "Wire up a contract service (PandaDoc / DocuSign / Stripe e-sig) to enable this.",
              })
            }
          >
            <FileText aria-hidden />
            Send contract
          </Button>
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
