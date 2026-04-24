"use client"

import * as React from "react"
import { Download, Mail } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ConfirmSendDialog } from "@/components/projects/confirm-send-dialog"
import {
  getDownloadUrlAction,
  sendDocumentAction,
} from "@/app/(protected)/documents/actions"
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
  clientEmail,
  trigger,
}: {
  doc: ProjectDocument
  /** Required to email; if absent, Send is still shown but surfaces a clear error on click. */
  clientEmail?: string | null
  trigger: React.ReactElement
}) {
  const [downloading, startDownload] = React.useTransition()

  function handleDownload() {
    if (!doc.has_pdf) {
      toast.info("This document has no PDF yet")
      return
    }
    startDownload(async () => {
      const res = await getDownloadUrlAction(doc.id)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      window.open(res.url, "_blank")
    })
  }

  const kindLabel = DOC_KIND_LABEL[doc.kind]
  const alreadySent = doc.status === "sent"

  return (
    <Popover>
      <PopoverTrigger render={trigger} />
      <PopoverContent align="end" className="w-56 gap-1 p-1">
        <Button
          variant="ghost"
          size="sm"
          className="justify-start gap-2 capitalize"
          onClick={handleDownload}
          disabled={downloading}
        >
          <Download aria-hidden /> Download PDF
        </Button>
        {clientEmail && doc.has_pdf ? (
          <ConfirmSendDialog
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="justify-start gap-2 capitalize"
                disabled={alreadySent}
                title={
                  alreadySent
                    ? "Already sent. Regenerate the document to send again."
                    : undefined
                }
              >
                <Mail aria-hidden />
                {alreadySent ? "Already sent" : "Send to client"}
              </Button>
            }
            title={`Send ${kindLabel.toLowerCase()} to client?`}
            description={`Attaches "${doc.title}" as a PDF.`}
            recipientEmail={clientEmail}
            confirmLabel={`Send ${kindLabel.toLowerCase()}`}
            onSend={async (message) => {
              const result = await sendDocumentAction({
                documentId: doc.id,
                message,
              })
              if (!result.ok) {
                return {
                  ok: false,
                  error: result.error,
                  ...(result.code ? { code: result.code } : {}),
                }
              }
              return {
                ok: true,
                toast: {
                  title: `${kindLabel} sent`,
                  description: `Emailed to ${clientEmail}.`,
                },
              }
            }}
          />
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-2 capitalize"
            disabled
            title={
              !doc.has_pdf
                ? "No PDF generated yet"
                : "Add a client email to enable sending"
            }
          >
            <Mail aria-hidden /> Send to client
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}
