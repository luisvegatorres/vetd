"use client"

import Link from "next/link"
import {
  Activity,
  CalendarClock,
  CalendarPlus,
  CircleAlert,
  CircleCheck,
  CircleMinus,
  FileText,
  Info,
  MoreHorizontal,
  NotebookText,
  PanelRight,
  Repeat,
  Send,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  documentStatusBadgeClass,
  documentStatusLabel,
} from "@/lib/status-colors"
import { CancelSubscriptionButton } from "@/components/subscriptions/cancel-subscription-button"
import { SendSubscriptionLink } from "@/components/subscriptions/send-subscription-link"
import { DocumentActionsPopover } from "@/components/documents/document-actions-popover"
import { ScheduleMeetingButton } from "@/components/clients/schedule-meeting-button"
import { SendDepositLink } from "./send-deposit-link"
import { SendDocumentButton } from "./send-document-button"
import {
  formatDate,
  formatUsdFull,
  isDepositPending,
  PRODUCT_TYPE_LABEL,
  type ProjectDocument,
  type ProjectRow,
  type ProjectSubscription,
} from "./project-types"

function DocumentItem({
  doc,
  clientEmail,
}: {
  doc: ProjectDocument
  clientEmail: string | null | undefined
}) {
  return (
    <Item variant="outline" size="sm">
      <ItemContent>
        <ItemTitle>
          <Link href={`/documents/${doc.id}`} className="hover:underline">
            {doc.title}
          </Link>
        </ItemTitle>
        <ItemDescription>{formatDate(doc.created_at)}</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Badge
          variant="outline"
          className={cn(
            "border-transparent uppercase",
            documentStatusBadgeClass(doc.status)
          )}
        >
          {documentStatusLabel(doc.status)}
        </Badge>
        {doc.has_pdf ? (
          <DocumentActionsPopover
            doc={doc}
            clientEmail={clientEmail}
            trigger={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Document actions"
              >
                <MoreHorizontal aria-hidden />
              </Button>
            }
          />
        ) : null}
      </ItemActions>
    </Item>
  )
}

function SectionHeading({
  icon: Icon,
  label,
  meta,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  label: string
  meta?: string | number | null
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon aria-hidden className="size-4 text-muted-foreground" />
      <span className="text-sm font-medium">{label}</span>
      {meta != null && meta !== "" ? (
        <span className="text-xs text-muted-foreground tabular-nums">
          {meta}
        </span>
      ) : null}
    </div>
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
    <div className="flex flex-col gap-1">
      <p className="text-overline font-medium text-muted-foreground uppercase">
        {label}
      </p>
      <div className="min-w-0 text-sm">{children}</div>
    </div>
  )
}

type SubscriptionStatus = {
  tone: "attention" | "info"
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  short: string
  dialogTitle: string
  dialogBody: string
}

function resolveSubscriptionStatus(
  sub: ProjectSubscription
): SubscriptionStatus {
  const stripeLinked = !!sub.stripe_subscription_id

  if (!stripeLinked) {
    return {
      tone: "attention",
      icon: CircleAlert,
      short: "Awaiting checkout",
      dialogTitle: "Stripe isn't collecting yet",
      dialogBody:
        "This plan is set up in the CRM but Stripe isn't charging the client. Send a checkout link to activate billing. Once the client pays, Stripe starts the monthly cycle automatically.",
    }
  }
  if (sub.status === "at_risk") {
    return {
      tone: "attention",
      icon: CircleAlert,
      short: "Payment at risk",
      dialogTitle: "Recent payment failed",
      dialogBody:
        "Stripe will automatically retry the charge on its schedule. If retries exhaust, the subscription will cancel. Follow up with the client if you want to resolve it manually.",
    }
  }
  if (sub.status === "canceled") {
    return {
      tone: "info",
      icon: CircleMinus,
      short: "Canceled",
      dialogTitle: "Subscription canceled",
      dialogBody:
        "This plan has been canceled and no further charges will be collected. Previously paid invoices remain in the record.",
    }
  }
  return {
    tone: "info",
    icon: CircleCheck,
    short: `Since ${formatDate(sub.started_at)}`,
    dialogTitle: "Active plan",
    dialogBody:
      "Stripe is charging the client on the monthly cycle. The next invoice will post automatically.",
  }
}

