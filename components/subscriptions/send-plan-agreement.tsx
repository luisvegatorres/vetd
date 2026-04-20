"use client"

import { FileText } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

export function SendPlanAgreement() {
  return (
    <Button
      type="button"
      variant="outline"
      className="gap-2"
      onClick={() =>
        toast.info("Plan agreement sending is coming soon", {
          description:
            "Wire up a contract service (PandaDoc / DocuSign / Stripe e-sig) to enable this.",
        })
      }
    >
      <FileText aria-hidden />
      Send plan agreement
    </Button>
  )
}
