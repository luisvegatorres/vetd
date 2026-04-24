"use client"

import { FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { DOC_KIND_LABEL } from "@/components/documents/document-actions-popover"
import { sendDocumentAction } from "@/app/(protected)/documents/actions"
import type { ProjectDocument } from "./project-types"

import { ConfirmSendDialog } from "./confirm-send-dialog"

export function SendDocumentButton({
  doc,
  clientEmail,
  variant = "outline",
  className,
}: {
  doc: ProjectDocument
  clientEmail: string
  variant?: React.ComponentProps<typeof Button>["variant"]
  className?: string
}) {
  const kindLabel = DOC_KIND_LABEL[doc.kind]

  return (
    <ConfirmSendDialog
      trigger={
        <Button
          type="button"
          variant={variant}
          className={cn("gap-2", className)}
        >
          <FileText aria-hidden />
          Send {kindLabel}
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
  )
}
