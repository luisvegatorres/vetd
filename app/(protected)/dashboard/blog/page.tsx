import Link from "next/link"
import { ArrowUpRight, FileText, Plus, Sparkles } from "lucide-react"

import { GenerateNowButton } from "@/app/(protected)/dashboard/blog/_components/generate-now-button"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

type AdminBlogRow = {
  id: string
  slug: string
  title_en: string
  title_es: string | null
  body_md_es: string | null
  status: string
  published_at: string | null
  updated_at: string
  tags: string[]
  meta: { auto?: boolean } | Record<string, unknown> | null
}

const statusTone: Record<string, string> = {
  published: "bg-foreground text-background",
  scheduled: "border-foreground/40 text-foreground",
  draft: "border-border text-muted-foreground",
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d)
}

export default async function BlogAdminPage() {
  const supabase = await createClient()

  // Staff RLS lets admin/editor read every row regardless of status. RLS for
  // anon/sales_rep would silently filter to status='published', but in this
  // route the layout already enforced an authenticated admin user.
  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      "id, slug, title_en, title_es, body_md_es, status, published_at, updated_at, tags, meta",
    )
    .order("updated_at", { ascending: false })

  if (error) throw error
  const rows = (data ?? []) as AdminBlogRow[]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="font-heading text-2xl uppercase">Blog</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} {rows.length === 1 ? "post" : "posts"} · Manage and
            publish bilingual content for /blog.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <GenerateNowButton />
          <Link
            href="/dashboard/blog/new"
            className={cn(
              buttonVariants({ variant: "default" }),
              "inline-flex items-center gap-2",
            )}
          >
            <Plus className="size-4" />
            New post
          </Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <Empty className="border border-border bg-card py-16">
          <EmptyHeader>
            <EmptyMedia>
              <FileText className="size-8 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>No posts yet</EmptyTitle>
            <EmptyDescription>
              Write your first blog post to start growing organic traffic.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link
              href="/dashboard/blog/new"
              className={cn(
                buttonVariants({ variant: "default" }),
                "inline-flex items-center gap-2",
              )}
            >
              <Plus className="size-4" />
              New post
            </Link>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Languages</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Published</TableHead>
                <TableHead aria-label="Actions" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const hasEs = Boolean(row.title_es && row.body_md_es)
                const isAuto =
                  row.meta != null &&
                  typeof row.meta === "object" &&
                  (row.meta as { auto?: boolean }).auto === true
                return (
                  <TableRow key={row.id}>
                    <TableCell className="max-w-xs">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/blog/${row.id}`}
                          className="block truncate font-medium text-foreground hover:underline"
                        >
                          {row.title_en}
                        </Link>
                        {isAuto ? (
                          <span
                            title="Auto-generated by Gemini. Review before publishing."
                            className="inline-flex items-center gap-1 border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground"
                          >
                            <Sparkles className="size-2.5" />
                            AI
                          </span>
                        ) : null}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        /{row.slug}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "uppercase",
                          statusTone[row.status] ?? statusTone.draft,
                        )}
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Badge
                          variant="outline"
                          className="uppercase border-foreground/40"
                        >
                          EN
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "uppercase",
                            hasEs
                              ? "border-foreground/40 text-foreground"
                              : "border-border text-muted-foreground/60",
                          )}
                        >
                          ES
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {row.tags.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          row.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center border border-border bg-card px-2 py-0.5 text-xs uppercase text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))
                        )}
                        {row.tags.length > 3 ? (
                          <span className="text-xs text-muted-foreground">
                            +{row.tags.length - 3}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(row.updated_at)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(row.published_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.status === "published" ? (
                        <a
                          href={`/blog/${row.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "sm" }),
                            "inline-flex items-center gap-1",
                          )}
                        >
                          View
                          <ArrowUpRight className="size-3.5" />
                        </a>
                      ) : null}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
