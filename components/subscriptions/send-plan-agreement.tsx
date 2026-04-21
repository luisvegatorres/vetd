"use client"

import { FileText } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function SendPlanAgreement({ className }: { className?: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn("gap-2", className)}
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
