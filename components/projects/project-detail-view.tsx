import Link from "next/link"
import { ArrowUpRight, Layers } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { BreadcrumbCurrentPortal } from "@/components/layout/breadcrumb-current-portal"
import { cn } from "@/lib/utils"
import {
  paymentStatusBadgeClass,
  paymentStatusLabel,
} from "@/lib/status-colors"
import { GenerateDocumentDialog } from "@/components/documents/generate-document-dialog"
import { ActivateRecurringPlanBanner } from "./activate-recurring-plan"
import { EditProjectDialog } from "./project-form-dialog"
import { ProjectBoard, type ProjectTaskRow } from "./project-board"
import { ProjectDetailsSheet } from "./project-details-sheet"
import { ProjectStageBadge } from "./project-stage-badge"
import { RecurringPaymentsTable } from "./recurring-payments-table"
import {
  formatDate,
  PRODUCT_TYPE_LABEL,
  projectPaidTotal,
  projectDisplayClient,
  type ProjectRow,
} from "./project-types"

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-overline font-medium text-muted-foreground uppercase">
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
          <span className="text-xs text-muted-foreground tabular-nums">
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

function subscriptionStatusLabel(
  status: NonNullable<ProjectRow["subscription"]>["status"]
) {
  if (status === "at_risk") return "At risk"
  if (status === "pending") return "Pending"
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

export function ProjectDetailView({
  project,
  clients,
  reps,
  invoices,
  tasks,
  currentUserId,
  documentTemplates,
  canSendEmail,
}: {
  project: ProjectRow
  clients: { id: string; name: string; company: string | null }[]
  reps: { id: string; full_name: string | null }[]
  invoices: SubscriptionInvoiceRow[]
  tasks: ProjectTaskRow[]
  currentUserId: string | null
  documentTemplates: { id: string; name: string; kind: string }[]
  canSendEmail: boolean
}) {
  const clientDisplay = projectDisplayClient(project)
  const productLabel = project.product_type
    ? PRODUCT_TYPE_LABEL[project.product_type]
    : "No product set"
  const oneTimeValue = project.value ?? 0
  const oneTimePaid = projectPaidTotal(project)
  const oneTimeOutstanding = Math.max(oneTimeValue - oneTimePaid, 0)
  const paidPct =
    oneTimeValue > 0 ? Math.round((oneTimePaid / oneTimeValue) * 100) : null
  const inPipeline =
    project.stage === "proposal" || project.stage === "negotiation"
  const hasOneTimeAmount =
    project.value != null || Boolean(project.subscription)
  const oneTimeMoney = (amount: number) =>
    hasOneTimeAmount ? fmtMoney.format(amount) : "—"

  const paidInvoices = invoices.filter((i) => i.status === "paid")
  const recurringTotal = paidInvoices.reduce(
    (sum, i) => sum + Number(i.amount_paid),
    0
  )

  return (
    <div className="space-y-10">
      <BreadcrumbCurrentPortal>{clientDisplay}</BreadcrumbCurrentPortal>

      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <ProjectStageBadge stage={project.stage} />
          {oneTimeValue > 0 ? (
            <Badge
              variant="outline"
              className={cn(
                "border-transparent uppercase",
                paymentStatusBadgeClass(project.payment_status)
              )}
            >
              {paymentStatusLabel(project.payment_status)}
            </Badge>
          ) : project.subscription ? (
            <Badge
              variant="outline"
              className={cn(
                "border-transparent uppercase",
                subscriptionStatusBadgeClass(project.subscription.status)
              )}
            >
              Recurring {subscriptionStatusLabel(project.subscription.status)}
            </Badge>
          ) : null}
          <span className="text-xs text-muted-foreground uppercase">
            {productLabel}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {project.client ? (
            <GenerateDocumentDialog
              clientId={project.client.id}
              projectId={project.id}
              templates={documentTemplates}
              existingKinds={(project.documents ?? []).map((d) => d.kind)}
            />
          ) : null}
          <ProjectDetailsSheet
            project={project}
            canSendEmail={canSendEmail}
          />
          <EditProjectDialog project={project} clients={clients} reps={reps} />
        </div>
      </header>

      {project.subscription?.status === "pending" ? (
        <ActivateRecurringPlanBanner
          project={{
            id: project.id,
            value: project.value,
            stage: project.stage,
            payment_status: project.payment_status,
            deposit_paid_at: project.deposit_paid_at,
            subscription: project.subscription,
          }}
        />
      ) : null}

      {inPipeline ? (
        <Link
          href="/pipeline"
          className="group flex items-center justify-between gap-4 border border-border/60 bg-muted/20 px-5 py-4 transition-colors hover:border-border hover:bg-muted/30"
        >
          <span className="flex items-center gap-3 text-sm">
            <Layers aria-hidden className="size-4 text-muted-foreground" />
            <span>
              This deal is still in the pipeline. Send contracts and collect the
              deposit from the pipeline board.
            </span>
          </span>
          <span className="text-overline inline-flex shrink-0 items-center gap-1 font-medium text-muted-foreground uppercase transition-colors group-hover:text-foreground">
            Open pipeline
            <ArrowUpRight aria-hidden className="size-3" />
          </span>
        </Link>
      ) : null}

      <div
        className={cn(
          "grid grid-cols-1 gap-4 sm:grid-cols-2",
          project.subscription ? "xl:grid-cols-4" : "xl:grid-cols-3"
        )}
      >
        <KpiCard
          label="One-time Value"
          value={oneTimeMoney(oneTimeValue)}
          footer={
            project.financing_enabled ? "Financing · 12 months" : "Fixed price"
          }
        />
        <KpiCard
          label="One-time Collected"
          value={oneTimeMoney(oneTimePaid)}
          badge={paidPct != null ? `${paidPct}% of contract` : undefined}
          footer={
            oneTimePaid > 0 ? "Paid to date" : "No payments yet"
          }
        />
        {project.subscription ? (
          <KpiCard
            label="Monthly Revenue"
            value={
              <>
                {fmtMoney.format(project.subscription.monthly_rate)}
                <span className="ml-1 text-sm text-muted-foreground">/mo</span>
              </>
            }
            footer={subscriptionStatusLabel(project.subscription.status)}
          />
        ) : null}
        <KpiCard
          label="One-time Outstanding"
          value={oneTimeMoney(oneTimeOutstanding)}
          footer={
            project.deadline ? `Due ${formatDate(project.deadline)}` : "—"
          }
        />
      </div>

      <div className="space-y-10">
        <ProjectBoard
          projectId={project.id}
          tasks={tasks}
          reps={reps}
          currentUserId={currentUserId}
        />

        {project.subscription ? (
          <Section
            title="Recurring payments"
            count={invoices.length}
            action={
              recurringTotal > 0 ? (
                <span className="text-xs text-muted-foreground uppercase tabular-nums">
                  {fmtMoney.format(recurringTotal)} collected
                </span>
              ) : undefined
            }
          >
            <RecurringPaymentsTable invoices={invoices} />
          </Section>
        ) : null}
      </div>
    </div>
  )
}
