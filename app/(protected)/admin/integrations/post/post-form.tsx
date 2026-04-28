"use client"

import { ExternalLink, ImagePlus, Send, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const CAPTION_MAX = 2200
const FILE_MAX_BYTES = 4 * 1024 * 1024
const ACCEPT = "image/jpeg,image/png,image/webp"

type Status =
  | { kind: "idle" }
  | { kind: "publishing" }
  | { kind: "success"; permalink: string; mediaId: string }
  | { kind: "error"; message: string }

export function PostComposer({ username }: { username: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [status, setStatus] = useState<Status>({ kind: "idle" })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  function handleFile(picked: File | null | undefined) {
    setStatus({ kind: "idle" })
    if (!picked) {
      setFile(null)
      return
    }
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
    setFile(picked)
  }

  function clearFile() {
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      toast.error("Pick an image first.")
      return
    }
    if (caption.length > CAPTION_MAX) {
      toast.error(`Caption is too long (${caption.length}/${CAPTION_MAX}).`)
      return
    }

    setStatus({ kind: "publishing" })

    const body = new FormData()
    body.append("image", file)
    body.append("caption", caption)

    try {
      const res = await fetch("/api/instagram/post", {
        method: "POST",
        body,
      })
      const json = (await res.json()) as
        | { ok: true; permalink: string; mediaId: string }
        | { ok: false; error: string }

      if (!json.ok) {
        setStatus({ kind: "error", message: json.error })
        toast.error(json.error)
        return
      }

      setStatus({
        kind: "success",
        permalink: json.permalink,
        mediaId: json.mediaId,
      })
      toast.success(
        username ? `Posted to @${username}` : "Posted to Instagram",
      )
      // Reset the composer for the next post.
      setCaption("")
      clearFile()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error"
      setStatus({ kind: "error", message })
      toast.error(message)
    }
  }

  const publishing = status.kind === "publishing"

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 md:grid-cols-[minmax(0,1fr)_360px]"
    >
      <div className="space-y-4">
        <div>
          <Label
            htmlFor="caption"
            className="text-xs uppercase text-muted-foreground"
          >
            Caption
          </Label>
          <Textarea
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write something..."
            rows={10}
            maxLength={CAPTION_MAX}
            disabled={publishing}
            className="mt-2"
          />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>2200 char max, 30 hashtags, 20 mentions</span>
            <span
              className={cn(
                caption.length > CAPTION_MAX - 100 && "text-destructive",
              )}
            >
              {caption.length}/{CAPTION_MAX}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="submit"
            disabled={publishing || !file}
            className="gap-2"
          >
            <Send aria-hidden />
            {publishing ? "Publishing..." : "Publish to Instagram"}
          </Button>
          {status.kind === "success" && status.permalink ? (
            <a
              href={status.permalink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="size-3" aria-hidden />
              View on Instagram
            </a>
          ) : null}
        </div>

        {status.kind === "error" ? (
          <p className="text-sm text-destructive">{status.message}</p>
        ) : null}
        {status.kind === "success" ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            Posted. Media ID:{" "}
            <code className="font-mono text-xs">{status.mediaId}</code>
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase text-muted-foreground">
          Image
        </Label>
        {previewUrl ? (
          <div className="relative border border-border/60">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Selected"
              className="block aspect-square w-full object-cover"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearFile}
              disabled={publishing}
              className="absolute right-2 top-2 gap-1"
            >
              <X aria-hidden />
              Replace
            </Button>
            {file ? (
              <p className="border-t border-border/60 px-3 py-2 text-xs text-muted-foreground">
                {file.name} · {(file.size / 1024 / 1024).toFixed(2)}MB ·{" "}
                {file.type.replace("image/", "").toUpperCase()}
              </p>
            ) : null}
          </div>
        ) : (
          <label
            htmlFor="image"
            className={cn(
              "flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-border bg-muted/20 text-sm text-muted-foreground transition-colors hover:bg-muted/40",
              publishing && "pointer-events-none opacity-60",
            )}
          >
            <ImagePlus aria-hidden />
            <span>Click to choose an image</span>
            <span className="text-xs">JPEG, PNG, or WebP. Up to 4MB.</span>
          </label>
        )}
        <input
          ref={fileInputRef}
          id="image"
          type="file"
          accept={ACCEPT}
          onChange={(e) => handleFile(e.target.files?.[0])}
          disabled={publishing}
          className="hidden"
        />
        <p className="text-xs text-muted-foreground">
          Aspect ratio between 4:5 and 1.91:1. Outside that, Instagram will
          reject it.
        </p>
      </div>
    </form>
  )
}
