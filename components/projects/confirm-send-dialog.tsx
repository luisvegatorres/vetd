"use client"

import * as React from "react"
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
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"

type SendResult =
  | { ok: true; toast: { title: string; description?: string } }
  | {
      ok: false
      error: string
      code?: "scope_missing" | "auth_expired"
    }

export function ConfirmSendDialog({
  trigger,
  title,
  description,
  recipientEmail,
  confirmLabel,
  onSend,
}: {
  trigger: React.ReactElement
  title: string
  description?: string
  recipientEmail: string
  confirmLabel: string
  onSend: (message: string | null) => Promise<SendResult>
}) {
  const [open, setOpen] = React.useState(false)
  const [message, setMessage] = React.useState("")
  const [pending, startTransition] = React.useTransition()

  function handleSend() {
    startTransition(async () => {
      const trimmed = message.trim()
      const result = await onSend(trimmed ? trimmed : null)
      if (result.ok) {
        toast.success(result.toast.title, {
          description: result.toast.description,
        })
        setMessage("")
        setOpen(false)
        return
      }
      if (result.code === "scope_missing") {
        toast.error("Reconnect Google to send", {
          description: result.error,
          action: {
            label: "Reconnect",
            onClick: () => {
              window.location.href = "/api/google/oauth/start"
            },
          },
        })
        return
      }
      toast.error(result.error)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description ? `${description} ` : null}
            Sending to <span className="font-medium">{recipientEmail}</span>{" "}
            from your connected Gmail. Replies will land in your inbox.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="confirm-send-message" className="text-xs uppercase">
            Personal note (optional)
          </Label>
          <Textarea
            id="confirm-send-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a short note to include above the document."
            rows={3}
            disabled={pending}
          />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button onClick={handleSend} disabled={pending} className="gap-2">
            {pending ? (
              <>
                <Spinner />
                Sending…
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
