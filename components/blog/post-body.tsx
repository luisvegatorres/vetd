import ReactMarkdown from "react-markdown"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import rehypeSanitize from "rehype-sanitize"
import rehypeSlug from "rehype-slug"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"

type PostBodyProps = {
  markdown: string
  className?: string
}

/**
 * Renders blog post markdown using the @tailwindcss/typography plugin with
 * the project's `prose-blog` overrides (defined in app/globals.css). Headings
 * get auto-slugged anchors via rehype-slug + rehype-autolink-headings, so the
 * URL fragment matches whatever a TOC links to. rehype-sanitize strips any
 * HTML the author embeds in markdown (defense in depth even though authors
 * are admin/editor only).
 */
export function PostBody({ markdown, className }: PostBodyProps) {
  const cleaned = markdown.replace(/^\s*-{3,}\s*\n+/, "")
  return (
    <div className={cn("prose prose-blog max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSanitize,
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
        ]}
      >
        {cleaned}
      </ReactMarkdown>
    </div>
  )
}
