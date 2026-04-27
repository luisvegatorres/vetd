import { ArrowUpRight } from "lucide-react"

import { Link } from "@/i18n/navigation"
import type { BlogPostListItem } from "@/lib/blog/queries"
import { cn } from "@/lib/utils"

type PostRecentListProps = {
  heading: string
  posts: BlogPostListItem[]
  className?: string
}

export function PostRecentList({
  heading,
  posts,
  className,
}: PostRecentListProps) {
  if (posts.length === 0) return null

  return (
    <aside className={cn("border border-border bg-card", className)}>
      <h2 className="border-b border-border px-6 py-5 font-heading text-base text-foreground uppercase tracking-wide">
        {heading}
      </h2>
      <ul>
        {posts.map((post) => (
          <li key={post.id} className="border-b border-border last:border-b-0">
            <Link
              href={`/blog/${post.slug}`}
              className="group/recent flex items-start gap-3 px-6 py-5 transition-colors hover:bg-muted/40"
            >
              <span className="flex-1 font-heading text-sm leading-snug text-foreground capitalize">
                {post.title}
              </span>
              <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-colors group-hover/recent:text-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  )
}
