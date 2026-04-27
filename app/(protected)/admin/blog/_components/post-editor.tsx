"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ArrowLeft, ChevronDownIcon, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  createPost,
  deletePost,
  updatePost,
} from "@/app/(protected)/admin/blog/actions"
import { AiAssistMenu } from "@/app/(protected)/admin/blog/_components/ai-assist-menu"
import { MarkdownEditor } from "@/app/(protected)/admin/blog/_components/markdown-editor"
import { MarkdownPreview } from "@/app/(protected)/admin/blog/_components/markdown-preview"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

type LocaleKey = "en" | "es"
type StatusKey = "draft" | "scheduled" | "published"

export type PostEditorInitial = {
  id: string | null
  slug: string
  title_en: string
  title_es: string
  excerpt_en: string
  excerpt_es: string
  body_md_en: string
  body_md_es: string
  cover_image_url: string
  tags: string[]
  status: StatusKey
  published_at: string | null
}

const EMPTY_INITIAL: PostEditorInitial = {
  id: null,
  slug: "",
  title_en: "",
  title_es: "",
  excerpt_en: "",
  excerpt_es: "",
  body_md_en: "",
  body_md_es: "",
  cover_image_url: "",
  tags: [],
  status: "draft",
  published_at: null,
}

/**
 * `datetime-local` requires a "yyyy-MM-ddTHH:mm" string with no timezone.
 * We slice the ISO string to that shape (UTC), which is good enough — the
 * server reinterprets the value via `new Date()` on save (see actions.ts
 * parsePublishedAt).
 */
function isoToLocalInput(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  // Trim seconds and the trailing Z to fit datetime-local's pattern.
  return d.toISOString().slice(0, 16)
}

function getDatePart(value: string): string {
  const idx = value.indexOf("T")
  return idx >= 0 ? value.slice(0, idx) : value
}

function getTimePart(value: string): string {
  const idx = value.indexOf("T")
  return idx >= 0 ? value.slice(idx + 1) : ""
}

function combineDateTime(date: string, time: string): string {
  if (!date) return ""
  return `${date}T${time || "00:00"}`
}

/** Parse YYYY-MM-DD without crossing into UTC (avoids off-by-one in negative-offset zones). */
function parseLocalDate(iso: string): Date | undefined {
  if (!iso) return undefined
  const [y, m, d] = iso.split("-").map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}

