"use client"

import { ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { promoteProspect } from "@/app/(protected)/leads/actions"

export function PromoteProspectButton({ clientId }: { clientId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handlePromote() {
    startTransition(async () => {
      const result = await promoteProspect(clientId)
      if (result.ok) {
        toast.success("Promoted to lead")
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Button
      onClick={handlePromote}
      disabled={pending}
      className="gap-2 capitalize"
    >
      {pending ? "Promoting…" : "Promote to lead"}
      <ArrowRight aria-hidden />
    </Button>
  )
}
