import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  paymentStatusBadgeClass,
  paymentStatusLabel,
} from "@/lib/status-colors"
import { subscriptionPlans, type BillablePlanId } from "@/lib/site"
import { SendSubscriptionLink } from "@/components/subscriptions/send-subscription-link"
import { ProjectStageBadge } from "./project-stage-badge"
import { SendDepositLink } from "./send-deposit-link"
import {
  formatUsdShortWithZero,
  isDepositPending,
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

function StatBlock({
  label,
  value,
  hint,
  className,
}: {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-2 px-6 py-6", className)}>
      <FieldLabel>{label}</FieldLabel>
      <p className="font-heading text-2xl leading-none font-medium tabular-nums">
        {value}
      </p>
      {hint ? (
        <p className="text-xs text-muted-foreground uppercase tabular-nums">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

function DetailRow({
  label,
  value,
  hint,
}: {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <FieldLabel>{label}</FieldLabel>
      <div className="min-w-0 text-right">
        <div className="truncate text-sm">{value}</div>
        {hint ? (
          <div className="mt-1 truncate text-xs text-muted-foreground tabular-nums">
            {hint}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function subscriptionBillingHint(
  subscription: NonNullable<ProjectRow["subscription"]>
) {
  if (subscription.paid_total > 0) {
    return `${formatUsdShortWithZero(subscription.paid_total)} collected`
  }
  return null
}

function billablePlanIdForSubscription(
  subscription: NonNullable<ProjectRow["subscription"]>
): BillablePlanId | null {
  const match = Object.values(subscriptionPlans).find(
    (plan) =>
      plan.label.toLowerCase() === subscription.plan.toLowerCase() ||
      plan.monthlyRate === subscription.monthly_rate
  )
  return match?.id ?? null
}

function paymentCountLabel(count: number) {
  return count === 1 ? "1 paid payment" : `${count} paid payments`
}

export function ProjectDetailPanel({
  project,
}: {
  project: ProjectRow | null
}) {
  if (!project) {
    return (
      <Card className="flex min-h-80 flex-col items-center justify-center gap-0 p-10 text-center">
        <p className="text-overline font-medium text-muted-foreground uppercase">
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
  const oneTimeValue = project.value ?? 0
  const oneTimePaid = projectPaidTotal(project)
  const subscriptionOnly = Boolean(project.subscription && oneTimeValue <= 0)
  const stripeActivationPlan = project.subscription
    ? billablePlanIdForSubscription(project.subscription)
    : null
  const canActivateStripeSubscription = Boolean(
    project.subscription &&
    project.client &&
    !project.subscription.stripe_subscription_id &&
    stripeActivationPlan
  )
  const hasCustomPlanNotice = Boolean(
    project.subscription &&
      !project.subscription.stripe_subscription_id &&
      !stripeActivationPlan
  )
  const hasFooterContent =
    canActivateStripeSubscription ||
    hasCustomPlanNotice ||
    (isDepositPending(project) && Boolean(project.client))

  return (
    <Card className="flex min-h-80 flex-col gap-0 py-0">
      <CardHeader className="items-center gap-4 p-6">
        <ProjectStageBadge stage={project.stage} />
        <CardAction>
          <Link
            href={`/projects/${project.id}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-2"
            )}
          >
            View details
            <ArrowUpRight aria-hidden />
          </Link>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col p-0">
        <div className="min-w-0 space-y-1 px-6 pb-6">
          <h2 className="line-clamp-2 font-sans text-xl leading-tight font-medium">
            {clientDisplay}
          </h2>
          <p className="truncate text-sm text-muted-foreground">
            {productLabel}
          </p>
        </div>
        <Separator />
        <div className="grid grid-cols-2 bg-muted/10">
          {subscriptionOnly && project.subscription ? (
            <>
              <StatBlock
                label="Monthly revenue"
                value={
                  <>
                    {formatUsdShortWithZero(project.subscription.monthly_rate)}
                    <span className="ml-1 text-sm text-muted-foreground">
                      /mo
                    </span>
                  </>
                }
                className="py-7"
              />
              <StatBlock
                label="Payments"
                value={project.subscription.paid_payment_count}
                className="border-l border-border/60 py-7"
              />
            </>
          ) : (
            <>
              <StatBlock
                label="One-time value"
                value={formatUsdShortWithZero(oneTimeValue)}
              />
              <StatBlock
                label="One-time paid"
                value={formatUsdShortWithZero(oneTimePaid)}
                className="border-l border-border/60"
              />
              {project.subscription ? (
                <StatBlock
                  label="Monthly revenue"
                  value={
                    <>
                      {formatUsdShortWithZero(
                        project.subscription.monthly_rate
                      )}
                      <span className="ml-1 text-sm text-muted-foreground">
                        /mo
                      </span>
                    </>
                  }
                  hint={paymentCountLabel(
                    project.subscription.paid_payment_count
                  )}
                  className="col-span-2 border-t border-border/60"
                />
              ) : null}
            </>
          )}
        </div>
        <Separator />

        <div className="divide-y divide-border/60 px-6 py-3">
          {!subscriptionOnly ? (
            <DetailRow
              label="One-time payment"
              value={
                oneTimeValue > 0 ? (
                  <Badge
                    variant="outline"
                    className={cn(
                      "border-transparent uppercase",
                      paymentStatusBadgeClass(project.payment_status)
                    )}
                  >
                    {paymentStatusLabel(project.payment_status)}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground tabular-nums">
                    $0 one-time
                  </span>
                )
              }
            />
          ) : null}
          {project.subscription ? (
            <DetailRow
              label="Recurring billing"
              value={project.subscription.plan}
              hint={subscriptionBillingHint(project.subscription)}
            />
          ) : null}
          <DetailRow
            label="Rep"
            value={
              project.rep?.full_name ?? (
                <span className="text-muted-foreground">Unassigned</span>
              )
            }
          />
        </div>
      </CardContent>

      {hasFooterContent ? <Separator /> : null}
      <CardFooter className="mt-auto flex-col gap-4 p-6 empty:hidden">
        {canActivateStripeSubscription &&
        project.subscription &&
        project.client &&
        stripeActivationPlan ? (
          <div className="w-full">
            <div className="mb-3 flex flex-col gap-1">
              <FieldLabel>Stripe activation</FieldLabel>
              <p className="text-xs text-muted-foreground">
                Create the checkout link that connects this CRM subscription to
                Stripe after the customer pays.
              </p>
            </div>
            <SendSubscriptionLink
              clientId={project.client.id}
              subscriptionId={project.subscription.id}
              initialPlanId={stripeActivationPlan}
              generateLabel="Activate in Stripe"
            />
          </div>
        ) : project.subscription &&
          !project.subscription.stripe_subscription_id &&
          !stripeActivationPlan ? (
          <p className="w-full text-xs text-muted-foreground">
            This custom monthly plan needs a Stripe price before it can be
            activated.
          </p>
        ) : null}
        {isDepositPending(project) && project.client ? (
          <SendDepositLink projectId={project.id} className="w-full" />
        ) : null}
      </CardFooter>
    </Card>
  )
}