function toLocalDateString(date: Date | undefined): string {
  if (!date) return ""
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function PostEditor({
  initial,
  mode,
}: {
  initial?: PostEditorInitial
  mode: "create" | "edit"
}) {
  const start = initial ?? EMPTY_INITIAL
  const router = useRouter()

  const [activeLocale, setActiveLocale] = React.useState<LocaleKey>("en")
  const [titleEn, setTitleEn] = React.useState(start.title_en)
  const [titleEs, setTitleEs] = React.useState(start.title_es)
  const [excerptEn, setExcerptEn] = React.useState(start.excerpt_en)
  const [excerptEs, setExcerptEs] = React.useState(start.excerpt_es)
  const [bodyEn, setBodyEn] = React.useState(start.body_md_en)
  const [bodyEs, setBodyEs] = React.useState(start.body_md_es)
  const [slug, setSlug] = React.useState(start.slug)
  const [cover, setCover] = React.useState(start.cover_image_url)
  const [tags, setTags] = React.useState(start.tags.join(", "))
  const [status, setStatus] = React.useState<StatusKey>(start.status)
  const [publishedAt, setPublishedAt] = React.useState(
    isoToLocalInput(start.published_at),
  )
  const [pending, setPending] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [dateOpen, setDateOpen] = React.useState(false)

  const activeBody = activeLocale === "en" ? bodyEn : bodyEs
  const initialTags = start.tags.join(", ")
  const initialPublishedAt = isoToLocalInput(start.published_at)
  const hasUnsavedChanges =
    titleEn !== start.title_en ||
    titleEs !== start.title_es ||
    excerptEn !== start.excerpt_en ||
    excerptEs !== start.excerpt_es ||
    bodyEn !== start.body_md_en ||
    bodyEs !== start.body_md_es ||
    slug !== start.slug ||
    cover !== start.cover_image_url ||
    tags !== initialTags ||
    status !== start.status ||
    publishedAt !== initialPublishedAt
  const hasUnsavedStatus = status !== start.status

  /**
   * Auto-suggest a URL-safe slug as the user types the English title, but
   * only on create (so we never clobber a published URL that's already
   * indexed by Google) and only while the slug field is empty (so a manual
   * edit always wins). Done in the change handler instead of useEffect to
   * comply with React's no-setState-in-effect rule.
   */
  function handleTitleEnChange(value: string) {
    setTitleEn(value)
    if (mode === "create" && slug.length === 0 && value.trim().length > 0) {
      setSlug(titleToSlug(value))
    }
  }

  async function handleSave() {
    setPending(true)
    const fd = new FormData()
    fd.set("slug", slug)
    fd.set("title_en", titleEn)
    fd.set("title_es", titleEs)
    fd.set("excerpt_en", excerptEn)
    fd.set("excerpt_es", excerptEs)
    fd.set("body_md_en", bodyEn)
    fd.set("body_md_es", bodyEs)
    fd.set("cover_image_url", cover)
    fd.set("tags", tags)
    fd.set("status", status)
    fd.set("published_at", publishedAt)

    try {
      if (mode === "create") {
        const res = await createPost(fd)
        if (!res.ok) {
          toast.error(res.error)
          return
        }
        toast.success("Post created")
        router.push(`/admin/blog/${res.postId}`)
      } else {
        if (!initial?.id) return
        const res = await updatePost(initial.id, fd)
        if (!res.ok) {
          toast.error(res.error)
          return
        }
        toast.success("Post saved")
        router.refresh()
      }
    } finally {
      setPending(false)
    }
  }

  async function handleDelete() {
    if (!initial?.id) return
    setDeleting(true)
    try {
      const res = await deletePost(initial.id)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Post deleted")
      router.push("/admin/blog")
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/blog")}
            className="w-fit gap-2"
          >
            <ArrowLeft className="size-3.5" />
            All posts
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <AiAssistMenu
            activeLocale={activeLocale}
            getTitleEn={() => titleEn}
            getExcerptEn={() => excerptEn}
            getBodyEn={() => bodyEn}
            getActiveBody={() => activeBody}
            onSetBody={(loc, value) => {
              if (loc === "en") setBodyEn(value)
              else setBodyEs(value)
            }}
            onSetExcerpt={(loc, value) => {
              if (loc === "en") setExcerptEn(value)
              else setExcerptEs(value)
            }}
            onSetTitleEs={setTitleEs}
            onSetExcerptEs={setExcerptEs}
            onSetBodyEs={setBodyEs}
            onSetTags={(next) => setTags(next.join(", "))}
          />
          {mode === "edit" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={handleSave}
            disabled={pending}
            size="sm"
          >
            {pending
              ? "Saving…"
              : hasUnsavedChanges
                ? "Save changes"
                : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid min-w-0 gap-6 xl:max-2xl:grid-cols-2">
          <Card className="min-w-0">
            <CardContent className="space-y-4">
              <Tabs
                value={activeLocale}
                onValueChange={(v) =>
                  typeof v === "string" && setActiveLocale(v as LocaleKey)
                }
              >
                <TabsList>
                  <TabsTrigger value="en" className="uppercase">
                    English
                  </TabsTrigger>
                  <TabsTrigger value="es" className="uppercase">
                    Spanish
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="en" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title_en">Title</Label>
                    <Input
                      id="title_en"
                      value={titleEn}
                      onChange={(e) => handleTitleEnChange(e.target.value)}
                      placeholder="A clear, specific title"
                      autoFocus={mode === "create"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="excerpt_en">Excerpt</Label>
                    <Textarea
                      id="excerpt_en"
                      value={excerptEn}
                      onChange={(e) => setExcerptEn(e.target.value)}
                      placeholder="One or two sentences. Used for the OG description and search snippets."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="body_md_en">Body (markdown)</Label>
                    <MarkdownEditor
                      value={bodyEn}
                      onValueChange={setBodyEn}
                      placeholder="# Heading

Write the post body in markdown."
                    />
                  </div>
                </TabsContent>

                <TabsContent value="es" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title_es">
                      Título{" "}
                      <span className="text-xs text-muted-foreground normal-case">
                        (leave blank to hide from /es)
                      </span>
                    </Label>
                    <Input
                      id="title_es"
                      value={titleEs}
                      onChange={(e) => setTitleEs(e.target.value)}
                      placeholder="Spanish title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="excerpt_es">Excerpt</Label>
                    <Textarea
                      id="excerpt_es"
                      value={excerptEs}
                      onChange={(e) => setExcerptEs(e.target.value)}
                      placeholder="Spanish excerpt"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="body_md_es">Cuerpo (markdown)</Label>
                    <MarkdownEditor
                      value={bodyEs}
                      onValueChange={setBodyEs}
                      placeholder="Cuerpo en markdown."
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="min-w-0 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Live preview
              </p>
              <p className="text-xs text-muted-foreground uppercase">
                {activeLocale === "en" ? "English" : "Spanish"}
              </p>
            </div>
            <div className="min-h-80 border border-border bg-card p-6">
              <MarkdownPreview markdown={activeBody} />
            </div>
          </div>
        </div>

        <aside className="space-y-4 2xl:sticky 2xl:top-20 2xl:self-start">
          <Card size="sm">
            <CardHeader className="border-b border-border/60">
              <CardTitle className="text-sm uppercase">Publishing</CardTitle>
              {mode === "edit" ? (
                <CardAction>
                  <div className="flex items-center gap-2">
                    {hasUnsavedStatus ? (
                      <span className="text-xs text-muted-foreground uppercase">
                        Saved
                      </span>
                    ) : null}
                    <Badge variant="outline" className="uppercase">
                      {start.status}
                    </Badge>
                  </div>
                </CardAction>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) =>
                    typeof v === "string" && setStatus(v as StatusKey)
                  }
                >
                  <SelectTrigger id="status" className="w-full capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Visibility</SelectLabel>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Scheduled posts go live automatically once the publish time
                  passes.
                </p>
              </div>

              <div className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="published_at">Publish at</Label>
                  <Popover open={dateOpen} onOpenChange={setDateOpen}>
                    <PopoverTrigger
                      render={
                        <Button
                          type="button"
                          variant="outline"
                          id="published_at"
                          className="w-full justify-between font-normal"
                        >
                          {getDatePart(publishedAt)
                            ? format(
                                parseLocalDate(getDatePart(publishedAt))!,
                                "PPP",
                              )
                            : "Select date"}
                          <ChevronDownIcon data-icon="inline-end" />
                        </Button>
                      }
                    />
                    <PopoverContent
                      className="w-auto overflow-hidden p-0"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={parseLocalDate(getDatePart(publishedAt))}
                        captionLayout="dropdown"
                        defaultMonth={parseLocalDate(getDatePart(publishedAt))}
                        onSelect={(d) => {
                          setPublishedAt(
                            combineDateTime(
                              toLocalDateString(d),
                              getTimePart(publishedAt) || "00:00",
                            ),
                          )
                          setDateOpen(false)
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="w-32 space-y-2">
                  <Label htmlFor="published_at_time">Time</Label>
                  <Input
                    type="time"
                    id="published_at_time"
                    step="1"
                    value={getTimePart(publishedAt)}
                    onChange={(e) =>
                      setPublishedAt(
                        combineDateTime(
                          getDatePart(publishedAt),
                          e.target.value,
                        ),
                      )
                    }
                    className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Leave blank when publishing now to default to the current time.
              </p>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader className="border-b border-border/60">
              <CardTitle className="text-sm uppercase">Post details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="how-to-pick-a-cms"
                  autoCapitalize="none"
                  autoCorrect="off"
                />
                <p className="text-xs text-muted-foreground">
                  Lowercase letters, numbers, and dashes only. The post URL
                  will be /blog/{slug || "your-slug"}.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cover_image_url">Cover image URL</Label>
                <Input
                  id="cover_image_url"
                  value={cover}
                  onChange={(e) => setCover(e.target.value)}
                  placeholder="https://…"
                  type="url"
                />
                <p className="text-xs text-muted-foreground">
                  Used as the OG image and the hero on the post page. 16:9 works
                  best.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="seo, small business, mobile app"
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated. Lowercased and deduped on save.
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this post?</DialogTitle>
            <DialogDescription>
              This is permanent. The /blog/{slug} URL will return 404 on the
              next deploy.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function titleToSlug(title: string): string {
  // NFD splits accented characters into base + combining mark; the regex
  // strips the marks (U+0300 to U+036F) so "señales" becomes "senales".
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}
