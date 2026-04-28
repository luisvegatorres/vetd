"use client"

import { ExternalLink, Save, Send, Trash2, Wand2 } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  discardXDraft,
  publishXDraft,
  regenerateXDraftText,
  updateXDraftText,
} from "../actions"

const TEXT_MAX = 280

export type XDraftRow = {
  id: string
  topic: string | null
  text: string
  status: "draft" | "published" | "discarded"
  publishedPostId: string | null
  publishedUrl: string | null
  publishedAt: string | null
  createdAt: string
}

const fmtDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
})

export function XDraftCard({
  draft,
  canPublish,
}: {
  draft: XDraftRow
  canPublish: boolean
}) {
  const [text, setText] = useState(draft.text)
  const [savingText, startSavingText] = useTransition()
  const [regenText, startRegenText] = useTransition()
  const [publishing, startPublishing] = useTransition()
  const [discarding, startDiscarding] = useTransition()
  const [publishOpen, setPublishOpen] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)

  // X's character counter is grapheme-based, not UTF-16 length-based.
  const charCount = [...text].length
  const textChanged = text !== draft.text
  const isPublished = draft.status === "published"
  const busy = savingText || regenText || publishing || discarding

  function handleSave() {
    startSavingText(async () => {
      const result = await updateXDraftText(draft.id, text)
      if (result.ok) toast.success("Saved")
      else toast.error(result.error)
    })
  }

  function handleRegen() {
    startRegenText(async () => {
      const result = await regenerateXDraftText(draft.id)
      if (result.ok) toast.success("Rewritten")
      else toast.error(result.error)
    })
  }

  function confirmPublish() {
    setPublishOpen(false)
    startPublishing(async () => {
      const result = await publishXDraft(draft.id)
      if (result.ok) toast.success("Posted to X")
      else toast.error(result.error)
    })
  }

  function confirmDiscard() {
    setDiscardOpen(false)
    startDiscarding(async () => {
      const result = await discardXDraft(draft.id)
      if (result.ok) toast.success("Draft discarded")
      else toast.error(result.error)
    })
  }

  return (
    <article className="flex flex-col border border-border/60 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        {draft.topic ? (
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {draft.topic}
          </p>
        ) : (
          <span />
        )}
        {isPublished ? (
          <Badge
            variant="outline"
            className="border-transparent bg-emerald-500/15 uppercase text-emerald-700 dark:text-emerald-300"
          >
            Published
          </Badge>
        ) : draft.status === "discarded" ? (
          <Badge variant="outline" className="uppercase">
            Discarded
          </Badge>
        ) : (
          <Badge variant="outline" className="uppercase">
            Draft
          </Badge>
        )}
      </div>

      {isPublished ? (
        <p className="whitespace-pre-wrap text-sm">{draft.text}</p>
      ) : (
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          maxLength={TEXT_MAX * 2 /* let user type past, we trim on save */}
          disabled={busy}
          className="text-sm"
        />
      )}

      {!isPublished ? (
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{textChanged ? "Unsaved changes" : "Saved"}</span>
          <span
            className={cn(
              charCount > TEXT_MAX
                ? "text-destructive"
                : charCount > TEXT_MAX - 30 && "text-amber-500",
            )}
          >
            {charCount}/{TEXT_MAX}
          </span>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {isPublished ? (
          <>
            {draft.publishedUrl ? (
              <a
                href={draft.publishedUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="size-3" aria-hidden />
                View on X
              </a>
            ) : null}
            <span className="ml-auto text-xs text-muted-foreground">
              {draft.publishedAt
                ? fmtDate.format(new Date(draft.publishedAt))
                : ""}
            </span>
          </>
        ) : (
          <>
            <Button
              size="sm"
              onClick={() => setPublishOpen(true)}
              disabled={!canPublish || busy || charCount === 0 || charCount > TEXT_MAX}
              className="gap-1"
            >
              <Send aria-hidden />
              {publishing ? "Publishing..." : "Publish"}
            </Button>
            {textChanged ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSave}
                disabled={busy || charCount > TEXT_MAX}
                className="gap-1"
              >
                <Save aria-hidden />
                Save
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              onClick={handleRegen}
              disabled={busy}
              className="gap-1"
            >
              <Wand2 aria-hidden />
              {regenText ? "..." : "Rewrite"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDiscardOpen(true)}
              disabled={busy}
              className="ml-auto gap-1"
            >
              <Trash2 aria-hidden />
              Discard
            </Button>
          </>
        )}
      </div>

      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Post to X</DialogTitle>
            <DialogDescription>
              This draft will publish to X immediately. You cannot edit the
              post after publishing.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmPublish} className="gap-1">
              <Send aria-hidden />
              Publish now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Discard draft</DialogTitle>
            <DialogDescription>
              The draft will be deleted. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscardOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDiscard}
              className="gap-1"
            >
              <Trash2 aria-hidden />
              Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  )
}
