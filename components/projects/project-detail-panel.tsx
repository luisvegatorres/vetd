import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { Dot } from "@/components/ui/dot"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  paymentStatusBadgeClass,
  paymentStatusLabel,
} from "@/lib/status-colors"
import { ProjectStageBadge } from "./project-stage-badge"
import { SendDepositLink } from "./send-deposit-link"
import {
  formatUsdShort,
  isDepositPending,
  PRODUCT_TYPE_LABEL,
  projectDisplayClient,
  type ProjectRow,
} from "./project-types"

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-overline font-medium uppercase text-muted-foreground">
      {children}
    </p>
  )
}

function StatBlock({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex-1 space-y-2 px-6 py-6">
      <FieldLabel>{label}</FieldLabel>
      <p className="font-heading text-2xl font-medium leading-none tabular-nums">
        {value}
      </p>
    </div>
  )
}

function stripClientPrefix(title: string, client: string): string {
  if (!client || client === "—") return title
  const trimmed = title.trimStart()
  if (!trimmed.toLowerCase().startsWith(client.toLowerCase())) return title
  const rest = trimmed.slice(client.length).replace(/^\s*[·•\-–—:|]\s*/, "")
  return rest.length > 0 ? rest : title
}

export function ProjectDetailPanel({
  project,
}: {
  project: ProjectRow | null
}) {
  if (!project) {
    return (
      <Card className="flex min-h-80 flex-col items-center justify-center gap-0 p-10 text-center">
        <p className="text-overline font-medium uppercase text-muted-foreground">
          No Project Selected
        </p>
        <p className="mt-4 max-w-xs text-sm text-muted-foreground">
          Pick a row to see a summary and open the full details.
        </p>
      </Card>
    )
  }

  const clientDisplay = projectDisplayClient(project)
  const productLabel = project.product_type
    ? PRODUCT_TYPE_LABEL[project.product_type]
    : "No product set"
  const titleDisplay = stripClientPrefix(project.title, clientDisplay)
  const value = project.value ?? 0
  const paid = project.payments
    .filter((p) => p.status === "paid" || p.status === "succeeded")
    .reduce((sum, p) => sum + Number(p.amount), 0)

  return (
    <Card className="flex min-h-80 flex-col gap-0 py-0">
      <CardHeader className="flex-col items-start gap-4 p-6">
        <ProjectStageBadge stage={project.stage} />
        <div className="min-w-0 space-y-1">
          <h2 className="line-clamp-2 font-heading text-xl font-medium leading-tight">
            {titleDisplay}
          </h2>
          <p className="flex items-center gap-2 truncate text-sm text-muted-foreground">
            <span className="truncate">{clientDisplay}</span>
            {clientDisplay !== "—" ? <Dot /> : null}
            <span className="uppercase tracking-wide">{productLabel}</span>
          </p>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col p-0">
        <Separator />
        <div className="flex items-stretch">
          <StatBlock
            label="Value"
            value={
              value > 0 ? (
                formatUsdShort(value)
              ) : (
                <span className="text-muted-foreground">—</span>
              )
            }
          />
          <Separator orientation="vertical" />
          <StatBlock
            label="Paid"
            value={
              paid > 0 ? (
                formatUsdShort(paid)
              ) : (
                <span className="text-muted-foreground">—</span>
              )
            }
          />
        </div>
        <Separator />

        <div className="grid grid-cols-2 gap-x-6 gap-y-5 px-6 py-6">
          <div className="min-w-0 space-y-2">
            <FieldLabel>Payment</FieldLabel>
            <Badge
              variant="outline"
              className={cn(
                "border-transparent uppercase",
                paymentStatusBadgeClass(project.payment_status),
              )}
            >
              {paymentStatusLabel(project.payment_status)}
            </Badge>
          </div>
          <div className="min-w-0 space-y-2">
            <FieldLabel>Rep</FieldLabel>
            <p className="truncate text-sm">
              {project.rep?.full_name ?? (
                <span className="text-muted-foreground">Unassigned</span>
              )}
            </p>
          </div>
        </div>
      </CardContent>

      <Separator />
      <CardFooter className="mt-auto flex-col gap-2 p-6">
        {isDepositPending(project) && project.client ? (
          <SendDepositLink projectId={project.id} className="w-full" />
        ) : null}
        <Link
          href={`/projects/${project.id}`}
          className={cn(
            buttonVariants({
              variant:
                isDepositPending(project) && project.client
                  ? "outline"
                  : "default",
            }),
            "w-full gap-2",
          )}
        >
          View details
          <ArrowUpRight aria-hidden />
        </Link>
      </CardFooter>
    </Card>
  )
}
