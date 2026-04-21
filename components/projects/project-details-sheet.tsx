"use client"

import {
  Activity,
  CalendarClock,
  CircleAlert,
  CircleCheck,
  CircleMinus,
  FileText,
  Info,
  NotebookText,
  PanelRight,
  Repeat,
} from "lucide-react"

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
import { CancelSubscriptionButton } from "@/components/subscriptions/cancel-subscription-button"
import { SendPlanAgreement } from "@/components/subscriptions/send-plan-agreement"
import { SendSubscriptionLink } from "@/components/subscriptions/send-subscription-link"
import {
  formatDate,
  formatUsdFull,
  PRODUCT_TYPE_LABEL,
  type ProjectRow,
  type ProjectSubscription,
} from "./project-types"

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
        "This plan is set up in the CRM but Stripe isn't charging the client. Send a checkout link to activate billing — once the client pays, Stripe starts the monthly cycle automatically.",
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

export function ProjectDetailsSheet({ project }: { project: ProjectRow }) {
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
            <SectionHeading icon={Info} label="Details" />
            <div className="flex flex-col gap-4">
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
          </Section>

          <Section>
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
          </Section>

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

          <Section>
            <SectionHeading icon={FileText} label="Documents" meta="—" />
            <div className="flex flex-col gap-3">
              <p className="text-xs text-muted-foreground">
                No contracts on file yet.
              </p>
              {sub ? <SendPlanAgreement className="w-full" /> : null}
            </div>
          </Section>

          <Section>
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
          </Section>

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
