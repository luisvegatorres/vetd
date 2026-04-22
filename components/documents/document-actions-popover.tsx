"use client"

import { Download, Mail } from "lucide-react"
import { useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { getDownloadUrlAction } from "@/app/(protected)/documents/actions"
import type { ProjectDocument } from "@/components/projects/project-types"

export const DOC_KIND_LABEL: Record<ProjectDocument["kind"], string> = {
  proposal: "Proposal",
  contract: "Services Agreement",
  sow: "SOW",
  nda: "NDA",
  invoice_terms: "Invoice terms",
}

export function DocumentActionsPopover({
  doc,
  trigger,
}: {
  doc: ProjectDocument
  trigger: React.ReactElement
}) {
  const [pending, startTransition] = useTransition()

  function handleDownload() {
    if (!doc.has_pdf) {
      toast.info("This document has no PDF yet")
      return
    }
    startTransition(async () => {
      const res = await getDownloadUrlAction(doc.id)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      window.open(res.url, "_blank")
    })
  }

  return (
    <Popover>
      <PopoverTrigger render={trigger} />
      <PopoverContent align="end" className="w-56 gap-1 p-1">
        <Button
          variant="ghost"
          size="sm"
          className="justify-start gap-2 capitalize"
          onClick={handleDownload}
          disabled={pending}
        >
          <Download aria-hidden /> Download PDF
        </Button>
        {/* TODO: wire up Resend to email this document to the client */}
        <Button
          variant="ghost"
          size="sm"
          className="justify-start gap-2 capitalize"
          onClick={() =>
            toast.info("Emailing documents is coming soon", {
              description: "Wire up Resend to enable this.",
            })
          }
        >
          <Mail aria-hidden /> Send to client
        </Button>
      </PopoverContent>
    </Popover>
  )
}