function SubscriptionStatusItem({
  sub,
  clientId,
}: {
  sub: ProjectSubscription
  clientId: string | undefined
}) {
  const status = resolveSubscriptionStatus(sub)
  const StatusIcon = status.icon
  const attention = status.tone === "attention"
  const stripeLinked = !!sub.stripe_subscription_id
  const needsCheckout =
    !stripeLinked && sub.status !== "canceled" && !!clientId

  return (
    <>
      <Item
        variant="outline"
        size="sm"
        className={cn(attention && "border-orange-500/60")}
      >
        <ItemContent>
          <ItemTitle>{sub.plan}</ItemTitle>
          <ItemDescription>{status.short}</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Dialog>
            <DialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Status details"
                />
              }
            >
              <StatusIcon
                aria-hidden
                className={cn(
                  attention
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-muted-foreground"
                )}
              />
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{status.dialogTitle}</DialogTitle>
                <DialogDescription>{status.dialogBody}</DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </ItemActions>
      </Item>
      {needsCheckout && clientId ? (
        <SendSubscriptionLink clientId={clientId} subscriptionId={sub.id} />
      ) : null}
    </>
  )
}

function Section({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-4 border-b border-border/60 px-6 py-5 last:border-b-0",
        className
      )}
    >
      {children}
    </section>
  )
}

