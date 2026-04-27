import { ArrowUpRight } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import type { BlogPostListItem } from "@/lib/blog/queries"
import { cn } from "@/lib/utils"

type PostSimilarGridProps = {
  heading: string
  posts: BlogPostListItem[]
  className?: string
}

function postInitials(title: string) {
  return title
    .split(" ")
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => word[0])
    .join("")
}

export function PostSimilarGrid({
  heading,
  posts,
  className,
}: PostSimilarGridProps) {
  if (posts.length === 0) return null

  return (
    <div className={cn("space-y-8", className)}>
      <h2 className="font-heading text-3xl text-foreground capitalize sm:text-4xl">
        {heading}
      </h2>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={`/blog/${post.slug}`} className="block h-full">
              <Card className="group/post h-full gap-0 rounded-none bg-card p-0 ring-1 ring-border transition-colors hover:ring-foreground/40">
                <div className="relative aspect-4/3 overflow-hidden border-b border-border bg-muted">
                  {post.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.cover_image_url}
                      alt=""
                      className="absolute inset-0 size-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-heading text-6xl text-muted-foreground/40 uppercase">
                        {postInitials(post.title)}
                      </span>
                    </div>
                  )}
                  <ArrowUpRight className="absolute top-4 right-4 size-5 text-muted-foreground transition-colors group-hover/post:text-foreground" />
                </div>
                <CardContent className="px-6 pt-6 pb-8">
                  {post.tags[0] ? (
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {post.tags[0]}
                    </p>
                  ) : null}
                  <h3 className="mt-2 font-heading text-xl leading-subheading text-foreground capitalize">
                    {post.title}
                  </h3>
                  {post.excerpt ? (
                    <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {post.excerpt}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
