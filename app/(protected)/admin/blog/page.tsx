import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowUpRight, FileText, Plus, Sparkles } from "lucide-react"

import { GenerateNowButton } from "@/app/(protected)/admin/blog/_components/generate-now-button"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Dot } from "@/components/ui/dot"
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
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect("/auth/login?next=/admin/blog")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle()

  if (profile?.role !== "admin") redirect("/dashboard")

  // Admin RLS lets the blog owner read every row regardless of status. RLS for
  // anon/sales_rep silently filters to status='published', so enforce admin
  // before querying the management table.
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
          <p className="inline-flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
            <span>
              {rows.length} {rows.length === 1 ? "post" : "posts"}
            </span>
            <Dot />
            <span>Manage and publish bilingual content for /blog.</span>
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <GenerateNowButton />
          <Link
            href="/admin/blog/new"
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
              href="/admin/blog/new"
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
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Post</TableHead>
                <TableHead className="w-[12%]">Lang</TableHead>
                <TableHead className="w-[10%]">AI</TableHead>
                <TableHead className="w-[14%]">Status</TableHead>
                <TableHead className="w-[16%]">Date</TableHead>
                <TableHead aria-label="Actions" className="w-[8%]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const hasEs = Boolean(row.title_es && row.body_md_es)
                const isAuto =
                  row.meta != null &&
                  typeof row.meta === "object" &&
                  (row.meta as { auto?: boolean }).auto === true
                const dateValue =
                  (row.status === "published" || row.status === "scheduled") &&
                  row.published_at !== null
                    ? row.published_at
                    : row.updated_at
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link
                        href={`/admin/blog/${row.id}`}
                        className="block truncate font-medium text-foreground hover:underline"
                      >
                        {row.title_en}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-xs uppercase text-muted-foreground">
                        <span>EN</span>
                        <Dot />
                        <span
                          className={cn(
                            hasEs ? "" : "text-muted-foreground/40",
                          )}
                        >
                          ES
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>
                      {isAuto ? (
                        <span
                          title="Auto-generated by Gemini. Review before publishing."
                          className="inline-flex items-center gap-1 border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground"
                        >
                          <Sparkles className="size-2.5" />
                          AI
                        </span>
                      ) : null}
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
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(dateValue)}
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
