"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { ArrowUpRight } from "lucide-react"

import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import type { BlogPostListItem } from "@/lib/blog/queries"
import { cn } from "@/lib/utils"

type BlogIndexGridProps = {
  posts: BlogPostListItem[]
  tags: string[]
  locale: string
}

/**
 * Client-side faceted filter over a small post set. Tag pills toggle a single
 * active filter (multi-tag intersection isn't worth the SEO complexity yet —
 * see plan §2). All posts are server-fetched once; no extra round trips.
 */
export function BlogIndexGrid({ posts, tags, locale }: BlogIndexGridProps) {
  const [activeTag, setActiveTag] = React.useState<string | null>(null)
  const t = useTranslations("blog")

  const visible = activeTag
    ? posts.filter((post) => post.tags.includes(activeTag))
    : posts

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  return (
    <div className="space-y-10">
      {tags.length > 0 ? (
        <Reveal y={16}>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => setActiveTag(null)}
              variant={activeTag === null ? "default" : "outline"}
              className={cn(
                activeTag !== null &&
                  "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {t("filterAll")}
            </Button>
            {tags.map((tag) => {
              const isActive = activeTag === tag
              return (
                <Button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTag(isActive ? null : tag)}
                  variant={isActive ? "default" : "outline"}
                  className={cn(
                    !isActive &&
                      "bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tag}
                </Button>
              )
            })}
          </div>
        </Reveal>
      ) : null}

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <RevealGroup
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          delayChildren={0.08}
          stagger={0.06}
        >
          {visible.map((post) => {
            const meta = `${dateFormatter.format(new Date(post.published_at))} · ${t(
              "readingTime",
              { minutes: post.reading_time_minutes },
            )}`
            const initials = post.title
              .split(" ")
              .filter(Boolean)
              .slice(0, 3)
              .map((word) => word[0])
              .join("")
            return (
              <RevealItem key={post.id} y={22}>
                <Link href={`/blog/${post.slug}`} className="block h-full">
                  <Card className="group/post h-full gap-0 rounded-none bg-card p-0 ring-1 ring-border transition-colors hover:ring-foreground/40">
                    <div className="relative aspect-[4/3] overflow-hidden border-b border-border bg-muted">
                      {post.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.cover_image_url}
                          alt=""
                          className="absolute inset-0 size-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <>
                          <div
                            aria-hidden
                            className="absolute inset-0 opacity-[0.12]"
                            style={{
                              backgroundImage:
                                "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
                              backgroundSize: "2rem 2rem",
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="font-heading text-6xl leading-none text-muted-foreground/40 uppercase sm:text-7xl">
                              {initials}
                            </span>
                          </div>
                        </>
                      )}
                      {post.tags[0] ? (
                        <div className="absolute top-4 left-4">
                          <span className="inline-flex items-center bg-background/80 px-2 py-1 text-xs font-medium text-muted-foreground uppercase backdrop-blur-sm">
                            {post.tags[0]}
                          </span>
                        </div>
                      ) : null}
                      <ArrowUpRight className="absolute top-4 right-4 size-5 text-muted-foreground transition-colors group-hover/post:text-foreground" />
                    </div>
                    <CardContent className="space-y-3 px-6 py-6">
                      <p className="text-xs font-medium text-muted-foreground uppercase">
                        {meta}
                      </p>
                      <h3 className="font-heading text-2xl leading-subheading text-foreground capitalize">
                        {post.title}
                      </h3>
                      {post.excerpt ? (
                        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                          {post.excerpt}
                        </p>
                      ) : null}
                    </CardContent>
                  </Card>
                </Link>
              </RevealItem>
            )
          })}
        </RevealGroup>
      )}
    </div>
  )
}
