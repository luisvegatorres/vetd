"use client"

import { useTransition } from "react"
import { Download, MailCheck, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

import {
  getDownloadUrlAction,
  updateDocumentStatus,
} from "@/app/(protected)/documents/actions"
import { Button } from "@/components/ui/button"

export function DocumentActions({
  documentId,
  status,
  hasPdf,
}: {
  documentId: string
  status: string
  hasPdf: boolean
}) {
  const [pending, startTransition] = useTransition()

  function handleDownload() {
    startTransition(async () => {
      const res = await getDownloadUrlAction(documentId)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      window.open(res.url, "_blank")
    })
  }

  function handleMarkSent() {
    startTransition(async () => {
      const res = await updateDocumentStatus(documentId, "sent")
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Marked as sent")
    })
  }

  function handleMarkSigned() {
    startTransition(async () => {
      const res = await updateDocumentStatus(documentId, "signed")
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Marked as signed")
    })
  }

  return (
    <div className="flex items-center gap-2">
      {hasPdf ? (
        <Button
          variant="outline"
          onClick={handleDownload}
          disabled={pending}
        >
          <Download aria-hidden className="size-4" />
          Download PDF
        </Button>
      ) : null}
      {status === "draft" ? (
        <Button
          variant="outline"
          onClick={handleMarkSent}
          disabled={pending}
        >
          <MailCheck aria-hidden className="size-4" />
          Mark sent
        </Button>
      ) : null}
      {status !== "signed" && status !== "void" ? (
        <Button
          variant="outline"
          onClick={handleMarkSigned}
          disabled={pending}
        >
          <CheckCircle2 aria-hidden className="size-4" />
          Mark signed
        </Button>
      ) : null}
    </div>
  )
}
