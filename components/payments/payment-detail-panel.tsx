import Link from "next/link"
import { ArrowUpRight, Receipt, RefreshCcw, Repeat } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Dot } from "@/components/ui/dot"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  paymentStatusBadgeClass,
  paymentStatusLabel,
} from "@/lib/status-colors"
import {
  formatDate,
  formatUsdFull,
  PRODUCT_TYPE_LABEL,
} from "@/components/projects/project-types"
import {
  billingReasonLabel,
  PAYMENT_KIND_LABEL,
  paymentDisplayClient,
  type PaymentRow,
} from "./payment-types"

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

function formatDateCompact(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "2-digit",
  })
}

function formatBillingPeriod(
  start: string | null,
  end: string | null
): string | null {
  if (!start && !end) return null
  const fmt = (iso: string | null) => {
    if (!iso) return "—"
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }
  return `${fmt(start)} – ${fmt(end)}`
}

export function PaymentDetailPanel({
  payment,
}: {
  payment: PaymentRow | null
}) {
  if (!payment) {
    return (
      <Card className="flex min-h-80 flex-col items-center justify-center gap-0 p-10 text-center">
        <p className="text-overline font-medium text-muted-foreground uppercase">
          No Payment Selected
        </p>
        <p className="mt-4 max-w-xs text-sm text-muted-foreground">
          Pick a row to see the full transaction record.
        </p>
      </Card>
    )
  }

  const clientDisplay = paymentDisplayClient(payment)
  const kindLabel = PAYMENT_KIND_LABEL[payment.kind]
  const period = formatBillingPeriod(payment.period_start, payment.period_end)
  const productLabel = payment.project?.product_type
    ? PRODUCT_TYPE_LABEL[payment.project.product_type]
    : null

  return (
    <Card className="flex min-h-80 flex-col gap-0 py-0">
      <CardHeader className="gap-4 p-6">
        <Badge
          variant="outline"
          className={cn(
            "w-fit border-transparent uppercase",
            paymentStatusBadgeClass(payment.status)
          )}
        >
          {paymentStatusLabel(payment.status)}
        </Badge>
        <div className="min-w-0 space-y-1">
          <CardTitle className="line-clamp-2 font-sans text-xl leading-tight">
            {clientDisplay}
          </CardTitle>
          <CardDescription className="flex items-center gap-2 truncate">
            {payment.kind === "subscription" ? (
              <Repeat aria-hidden className="size-3.5 shrink-0" />
            ) : null}
            <span className="truncate">{kindLabel}</span>
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col p-0">
        <Separator />
        <div className="grid grid-cols-2 bg-muted/10">
          <StatBlock
            label="Amount"
            value={formatUsdFull(payment.amount)}
          />
          <StatBlock
            label={payment.paid_at ? "Paid on" : "Created"}
            value={formatDateCompact(payment.paid_at ?? payment.created_at)}
            className="border-l border-border/60"
          />
        </div>
        <Separator />

        <div className="divide-y divide-border/60 px-6 py-3">
          {payment.kind === "subscription" && payment.subscription ? (
            <DetailRow
              label="Plan"
              value={
                payment.subscription.monthly_rate > 0 ? (
                  <span className="inline-flex items-center gap-2">
                    {payment.subscription.plan}
                    <Dot />
                    <span className="text-muted-foreground tabular-nums">
                      {formatUsdFull(payment.subscription.monthly_rate)}/mo
                    </span>
                  </span>
                ) : (
                  payment.subscription.plan
                )
              }
            />
          ) : null}
          {payment.kind === "subscription" ? (
            <DetailRow
              label="Billing reason"
              value={billingReasonLabel(payment.billing_reason)}
            />
          ) : null}
          {period ? (
            <DetailRow label="Period" value={period} />
          ) : null}
          {payment.kind === "one_time" && payment.project ? (
            <DetailRow
              label="Project"
              value={payment.project.title}
              hint={productLabel}
            />
          ) : null}
          <DetailRow
            label="Rep"
            value={
              payment.rep?.full_name ?? (
                <span className="text-muted-foreground">Unassigned</span>
              )
            }
          />
          {payment.stripe_id ? (
            <DetailRow
              label="Stripe id"
              value={
                <span className="font-mono text-xs text-muted-foreground">
                  {payment.stripe_id}
                </span>
              }
            />
          ) : null}
        </div>
      </CardContent>

      <Separator />
      <CardFooter className="mt-auto flex-col items-stretch gap-3 p-6">
        {payment.project ? (
          <Link
            href={`/projects/${payment.project.id}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "w-full gap-2"
            )}
          >
            View project
            <ArrowUpRight aria-hidden />
          </Link>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" disabled className="gap-2">
            <Receipt aria-hidden />
            Receipt
          </Button>
          <Button variant="outline" size="sm" disabled className="gap-2">
            <RefreshCcw aria-hidden />
            Refund
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Actions coming soon — refunds and receipts are read-only for now.
        </p>
      </CardFooter>
    </Card>
  )
}
