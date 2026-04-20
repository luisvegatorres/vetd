"use client"

import { X } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { cancelClientSubscription } from "@/lib/stripe/actions"

export function CancelSubscriptionButton({
  subscriptionId,
  plan,
  monthlyRate,
}: {
  subscriptionId: string
  plan: string
  monthlyRate: number
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelClientSubscription({ subscriptionId })
      if (result.ok) {
        toast.success("Subscription canceled")
        setOpen(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-destructive hover:text-destructive"
          >
            <X aria-hidden /> Cancel
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel subscription?</DialogTitle>
          <DialogDescription>
            This immediately ends the {plan} plan (${monthlyRate}/mo) in
            Stripe. No further invoices will be generated. Past residual
            commissions stay on the ledger; future residuals stop.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Keep subscription
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isPending}
            className="gap-2"
          >
            {isPending ? (
              <>
                <Spinner />
                Canceling…
              </>
            ) : (
              "Cancel subscription"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
