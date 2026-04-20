import Link from "next/link"
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Layers,
  Repeat,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Dot } from "@/components/ui/dot"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  paymentStatusBadgeClass,
  paymentStatusLabel,
  projectStageTone,
} from "@/lib/status-colors"
import { CancelSubscriptionButton } from "@/components/subscriptions/cancel-subscription-button"
import { SendPlanAgreement } from "@/components/subscriptions/send-plan-agreement"
import { SendSubscriptionLink } from "@/components/subscriptions/send-subscription-link"
import { EditProjectDialog } from "./project-form-dialog"
import { ProjectBoard, type ProjectTaskRow } from "./project-board"
import { ProjectStageBadge } from "./project-stage-badge"
import {
  formatDate,
  formatUsdFull,
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

function SectionHeader({
  label,
  count,
  action,
}: {
  label: string
  count?: number
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <div className="flex items-baseline gap-3">
        <FieldLabel>{label}</FieldLabel>
        {count != null && count > 0 ? (
          <span className="text-xs tabular-nums text-muted-foreground">
            {count}
          </span>
        ) : null}
      </div>
      {action}
    </div>
  )
}

function Section({
  title,
  count,
  action,
  children,
}: {
  title: string
  count?: number
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <SectionHeader label={title} count={count} action={action} />
      {children}
    </section>
  )
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col gap-3 px-6 py-5">
      <FieldLabel>{label}</FieldLabel>
      <p className="font-heading text-3xl font-medium leading-none tabular-nums">
        {value}
      </p>
      {hint ? (
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

function MetaRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm">
      <span className="text-overline font-medium uppercase text-muted-foreground">
        {label}
      </span>
      <span className="min-w-0 truncate text-right">{children}</span>
    </div>
  )
}

function interactionTypeLabel(type: string): string {
  return type.replace(/_/g, " ")
}

const fmtMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

export type SubscriptionInvoiceRow = {
  id: string
  amount_paid: number
  currency: string
  status: string
  billing_reason: string | null
  period_start: string | null
  period_end: string | null
  paid_at: string | null
  created_at: string
}

function invoiceReasonLabel(reason: string | null): string {
  if (!reason) return "—"
  if (reason === "subscription_create") return "First invoice"
  if (reason === "subscription_cycle") return "Recurring"
  return reason.replace(/_/g, " ")
}

function invoiceStatusTone(status: string): string {
  if (status === "paid") return "text-emerald-600 dark:text-emerald-400"
  if (status === "open" || status === "draft")
    return "text-orange-600 dark:text-orange-400"
  if (status === "uncollectible" || status === "void")
    return "text-destructive"
  return "text-muted-foreground"
}

function stripClientPrefix(title: string, client: string): string {
  if (!client || client === "—") return title
  const trimmed = title.trimStart()
  if (!trimmed.toLowerCase().startsWith(client.toLowerCase())) return title
  const rest = trimmed.slice(client.length).replace(/^\s*[·•\-–—:|]\s*/, "")
  return rest.length > 0 ? rest : title
}

export function ProjectDetailView({
  project,
  clients,
  reps,
  invoices,
  tasks,
}: {
  project: ProjectRow
  clients: { id: string; name: string; company: string | null }[]
  reps: { id: string; full_name: string | null }[]
  invoices: SubscriptionInvoiceRow[]
  tasks: ProjectTaskRow[]
}) {
  const stageTone = projectStageTone(project.stage)
  const clientDisplay = projectDisplayClient(project)
  const productLabel = project.product_type
    ? PRODUCT_TYPE_LABEL[project.product_type]
    : "No product set"
  const titleDisplay = stripClientPrefix(project.title, clientDisplay)
  const value = project.value ?? 0
  const paid = project.payments
    .filter((p) => p.status === "paid" || p.status === "succeeded")
    .reduce((sum, p) => sum + Number(p.amount), 0)
  const outstanding = Math.max(value - paid, 0)
  const paidPct = value > 0 ? Math.round((paid / value) * 100) : null
  const inPipeline = project.stage === "proposal" || project.stage === "negotiation"

  const paidInvoices = invoices.filter((i) => i.status === "paid")
  const recurringTotal = paidInvoices.reduce(
    (sum, i) => sum + Number(i.amount_paid),
    0,
  )

  return (
    <div className="space-y-10">
      <Link
        href="/projects"
        className="-ml-1 inline-flex items-center gap-2 text-overline font-medium uppercase text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-3" />
        Back to projects
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 max-w-3xl space-y-4">
          <div className="flex items-center gap-3">
            <ProjectStageBadge stage={project.stage} />
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
          <h1 className="line-clamp-2 font-heading text-3xl font-medium leading-tight">
            {titleDisplay}
          </h1>
          <p className="flex items-center gap-2 truncate text-sm text-muted-foreground">
            <span className="truncate">{clientDisplay}</span>
            {clientDisplay !== "—" ? <Dot /> : null}
            <span className="uppercase tracking-wide">{productLabel}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <EditProjectDialog
            project={project}
            clients={clients}
            reps={reps}
          />
        </div>
      </header>

      {inPipeline ? (
        <Link
          href="/pipeline"
          className="group flex items-center justify-between gap-4 border border-border/60 bg-muted/20 px-5 py-4 transition-colors hover:border-border hover:bg-muted/30"
        >
          <span className="flex items-center gap-3 text-sm">
            <Layers aria-hidden className="size-4 text-muted-foreground" />
            <span>
              This deal is still in the pipeline. Send contracts and collect
              the deposit from the pipeline board.
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-overline font-medium uppercase text-muted-foreground transition-colors group-hover:text-foreground">
            Open pipeline
            <ArrowUpRight aria-hidden className="size-3" />
          </span>
        </Link>
      ) : null}

      <div className="grid grid-cols-1 border border-border/60 md:grid-cols-3 md:divide-x md:divide-border/60">
        <Stat
          label="Contract Value"
          value={value > 0 ? fmtMoney.format(value) : "—"}
          hint={
            project.financing_enabled ? "Financing · 12 months" : "Fixed price"
          }
        />
        <Stat
          label="Collected"
          value={paid > 0 ? fmtMoney.format(paid) : "—"}
          hint={paidPct != null ? `${paidPct}% of contract` : undefined}
        />
        <Stat
          label="Outstanding"
          value={outstanding > 0 ? fmtMoney.format(outstanding) : "—"}
          hint={
            project.deadline
              ? `Due ${formatDate(project.deadline)}`
              : undefined
          }
        />
      </div>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Project details</CardTitle>
          <CardDescription>{productLabel}</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3 lg:grid-cols-5">
            <div className="flex flex-col gap-1">
              <dt className="text-overline font-medium uppercase text-muted-foreground">
                Stage
              </dt>
              <dd className={stageTone.text}>{stageTone.label}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-overline font-medium uppercase text-muted-foreground">
                Rep
              </dt>
              <dd className="truncate">
                {project.rep?.full_name ?? (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-overline font-medium uppercase text-muted-foreground">
                Start
              </dt>
              <dd className="tabular-nums">
                {formatDate(project.start_date)}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-overline font-medium uppercase text-muted-foreground">
                Deadline
              </dt>
              <dd className="tabular-nums">{formatDate(project.deadline)}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-overline font-medium uppercase text-muted-foreground">
                Financing
              </dt>
              <dd>
                {project.financing_enabled ? (
                  "12-month plan"
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <ProjectBoard projectId={project.id} tasks={tasks} reps={reps} />

      <Section title="Scope">
        {project.description ? (
          <p className="max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {project.description}
          </p>
        ) : (
          <p className="text-sm italic text-muted-foreground">
            No scope recorded.
          </p>
        )}
      </Section>

      {project.subscription ? (
        <Section title="Recurring">
          {(() => {
            const sub = project.subscription
            const isActive = sub.status === "active" || sub.status === "at_risk"
            const stripeLinked = !!sub.stripe_subscription_id
            return (
              <div className="space-y-3">
                <Item variant="outline" size="sm">
                  <ItemMedia variant="icon">
                    <Repeat />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{sub.plan}</ItemTitle>
                    <ItemDescription>
                      {sub.product}
                      <Dot className="mx-2" />
                      Since {formatDate(sub.started_at)}
                    </ItemDescription>
                  </ItemContent>
                  <span className="shrink-0 text-sm tabular-nums">
                    {formatUsdFull(sub.monthly_rate)}
                    <span className="text-xs text-muted-foreground">/mo</span>
                  </span>
                  {isActive ? (
                    <CancelSubscriptionButton
                      subscriptionId={sub.id}
                      plan={sub.plan}
                      monthlyRate={sub.monthly_rate}
                    />
                  ) : null}
                </Item>
                {isActive && !stripeLinked && project.client ? (
                  <div className="flex flex-col gap-3">
                    <SendPlanAgreement />
                    <SendSubscriptionLink
                      clientId={project.client.id}
                      subscriptionId={sub.id}
                    />
                  </div>
                ) : null}
              </div>
            )
          })()}
        </Section>
      ) : null}

      {project.subscription ? (
        <Section
          title="Recurring payments"
          count={invoices.length}
          action={
            recurringTotal > 0 ? (
              <span className="text-xs uppercase tabular-nums text-muted-foreground">
                {fmtMoney.format(recurringTotal)} collected
              </span>
            ) : undefined
          }
        >
          {invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No recurring payments yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {formatDate(inv.paid_at ?? inv.created_at)}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {inv.period_start && inv.period_end
                        ? `${formatDate(inv.period_start)} – ${formatDate(inv.period_end)}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {invoiceReasonLabel(inv.billing_reason)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "uppercase tracking-wide",
                          invoiceStatusTone(inv.status),
                        )}
                      >
                        {inv.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatUsdFull(inv.amount_paid)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Section>
      ) : null}

      <Section title="Activity" count={project.interactions.length}>
        {project.interactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {project.interactions.map((it, i) => (
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
      </Section>

      <section className="space-y-3 border-t border-border/60 pt-8">
        <FieldLabel>Timeline</FieldLabel>
        <div className="divide-y divide-border/60">
          <MetaRow label="Added">
            <span className="tabular-nums">
              {formatDate(project.created_at)}
            </span>
          </MetaRow>
          <MetaRow label="Start">
            <span className="tabular-nums">
              {formatDate(project.start_date)}
            </span>
          </MetaRow>
          <MetaRow label="Deadline">
            <span className="tabular-nums">
              {formatDate(project.deadline)}
            </span>
          </MetaRow>
        </div>
      </section>
    </div>
  )
}
