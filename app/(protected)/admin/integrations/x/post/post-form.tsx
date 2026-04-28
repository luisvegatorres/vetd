"use client"

import { ExternalLink, ImagePlus, Send, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const TEXT_MAX = 280
const FILE_MAX_BYTES = 4 * 1024 * 1024
const ACCEPT = "image/jpeg,image/png,image/webp"

type Status =
  | { kind: "idle" }
  | { kind: "publishing" }
  | { kind: "success"; postUrl: string; postId: string }
  | { kind: "error"; message: string }

export function XPostComposer({ username }: { username: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const previewUrlRef = useRef<string | null>(null)
  const [text, setText] = useState("")
  const [status, setStatus] = useState<Status>({ kind: "idle" })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  function handleFile(picked: File | null | undefined) {
    setStatus({ kind: "idle" })
    if (!picked) {
      clearFile()
      return
    }
    if (picked.size > FILE_MAX_BYTES) {
      toast.error(
        `Image is ${(picked.size / 1024 / 1024).toFixed(1)}MB. Max is 4MB.`
      )
      return
    }
    if (!ACCEPT.split(",").includes(picked.type)) {
      toast.error("Use JPEG, PNG, or WebP.")
      return
    }
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    const url = URL.createObjectURL(picked)
    previewUrlRef.current = url
    setPreviewUrl(url)
    setFile(picked)
  }

  function clearFile() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
    setFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) {
      toast.error("Write the post text first.")
      return
    }
    if ([...trimmed].length > TEXT_MAX) {
      toast.error(`Post is too long (${[...trimmed].length}/${TEXT_MAX}).`)
      return
    }

    setStatus({ kind: "publishing" })

    const body = new FormData()
    body.append("text", trimmed)
    if (file) body.append("image", file)

    try {
      const res = await fetch("/api/x/post", {
        method: "POST",
        body,
      })
      const json = (await res.json()) as
        | { ok: true; postUrl: string; postId: string; text: string }
        | { ok: false; error: string }

      if (!json.ok) {
        setStatus({ kind: "error", message: json.error })
        toast.error(json.error)
        return
      }

      setStatus({
        kind: "success",
        postUrl: json.postUrl,
        postId: json.postId,
      })
      toast.success(username ? `Posted to @${username}` : "Posted to X")
      setText("")
      clearFile()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error"
      setStatus({ kind: "error", message })
      toast.error(message)
    }
  }

  const publishing = status.kind === "publishing"
  const count = [...text.trim()].length

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 md:grid-cols-[minmax(0,1fr)_360px]"
    >
      <div className="space-y-4">
        <div>
          <Label
            htmlFor="x-post-text"
            className="text-xs text-muted-foreground uppercase"
          >
            Post
          </Label>
          <Textarea
            id="x-post-text"
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setStatus({ kind: "idle" })
            }}
            placeholder="Write something..."
            rows={8}
            maxLength={TEXT_MAX}
            disabled={publishing}
            className="mt-2"
          />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>Links and some characters may count differently on X</span>
            <span className={cn(count > TEXT_MAX - 20 && "text-destructive")}>
              {count}/{TEXT_MAX}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="submit"
            disabled={publishing || !text.trim()}
            className="gap-2"
          >
            <Send aria-hidden />
            {publishing ? "Publishing..." : "Publish to X"}
          </Button>
          {status.kind === "success" ? (
            <a
              href={status.postUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="size-3" aria-hidden />
              View on X
            </a>
          ) : null}
        </div>

        {status.kind === "error" ? (
          <p className="text-sm text-destructive">{status.message}</p>
        ) : null}
        {status.kind === "success" ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            Posted. Post ID:{" "}
            <code className="font-mono text-xs">{status.postId}</code>
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase">Image</Label>
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
              className="absolute top-2 right-2 gap-1"
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
            htmlFor="x-image"
            className={cn(
              "flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-border bg-muted/20 text-sm text-muted-foreground transition-colors hover:bg-muted/40",
              publishing && "pointer-events-none opacity-60"
            )}
          >
            <ImagePlus aria-hidden />
            <span>Click to choose an image</span>
            <span className="text-xs">JPEG, PNG, or WebP. Up to 4MB.</span>
          </label>
        )}
        <input
          ref={fileInputRef}
          id="x-image"
          type="file"
          accept={ACCEPT}
          onChange={(e) => handleFile(e.target.files?.[0])}
          disabled={publishing}
          className="hidden"
        />
        <p className="text-xs text-muted-foreground">
          Image upload happens before the post is created. If upload fails, no
          post is published.
        </p>
      </div>
    </form>
  )
}
