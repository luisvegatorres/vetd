"use client"

import { CreditCard } from "lucide-react"
import { useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { createProjectDepositCheckoutSession } from "@/lib/stripe/actions"

export function SendDepositLink({
  projectId,
  variant = "default",
  className,
}: {
  projectId: string
  variant?: React.ComponentProps<typeof Button>["variant"]
  className?: string
}) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const result = await createProjectDepositCheckoutSession({ projectId })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      try {
        await navigator.clipboard.writeText(result.url)
        toast.success("Deposit link copied", {
          description: "Paste it into your email or chat to the client.",
          action: {
            label: "Open",
            onClick: () =>
              window.open(result.url, "_blank", "noopener,noreferrer"),
          },
        })
      } catch {
        window.open(result.url, "_blank", "noopener,noreferrer")
        toast.success("Deposit link ready")
      }
    })
  }

  return (
    <Button
      type="button"
      variant={variant}
      onClick={handleClick}
      disabled={isPending}
      className={cn("gap-2", className)}
    >
      {isPending ? (
        <>
          <Spinner />
          Generating…
        </>
      ) : (
        <>
          <CreditCard aria-hidden />
          Send deposit link
        </>
      )}
    </Button>
  )
}
