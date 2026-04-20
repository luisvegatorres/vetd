"use client"

import { Copy, Send } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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

export function SendSubscriptionLink({ clientId }: { clientId: string }) {
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
    <div className="flex flex-col gap-3 border-t border-border pt-4">
      <p className="text-overline font-medium uppercase text-muted-foreground">
        Send checkout link
      </p>

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Select
          value={planId}
          onValueChange={(value) => setPlanId(value as BillablePlanId)}
        >
          <SelectTrigger>
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
          <Send aria-hidden />
          {isPending ? "Generating…" : "Generate"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        ${plan.signingBonus} signing bonus + ${plan.monthlyResidual}/mo residual
        on this sale.
      </p>

      {checkoutUrl ? (
        <div className="flex flex-col gap-2 border border-border bg-muted/40 p-3">
          <p className="break-all font-mono text-xs text-muted-foreground">
            {checkoutUrl}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 self-start"
            onClick={handleCopy}
          >
            <Copy aria-hidden /> Copy link
          </Button>
        </div>
      ) : null}
    </div>
  )
}
