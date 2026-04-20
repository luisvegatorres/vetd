import {
  Calendar,
  CreditCard,
  ExternalLink,
  ReceiptText,
  Repeat,
} from "lucide-react"

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
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  paymentStatusBadgeClass,
  paymentStatusLabel,
  projectStageTone,
} from "@/lib/status-colors"
import { EditProjectDialog } from "./project-form-dialog"
import { ProjectStageBadge } from "./project-stage-badge"
import {
  formatDate,
  formatUsdFull,
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

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0 space-y-2">
      <FieldLabel>{label}</FieldLabel>
      <p className="truncate text-sm">{children}</p>
    </div>
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
    <div className="flex-1 space-y-2 px-6 py-5">
      <FieldLabel>{label}</FieldLabel>
      <p className="font-heading text-2xl font-medium leading-none tabular-nums">
        {value}
      </p>
    </div>
  )
}

function interactionTypeLabel(type: string): string {
  return type.replace(/_/g, " ")
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
  clients,
  reps,
}: {
  project: ProjectRow | null
  clients: { id: string; name: string; company: string | null }[]
  reps: { id: string; full_name: string | null }[]
}) {
  if (!project) {
    return (
      <Card className="flex min-h-80 flex-col items-center justify-center gap-0 p-10 text-center">
        <p className="text-overline font-medium uppercase text-muted-foreground">
          No Project Selected
        </p>
        <p className="mt-4 max-w-xs text-sm text-muted-foreground">
          Pick a row to see timeline, commercials, deposits, and activity.
        </p>
      </Card>
    )
  }

  const stageTone = projectStageTone(project.stage)
  const clientDisplay = projectDisplayClient(project)
  const productLabel = project.product_type
    ? PRODUCT_TYPE_LABEL[project.product_type]
    : "No product set"
  const titleDisplay = stripClientPrefix(project.title, clientDisplay)
  const depositPending = isDepositPending(project)
  const value = project.value ?? 0
  const depositAmount = project.deposit_amount ?? 0
  const commissionAmount = project.commission_amount ?? 0
  const paid = project.payments
    .filter((p) => p.status === "paid" || p.status === "succeeded")
    .reduce((sum, p) => sum + Number(p.amount), 0)

  return (
    <Card className="flex min-h-80 flex-col gap-0 py-0">
      <CardHeader className="items-center p-6">
        <ProjectStageBadge stage={project.stage} />
        <CardAction>
          <EditProjectDialog
            project={project}
            clients={clients}
            reps={reps}
          />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-6 p-0 pb-6">
        <div className="min-w-0 px-6">
          <h2 className="line-clamp-2 font-heading text-xl font-medium leading-tight">
            {titleDisplay}
          </h2>
          <p className="mt-1 flex items-center gap-2 truncate text-sm text-muted-foreground">
            <span className="truncate">{clientDisplay}</span>
            {clientDisplay !== "—" ? <Dot /> : null}
            <span className="uppercase tracking-wide">{productLabel}</span>
          </p>
        </div>

        <div>
          <Separator />
          <div className="flex">
            <StatBlock
              label="Value"
              value={
                value > 0 ? (
                  formatUsdFull(value)
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
                  formatUsdFull(paid)
                ) : (
                  <span className="text-muted-foreground">—</span>
                )
              }
            />
            <Separator orientation="vertical" />
            <StatBlock
              label="Deposit"
              value={
                depositAmount > 0 ? (
                  formatUsdShort(depositAmount)
                ) : (
                  <span className="text-muted-foreground">—</span>
                )
              }
            />
          </div>
          <Separator />
        </div>

        <div className="grid grid-cols-2 gap-6 px-6">
          <Field label="Stage">
            <span className={stageTone.text}>{stageTone.label}</span>
          </Field>
          <Field label="Payment">
            <Badge
              variant="outline"
              className={cn(
                "border-transparent uppercase",
                paymentStatusBadgeClass(project.payment_status),
              )}
            >
              {paymentStatusLabel(project.payment_status)}
            </Badge>
          </Field>
          <Field label="Deposit status">
            {project.deposit_paid_at ? (
              <span className="text-emerald-600 dark:text-emerald-400">
                Paid {formatDate(project.deposit_paid_at)}
              </span>
            ) : depositPending ? (
              <span className="text-orange-600 dark:text-orange-400">
                Pending
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </Field>
          <Field label="Financing">
            {project.financing_enabled ? (
              <span>12-month plan</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </Field>
          <Field label="Commission">
            {commissionAmount > 0 ? (
              <span className="inline-flex items-center gap-2 tabular-nums">
                {formatUsdFull(commissionAmount)}
                <Dot />
                <span className="text-muted-foreground">
                  {project.commission_flat != null
                    ? "flat"
                    : `${project.commission_rate ?? 0}%`}
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </Field>
          <Field label="Rep">
            {project.rep?.full_name ?? (
              <span className="text-muted-foreground">Unassigned</span>
            )}
          </Field>
          <Field label="Added">{formatDate(project.created_at)}</Field>
          <Field label="Start">{formatDate(project.start_date)}</Field>
          <Field label="Deadline">{formatDate(project.deadline)}</Field>
        </div>

        {project.description ? (
          <div className="space-y-2 px-6">
            <FieldLabel>Scope</FieldLabel>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {project.description}
            </p>
          </div>
        ) : null}

        {project.subscription ? (
          <div className="space-y-3 px-6">
            <FieldLabel>Recurring</FieldLabel>
            <Item variant="outline" size="sm">
              <ItemMedia variant="icon">
                <Repeat />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{project.subscription.plan}</ItemTitle>
                <ItemDescription>
                  {project.subscription.product}
                  <Dot className="mx-2" />
                  Since {formatDate(project.subscription.started_at)}
                </ItemDescription>
              </ItemContent>
              <span className="shrink-0 text-sm tabular-nums">
                {formatUsdFull(project.subscription.monthly_rate)}
                <span className="text-xs text-muted-foreground">/mo</span>
              </span>
            </Item>
          </div>
        ) : null}

        <div className="space-y-3 px-6">
          <FieldLabel>Payments</FieldLabel>
          {project.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {project.payments.map((p, i) => (
                <Item
                  key={`${p.status}-${p.amount}-${i}`}
                  variant="outline"
                  size="sm"
                >
                  <ItemMedia variant="icon">
                    <ReceiptText />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle className="tabular-nums">
                      {formatUsdFull(Number(p.amount))}
                    </ItemTitle>
                    <ItemDescription>
                      {paymentStatusLabel(p.status)}
                    </ItemDescription>
                  </ItemContent>
                </Item>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3 px-6">
          <FieldLabel>Activity</FieldLabel>
          {project.interactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {project.interactions.slice(0, 5).map((it, i) => (
                <Item
                  key={`${it.type}-${it.created_at}-${i}`}
                  variant="outline"
                  size="sm"
                >
                  <ItemMedia variant="icon">
                    <Calendar />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle className="capitalize">
                      {interactionTypeLabel(it.type)}
                    </ItemTitle>
                    <ItemDescription className="truncate">
                      {it.summary ?? formatDate(it.created_at)}
                    </ItemDescription>
                  </ItemContent>
                </Item>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="mt-auto flex-col items-stretch gap-3 p-6">
        {depositPending ? (
          <Button className="gap-2" disabled>
            <CreditCard aria-hidden /> Send deposit link
          </Button>
        ) : (
          <Button className="gap-2" variant="outline" disabled>
            <CreditCard aria-hidden /> Deposit handled
          </Button>
        )}
        <Button
          variant="outline"
          className="gap-2"
          disabled={!project.stripe_checkout_session_id}
        >
          <ExternalLink aria-hidden /> Stripe session
        </Button>
      </CardFooter>
    </Card>
  )
}
