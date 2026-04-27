"use client"

import { PostBody } from "@/components/blog/post-body"

/**
 * Live preview wrapper used by the editor. PostBody itself is server-neutral
 * (no async, no server-only imports), so it renders fine inside this client
 * tree. Empty-state matches the public reading experience to set expectations.
 */
export function MarkdownPreview({ markdown }: { markdown: string }) {
  if (!markdown.trim()) {
    return (
      <p className="text-sm italic text-muted-foreground">
        Nothing to preview yet. Start writing in the editor on the left.
      </p>
    )
  }
  return <PostBody markdown={markdown} />
}
