"use client"

import {
  ExternalLink,
  ImagePlus,
  Save,
  Send,
  Trash2,
  Wand2,
} from "lucide-react"
import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
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
  discardDraft,
  publishDraft,
  regenerateDraftCaption,
  updateDraftCaption,
} from "../actions"

const CAPTION_MAX = 2200
const FILE_MAX_BYTES = 4 * 1024 * 1024
const ACCEPT = "image/jpeg,image/png,image/webp"

export type DraftRow = {
  id: string
  topic: string | null
  caption: string
  imagePrompt: string | null
  imageUrl: string | null
  status: "draft" | "published" | "discarded"
  publishedPermalink: string | null
  publishedAt: string | null
  createdAt: string
}

const fmtDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
})

export function DraftCard({
  draft,
  canPublish,
}: {
  draft: DraftRow
  canPublish: boolean
}) {
  const router = useRouter()
  const [caption, setCaption] = useState(draft.caption)
  const [savingCaption, startSavingCaption] = useTransition()
  const [regenCaption, startRegenCaption] = useTransition()
  const [publishing, startPublishing] = useTransition()
  const [discarding, startDiscarding] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const captionChanged = caption !== draft.caption
  const isPublished = draft.status === "published"
  const hasImage = draft.imageUrl !== null
  const busy =
    savingCaption ||
    regenCaption ||
    publishing ||
    discarding ||
    uploading

  function handleSaveCaption() {
    startSavingCaption(async () => {
      const result = await updateDraftCaption(draft.id, caption)
      if (result.ok) toast.success("Caption saved")
      else toast.error(result.error)
    })
  }

  function handleRegenCaption() {
    startRegenCaption(async () => {
      const result = await regenerateDraftCaption(draft.id)
      if (result.ok) toast.success("Caption regenerated")
      else toast.error(result.error)
    })
  }

  function openFilePicker() {
    fileInputRef.current?.click()
  }

  async function handleFile(picked: File | null | undefined) {
    if (!picked) return
    if (picked.size > FILE_MAX_BYTES) {
      toast.error(
        `Image is ${(picked.size / 1024 / 1024).toFixed(1)}MB. Max is 4MB.`,
      )
      return
    }
    if (!ACCEPT.split(",").includes(picked.type)) {
      toast.error("Use JPEG, PNG, or WebP.")
      return
    }

    setUploading(true)
    try {
      const body = new FormData()
      body.append("image", picked)
      const res = await fetch(`/api/instagram/drafts/${draft.id}/image`, {
        method: "POST",
        body,
      })
      const json = (await res.json()) as
        | { ok: true; imagePath: string; imageUrl: string }
        | { ok: false; error: string }
      if (!json.ok) {
        toast.error(json.error)
        return
      }
      toast.success("Image attached")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  function confirmPublish() {
    setPublishOpen(false)
    startPublishing(async () => {
      const result = await publishDraft(draft.id)
      if (result.ok) toast.success("Posted to Instagram")
      else toast.error(result.error)
    })
  }

  function confirmDiscard() {
    setDiscardOpen(false)
    startDiscarding(async () => {
      const result = await discardDraft(draft.id)
      if (result.ok) toast.success("Draft discarded")
      else toast.error(result.error)
    })
  }

  return (
    <article className="flex flex-col border border-border/60">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted/30">
        {draft.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={draft.imageUrl}
            alt={draft.topic ?? "Draft image"}
            className="h-full w-full object-cover"
          />
        ) : (
          <button
            type="button"
            onClick={openFilePicker}
            disabled={isPublished || busy}
            className={cn(
              "flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-border bg-muted/20 text-sm text-muted-foreground transition-colors hover:bg-muted/40",
              (isPublished || busy) && "pointer-events-none opacity-60",
            )}
          >
            <ImagePlus aria-hidden />
            <span>{uploading ? "Uploading..." : "Click to choose an image"}</span>
            <span className="text-xs">JPEG, PNG, or WebP. Up to 4MB.</span>
          </button>
        )}
        <div className="absolute right-2 top-2 flex items-center gap-1">
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
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        onChange={(e) => handleFile(e.target.files?.[0])}
        disabled={busy}
        className="hidden"
      />

      <div className="flex flex-1 flex-col gap-3 p-4">
        {draft.topic ? (
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {draft.topic}
          </p>
        ) : null}

        {draft.imagePrompt && !isPublished ? (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer uppercase tracking-wide hover:text-foreground">
              Suggested image
            </summary>
            <p className="mt-2 whitespace-pre-wrap leading-relaxed">
              {draft.imagePrompt}
            </p>
          </details>
        ) : null}

        {isPublished ? (
          <p className="whitespace-pre-wrap text-sm">{draft.caption}</p>
        ) : (
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={6}
            maxLength={CAPTION_MAX}
            disabled={busy}
            className="text-sm"
          />
        )}

        {!isPublished ? (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{captionChanged ? "Unsaved changes" : "Saved"}</span>
            <span
              className={cn(
                caption.length > CAPTION_MAX - 100 && "text-destructive",
              )}
            >
              {caption.length}/{CAPTION_MAX}
            </span>
          </div>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          {isPublished ? (
            <>
              {draft.publishedPermalink ? (
                <a
                  href={draft.publishedPermalink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="size-3" aria-hidden />
                  View on Instagram
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
                disabled={!canPublish || !hasImage || busy}
                className="gap-1"
              >
                <Send aria-hidden />
                {publishing ? "Publishing..." : "Publish"}
              </Button>
              {captionChanged ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSaveCaption}
                  disabled={busy}
                  className="gap-1"
                >
                  <Save aria-hidden />
                  Save
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="outline"
                onClick={handleRegenCaption}
                disabled={busy}
                className="gap-1"
              >
                <Wand2 aria-hidden />
                {regenCaption ? "..." : "New caption"}
              </Button>
              {hasImage ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openFilePicker}
                  disabled={busy}
                  className="gap-1"
                >
                  <ImagePlus aria-hidden />
                  {uploading ? "..." : "Replace image"}
                </Button>
              ) : null}
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
      </div>

      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Publish to Instagram</DialogTitle>
            <DialogDescription>
              This draft will go live on Instagram immediately. You cannot
              edit the caption or image after publishing.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPublishOpen(false)}
            >
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
              The caption {hasImage ? "and image " : ""}will be deleted. This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDiscardOpen(false)}
            >
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