function ProjectInfoDialog({
  project,
  productLabel,
}: {
  project: ProjectRow
  productLabel: string
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="w-full gap-2">
            <Info aria-hidden /> View info
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Project info</DialogTitle>
          <DialogDescription>
            Details, scope, and timeline for this project.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <SectionHeading icon={Info} label="Details" />
            <Field label="Rep">
              {project.rep?.full_name ?? (
                <span className="text-muted-foreground">Unassigned</span>
              )}
            </Field>
            <Field label="Product">
              <span className="tracking-wide uppercase">{productLabel}</span>
            </Field>
            <Field label="Financing">
              {project.financing_enabled ? (
                "12-month plan"
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </Field>
          </div>

          <div className="flex flex-col gap-4">
            <SectionHeading
              icon={NotebookText}
              label="Scope"
              meta={project.description ? null : "—"}
            />
            {project.description ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                {project.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No scope recorded.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <SectionHeading icon={CalendarClock} label="Timeline" />
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Added</dt>
              <dd className="text-right tabular-nums">
                {formatDate(project.created_at)}
              </dd>
              <dt className="text-muted-foreground">Start</dt>
              <dd className="text-right tabular-nums">
                {formatDate(project.start_date)}
              </dd>
              <dt className="text-muted-foreground">Deadline</dt>
              <dd className="text-right tabular-nums">
                {formatDate(project.deadline)}
              </dd>
            </dl>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ProjectDetailsSheet({
  project,
  canSendEmail = true,
}: {
  project: ProjectRow
  /** When false, the "Send to client" block renders a reconnect-Google banner in place of the email buttons. */
  canSendEmail?: boolean
}) {
  const productLabel = project.product_type
    ? PRODUCT_TYPE_LABEL[project.product_type]
    : "No product set"
  const sub = project.subscription
  const isActive = sub
    ? sub.status === "active" || sub.status === "at_risk"
    : false
  const stripeLinked = !!sub?.stripe_subscription_id

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="outline" size="sm">
            <PanelRight aria-hidden />
            Details
          </Button>
        }
      />
      <SheetContent className="flex h-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border/60 px-6 py-5">
          <SheetTitle>Project details</SheetTitle>
          <SheetDescription>
            Scope, recurring plan, documents, and activity for this project.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <Section>
            <ProjectInfoDialog
              project={project}
              productLabel={productLabel}
            />
          </Section>

          {(() => {
            const client = project.client
            const clientEmail = client?.email
            if (!client || !clientEmail) return null
            const docs = project.documents ?? []
            const sendableContract = docs.find(
              (d) =>
                d.kind === "contract" && d.has_pdf && d.status !== "sent",
            )
            const sendableProposal = docs.find(
              (d) =>
                d.kind === "proposal" && d.has_pdf && d.status !== "sent",
            )
            const showDeposit = isDepositPending(project)
            return (
              <Section>
                <SectionHeading icon={Send} label="Client actions" />
                {canSendEmail ? (
                  <div className="flex flex-col gap-2">
                    {sendableContract ? (
                      <SendDocumentButton
                        doc={sendableContract}
                        clientEmail={clientEmail}
                        variant="outline"
                        className="w-full"
                      />
                    ) : null}
                    {sendableProposal ? (
                      <SendDocumentButton
                        doc={sendableProposal}
                        clientEmail={clientEmail}
                        variant="outline"
                        className="w-full"
                      />
                    ) : null}
                    {showDeposit ? (
                      <SendDepositLink
                        projectId={project.id}
                        clientEmail={clientEmail}
                        className="w-full"
                      />
                    ) : null}
                    <ScheduleMeetingButton
                      client={{
                        id: client.id,
                        name: client.name,
                        email: clientEmail,
                      }}
                      projectId={project.id}
                      defaultTitle={`${project.title} — kickoff`}
                      trigger={
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full gap-2"
                        >
                          <CalendarPlus aria-hidden />
                          Schedule meeting
                        </Button>
                      }
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
                    <p className="text-muted-foreground">
                      Connect Google from Settings to email documents, share
                      payment links, and schedule meetings directly from the
                      app. Replies land in your inbox and activity is tracked
                      on the client timeline.
                    </p>
                    {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                    <a
                      href="/api/google/oauth/start"
                      className="text-primary hover:underline"
                    >
                      Reconnect Google →
                    </a>
                  </div>
                )}
              </Section>
            )
          })()}

          {sub ? (
            <Section>
              <SectionHeading
                icon={Repeat}
                label="Recurring"
                meta={formatUsdFull(sub.monthly_rate) + "/mo"}
              />
              <div className="flex flex-col gap-3">
                <SubscriptionStatusItem
                  sub={sub}
                  clientId={project.client?.id}
                />
                {isActive && stripeLinked ? (
                  <CancelSubscriptionButton
                    subscriptionId={sub.id}
                    plan={sub.plan}
                    monthlyRate={sub.monthly_rate}
                  />
                ) : null}
              </div>
            </Section>
          ) : null}

          {(() => {
            const docs = project.documents ?? []
            return (
              <Section>
                <SectionHeading
                  icon={FileText}
                  label="Documents"
                  meta={docs.length > 0 ? docs.length : "—"}
                />
                <div className="flex flex-col gap-3">
                  {docs.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No documents generated yet.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {docs.map((doc) => (
                        <DocumentItem
                          key={doc.id}
                          doc={doc}
                          clientEmail={project.client?.email}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </Section>
            )
          })()}

          <Section>
            <SectionHeading
              icon={Activity}
              label="Activity"
              meta={
                project.interactions.length > 0
                  ? project.interactions.length
                  : "—"
              }
            />
            {project.interactions.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No activity yet.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-border/60">
                {project.interactions.map((it, i) => (
                  <li
                    key={`${it.type}-${it.created_at}-${i}`}
                    className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium capitalize">
                        {it.type.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatDate(it.created_at)}
                      </span>
                    </div>
                    {it.summary ? (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {it.summary}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
