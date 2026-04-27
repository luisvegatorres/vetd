"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  createPost,
  deletePost,
  updatePost,
} from "@/app/(protected)/dashboard/blog/actions"
import { AiAssistMenu } from "@/app/(protected)/dashboard/blog/_components/ai-assist-menu"
import { MarkdownEditor } from "@/app/(protected)/dashboard/blog/_components/markdown-editor"
import { MarkdownPreview } from "@/app/(protected)/dashboard/blog/_components/markdown-preview"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  Select,
  SelectContent,
  SelectItem,
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

  const activeBody = activeLocale === "en" ? bodyEn : bodyEs

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
        router.push(`/dashboard/blog/${res.postId}`)
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
      router.push("/dashboard/blog")
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard/blog")}
          className="gap-2"
        >
          <ArrowLeft className="size-3.5" />
          All posts
        </Button>
        <h1 className="font-heading text-2xl uppercase">
          {mode === "create" ? "New post" : "Edit post"}
        </h1>
        {mode === "edit" ? (
          <Badge variant="outline" className="uppercase">
            {status}
          </Badge>
        ) : null}
        <div className="ml-auto flex items-center gap-2">
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
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
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
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase">
              Live preview
            </p>
            <p className="text-xs text-muted-foreground uppercase">
              {activeLocale === "en" ? "English" : "Spanish"}
            </p>
          </div>
          <div className="max-h-[80vh] overflow-auto border border-border bg-card p-6">
            <MarkdownPreview markdown={activeBody} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 border-t border-border/60 pt-6 lg:grid-cols-2">
        <div className="space-y-4">
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
              Lowercase letters, numbers, and dashes only. The post URL will be
              /blog/{slug || "your-slug"}.
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
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={status}
              onValueChange={(v) =>
                typeof v === "string" && setStatus(v as StatusKey)
              }
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Scheduled posts go live automatically once the publish time
              passes.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="published_at">Publish at</Label>
            <Input
              id="published_at"
              type="datetime-local"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank when publishing now to default to the current time.
            </p>
          </div>
        </div>
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
