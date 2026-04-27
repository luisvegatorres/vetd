import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import type { Locale } from "@/i18n/routing"

/**
 * Localized post — fields collapse to the requested locale. For ES queries,
 * `title`, `excerpt`, and `body_md` are guaranteed non-null because the
 * underlying SQL filter requires both `title_es` and `body_md_es` to be set
 * before a post is considered ES-published. (See bilingual fallback note in
 * the implementation plan.)
 */
export type BlogPostListItem = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  cover_image_url: string | null
  tags: string[]
  published_at: string
  reading_time_minutes: number
  has_translation: boolean
}

export type BlogPostFull = BlogPostListItem & {
  body_md: string
  updated_at: string
  available_locales: Locale[]
}

const PUBLIC_COLUMNS =
  "id, slug, cover_image_url, tags, published_at, updated_at, " +
  "title_en, title_es, excerpt_en, excerpt_es, body_md_en, body_md_es"

type PublicRow = {
  id: string
  slug: string
  cover_image_url: string | null
  tags: string[]
  published_at: string | null
  updated_at: string
  title_en: string
  title_es: string | null
  excerpt_en: string | null
  excerpt_es: string | null
  body_md_en: string
  body_md_es: string | null
}

/**
 * ~220 wpm is the standard sustainable reading rate for English/Spanish prose.
 * Markdown noise (headings, bullets, code) is close enough that we don't bother
 * stripping syntax before counting.
 */
export function readingTimeMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 220))
}

function hasEsTranslation(row: PublicRow): boolean {
  return Boolean(row.title_es && row.body_md_es)
}

function toListItem(row: PublicRow, locale: Locale): BlogPostListItem {
  const useEs = locale === "es"
  const title = useEs ? (row.title_es ?? row.title_en) : row.title_en
  const excerpt = useEs ? (row.excerpt_es ?? row.excerpt_en) : row.excerpt_en
  const body = useEs ? (row.body_md_es ?? row.body_md_en) : row.body_md_en
  return {
    id: row.id,
    slug: row.slug,
    title,
    excerpt,
    cover_image_url: row.cover_image_url,
    tags: row.tags,
    published_at: row.published_at ?? row.updated_at,
    reading_time_minutes: readingTimeMinutes(body),
    has_translation: hasEsTranslation(row),
  }
}

/**
 * Public-list query. Hides untranslated posts from /es entirely (see plan §7).
 * RLS already filters to status='published' and published_at <= now() for the
 * anon role; the .eq() filters here are belt-and-suspenders for staff sessions
 * (admin/editor would otherwise see drafts).
 */
export async function getPublishedPosts(
  locale: Locale,
): Promise<BlogPostListItem[]> {
  const supabase = await createClient()
  let query = supabase
    .from("blog_posts")
    .select(PUBLIC_COLUMNS)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })

  if (locale === "es") {
    query = query.not("title_es", "is", null).not("body_md_es", "is", null)
  }

  const { data, error } = await query
  if (error || !data) return []
  // Cast through unknown — the long select string trips PostgREST's inferred
  // string-error type, but the column list is correct (verified by hand).
  return (data as unknown as PublicRow[]).map((r) => toListItem(r, locale))
}

export async function getPostBySlug(
  locale: Locale,
  slug: string,
): Promise<BlogPostFull | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("blog_posts")
    .select(PUBLIC_COLUMNS)
    .eq("slug", slug)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .maybeSingle()

  if (error || !data) return null
  const row = data as unknown as PublicRow

  // /es/blog/[slug] for an untranslated post returns null so the route 404s
  // rather than serving English under a Spanish URL (SEO penalty).
  if (locale === "es" && !hasEsTranslation(row)) return null

  const useEs = locale === "es"
  const body = useEs ? (row.body_md_es ?? row.body_md_en) : row.body_md_en
  const available: Locale[] = ["en"]
  if (hasEsTranslation(row)) available.push("es")

  return {
    ...toListItem(row, locale),
    body_md: body,
    updated_at: row.updated_at,
    available_locales: available,
  }
}

/**
 * Used by `generateStaticParams`, which runs at build time without an HTTP
 * request, so it cannot use the cookie-bound SSR client. The admin (service-
 * role) client bypasses RLS, but we filter explicitly to published rows here
 * so the result matches what the public RLS policy would return.
 */
export async function getAllPublishedSlugs(): Promise<
  { slug: string; available_locales: Locale[]; updated_at: string }[]
> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("blog_posts")
    .select("slug, title_es, body_md_es, updated_at")
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())

  if (error || !data) return []
  return data.map((r) => {
    const available: Locale[] = ["en"]
    if (r.title_es && r.body_md_es) available.push("es")
    return { slug: r.slug, available_locales: available, updated_at: r.updated_at }
  })
}

/**
 * Aggregate distinct tags across all visible posts for the given locale.
 * Used by the index page to render filter pills. Tag display preserves the
 * casing of whichever post used it first; storage is lowercased on write.
 */
export async function getAllPublishedTags(locale: Locale): Promise<string[]> {
  const posts = await getPublishedPosts(locale)
  const set = new Set<string>()
  for (const post of posts) for (const tag of post.tags) set.add(tag)
  return Array.from(set).sort()
}

/**
 * Sidebar widget on the post page. Returns the most recently published posts
 * for the given locale, excluding the current post.
 */
export async function getRecentPosts(
  locale: Locale,
  excludeSlug: string,
  limit = 4,
): Promise<BlogPostListItem[]> {
  const posts = await getPublishedPosts(locale)
  return posts.filter((p) => p.slug !== excludeSlug).slice(0, limit)
}

/**
 * "Similar Blogs" grid on the post page. Ranks other posts by tag overlap with
 * the current post, then falls back to recency. Always returns up to `limit`
 * items so the section never collapses.
 */
export async function getRelatedPosts(
  locale: Locale,
  excludeSlug: string,
  tags: string[],
  limit = 3,
): Promise<BlogPostListItem[]> {
  const posts = await getPublishedPosts(locale)
  const others = posts.filter((p) => p.slug !== excludeSlug)
  const tagSet = new Set(tags)
  const scored = others.map((p) => ({
    post: p,
    score: p.tags.reduce((n, t) => n + (tagSet.has(t) ? 1 : 0), 0),
  }))
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return (
      new Date(b.post.published_at).getTime() -
      new Date(a.post.published_at).getTime()
    )
  })
  return scored.slice(0, limit).map((s) => s.post)
}
