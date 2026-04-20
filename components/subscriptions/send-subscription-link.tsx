"use client"

import { ArrowUpRight, Check, Copy, ExternalLink } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dot } from "@/components/ui/dot"
import { Spinner } from "@/components/ui/spinner"
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
import {
  subscriptionPlans,
  type BillablePlanId,
} from "@/lib/site"

const PLAN_LABEL: Record<BillablePlanId, string> = {
  presence: subscriptionPlans.presence.label,
  growth: subscriptionPlans.growth.label,
}

export function SendSubscriptionLink({
  clientId,
  subscriptionId,
}: {
  clientId: string
  subscriptionId?: string
}) {
  const [planId, setPlanId] = useState<BillablePlanId>("presence")
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const plan = subscriptionPlans[planId]

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
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Select
            value={planId}
            onValueChange={(value) => setPlanId(value as BillablePlanId)}
          >
            <SelectTrigger className="flex-1">
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
            className="gap-2"
          >
            {isPending ? (
              <>
                <Spinner />
                Generating…
              </>
            ) : (
              <>
                <ArrowUpRight aria-hidden />
                Generate link
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground tabular-nums">
          ${plan.signingBonus} bonus
          <Dot className="mx-2" />${plan.monthlyResidual}/mo residual
        </p>
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
              <a
                href={checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <ExternalLink aria-hidden /> Open
          </Button>
        </div>
      ) : null}
    </div>
  )
}
