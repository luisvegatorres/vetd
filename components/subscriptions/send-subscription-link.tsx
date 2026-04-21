"use client"

import { ArrowUpRight, Check, Copy, ExternalLink } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createSubscriptionCheckoutSession } from "@/lib/stripe/actions"
import { subscriptionPlans, type BillablePlanId } from "@/lib/site"

const PLAN_LABEL: Record<BillablePlanId, string> = {
  presence: subscriptionPlans.presence.label,
  growth: subscriptionPlans.growth.label,
}

export function SendSubscriptionLink({
  clientId,
  subscriptionId,
  initialPlanId = "presence",
  generateLabel = "Generate link",
  className,
}: {
  clientId: string
  subscriptionId?: string
  initialPlanId?: BillablePlanId
  generateLabel?: string
  className?: string
}) {
  const [planId, setPlanId] = useState<BillablePlanId>(initialPlanId)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleGenerate() {
    setCheckoutUrl(null)
    startTransition(async () => {
      const result = await createSubscriptionCheckoutSession({
        clientId,
        planId,
        subscriptionId,
      })
      if (result.ok) {
        setCheckoutUrl(result.url)
        toast.success("Checkout link created")
      } else {
        toast.error(result.error)
      }
    })
  }

  async function handleCopy() {
    if (!checkoutUrl) return
    await navigator.clipboard.writeText(checkoutUrl)
    toast.success("Link copied")
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-3">
        <div className="@container/plan-picker flex flex-col gap-2 @xs/plan-picker:flex-row @xs/plan-picker:items-center">
          <Select
            value={planId}
            onValueChange={(value) => setPlanId(value as BillablePlanId)}
          >
            <SelectTrigger className="w-full @xs/plan-picker:flex-1">
              <SelectValue>
                {(value) =>
                  value
                    ? `${PLAN_LABEL[value as BillablePlanId]} — $${subscriptionPlans[value as BillablePlanId].monthlyRate}/mo`
                    : ""
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Plan</SelectLabel>
                <SelectItem value="presence">
                  Presence — ${subscriptionPlans.presence.monthlyRate}/mo
                </SelectItem>
                <SelectItem value="growth">
                  Growth — ${subscriptionPlans.growth.monthlyRate}/mo
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button
            onClick={handleGenerate}
            disabled={isPending}
            className="w-full gap-2 @xs/plan-picker:w-auto"
          >
            {isPending ? (
              <>
                <Spinner />
                Generating…
              </>
            ) : (
              <>
                <ArrowUpRight aria-hidden />
                {generateLabel}
              </>
            )}
          </Button>
        </div>
      </div>

      {checkoutUrl ? (
        <div className="flex items-center gap-2 border border-border bg-muted/40 px-3 py-2">
          <Check
            aria-hidden
            className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
          />
          <span className="flex-1 truncate text-xs text-muted-foreground">
            Link ready
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={handleCopy}
          >
            <Copy aria-hidden /> Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            nativeButton={false}
            render={
              <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" />
            }
          >
            <ExternalLink aria-hidden /> Open
          </Button>
        </div>
      ) : null}
    </div>
  )
}
