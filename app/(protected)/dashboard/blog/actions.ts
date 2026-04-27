"use server"

import { revalidatePath } from "next/cache"

import { runDailyGeneration } from "@/lib/blog/auto-generate"
import { createClient } from "@/lib/supabase/server"

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const STATUS_VALUES = ["draft", "scheduled", "published"] as const
type PostStatus = (typeof STATUS_VALUES)[number]

export type CreatePostResult =
  | { ok: true; postId: string }
  | { ok: false; error: string }

export type UpdatePostResult = { ok: true } | { ok: false; error: string }

function str(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim()
  return v.length > 0 ? v : null
}

function multilineStr(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "")
  return v.length > 0 ? v : null
}

function parseStatus(raw: string | null): PostStatus {
  return STATUS_VALUES.includes(raw as PostStatus)
    ? (raw as PostStatus)
    : "draft"
}

/**
 * Lowercase + trim every tag, dedupe, drop empties. Without normalization
 * "Design", "design", and " design " would land as three separate tags and
 * fragment the GIN-indexed faceted filter on the public index.
 */
function parseTags(raw: string | null): string[] {
  if (!raw) return []
  const seen = new Set<string>()
  for (const piece of raw.split(",")) {
    const tag = piece.trim().toLowerCase()
    if (tag.length > 0) seen.add(tag)
  }
  return Array.from(seen)
}

/**
 * `datetime-local` inputs return values like "2026-04-27T15:30" with no
 * timezone — convert to ISO so Postgres reads it as the user's local time
 * relative to UTC. (Datetime-local doesn't expose tz; treating it as local
 * matches what the user sees in the picker.)
 */
function parsePublishedAt(raw: string | null): string | null {
  if (!raw) return null
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

function revalidateBlogPaths(slug?: string | null) {
  // Public indices (both locales) + admin list.
  revalidatePath("/blog")
  revalidatePath("/[locale]/blog", "page")
  revalidatePath("/dashboard/blog")
  if (slug) {
    // Both en (no prefix) and es (prefixed) post detail pages.
    revalidatePath(`/blog/${slug}`)
    revalidatePath(`/es/blog/${slug}`)
    revalidatePath("/[locale]/blog/[slug]", "page")
  }
  // Sitemap is regenerated lazily; force a fresh build on next request.
  revalidatePath("/sitemap.xml")
}

async function assertStaff(): Promise<
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; userId: string }
  | { ok: false; error: string }
> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle()
  if (!profile || (profile.role !== "admin" && profile.role !== "editor")) {
    return { ok: false, error: "Only admins or editors can manage posts" }
  }
  return { ok: true, supabase, userId: auth.user.id }
}

export async function createPost(
  formData: FormData,
): Promise<CreatePostResult> {
  const auth = await assertStaff()
  if (!auth.ok) return { ok: false, error: auth.error }
  const { supabase } = auth

  const slug = str(formData, "slug")?.toLowerCase() ?? null
  if (!slug || !SLUG_RE.test(slug)) {
    return {
      ok: false,
      error: "Slug must be lowercase letters, numbers, and dashes only",
    }
  }

  const titleEn = str(formData, "title_en")
  if (!titleEn) return { ok: false, error: "English title is required" }

  // Pre-check slug uniqueness so we return a friendly message instead of
  // leaking the Postgres unique-violation text.
  const existing = await supabase
    .from("blog_posts")
    .select("id")
    .eq("slug", slug)
    .maybeSingle()
  if (existing.data) {
    return { ok: false, error: `Slug "${slug}" is already taken` }
  }

  const status = parseStatus(str(formData, "status"))
  const publishedAt = parsePublishedAt(str(formData, "published_at"))

  // status='published' without an explicit publish time defaults to now() so
  // the public RLS filter (`published_at <= now()`) matches immediately.
  const effectivePublishedAt =
    status === "published" && !publishedAt
      ? new Date().toISOString()
      : publishedAt

  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      slug,
      title_en: titleEn,
      title_es: str(formData, "title_es"),
      excerpt_en: str(formData, "excerpt_en"),
      excerpt_es: str(formData, "excerpt_es"),
      body_md_en: multilineStr(formData, "body_md_en") ?? "",
      body_md_es: multilineStr(formData, "body_md_es"),
      cover_image_url: str(formData, "cover_image_url"),
      tags: parseTags(str(formData, "tags")),
      status,
      published_at: effectivePublishedAt,
    })
    .select("id")
    .single()

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to create post" }
  }

  revalidateBlogPaths(slug)
  return { ok: true, postId: data.id }
}

export async function updatePost(
  postId: string,
  formData: FormData,
): Promise<UpdatePostResult> {
  const auth = await assertStaff()
  if (!auth.ok) return { ok: false, error: auth.error }
  const { supabase } = auth

  const slug = str(formData, "slug")?.toLowerCase() ?? null
  if (!slug || !SLUG_RE.test(slug)) {
    return {
      ok: false,
      error: "Slug must be lowercase letters, numbers, and dashes only",
    }
  }

  const titleEn = str(formData, "title_en")
  if (!titleEn) return { ok: false, error: "English title is required" }

  // Pre-check slug uniqueness for collisions against OTHER posts only.
  const collision = await supabase
    .from("blog_posts")
    .select("id")
    .eq("slug", slug)
    .neq("id", postId)
    .maybeSingle()
  if (collision.data) {
    return { ok: false, error: `Slug "${slug}" is already taken` }
  }

  const status = parseStatus(str(formData, "status"))
  const publishedAt = parsePublishedAt(str(formData, "published_at"))

  // Look up the existing publish time so we don't clobber it when the user
  // toggles status without touching the date picker.
  const { data: existing } = await supabase
    .from("blog_posts")
    .select("published_at")
    .eq("id", postId)
    .maybeSingle()

  const effectivePublishedAt =
    status === "published" && !publishedAt && !existing?.published_at
      ? new Date().toISOString()
      : (publishedAt ?? existing?.published_at ?? null)

  const { error } = await supabase
    .from("blog_posts")
    .update({
      slug,
      title_en: titleEn,
      title_es: str(formData, "title_es"),
      excerpt_en: str(formData, "excerpt_en"),
      excerpt_es: str(formData, "excerpt_es"),
      body_md_en: multilineStr(formData, "body_md_en") ?? "",
      body_md_es: multilineStr(formData, "body_md_es"),
      cover_image_url: str(formData, "cover_image_url"),
      tags: parseTags(str(formData, "tags")),
      status,
      published_at: effectivePublishedAt,
    })
    .eq("id", postId)

  if (error) return { ok: false, error: error.message }

  revalidateBlogPaths(slug)
  return { ok: true }
}

export async function deletePost(
  postId: string,
): Promise<UpdatePostResult> {
  const auth = await assertStaff()
  if (!auth.ok) return { ok: false, error: auth.error }
  const { supabase } = auth

  // Capture slug for revalidation before deleting.
  const { data: existing } = await supabase
    .from("blog_posts")
    .select("slug")
    .eq("id", postId)
    .maybeSingle()

  const { error } = await supabase
    .from("blog_posts")
    .delete()
    .eq("id", postId)
  if (error) return { ok: false, error: error.message }

  revalidateBlogPaths(existing?.slug ?? null)
  return { ok: true }
}

export type GenerateDraftNowResult =
  | { ok: true; postId: string; slug: string; title: string }
  | { ok: false; error: string }

/**
 * Admin-triggered version of the daily cron. Same pipeline, same gating,
 * but always inserts as a draft so manual generations never auto-publish
 * regardless of the BLOG_AUTO_PUBLISH env var.
 */
export async function generateDraftNow(args?: {
  verticalId?: string
  techId?: string
}): Promise<GenerateDraftNowResult> {
  const auth = await assertStaff()
  if (!auth.ok) return { ok: false, error: auth.error }

  const result = await runDailyGeneration({
    verticalId: args?.verticalId,
    techId: args?.techId,
    autoPublish: false,
  })
  if (!result.ok) return { ok: false, error: result.error }

  revalidatePath("/dashboard/blog")
  return {
    ok: true,
    postId: result.postId,
    slug: result.slug,
    title: result.title,
  }
}

export async function togglePublish(
  postId: string,
): Promise<UpdatePostResult> {
  const auth = await assertStaff()
  if (!auth.ok) return { ok: false, error: auth.error }
  const { supabase } = auth

  const { data: existing, error: lookupErr } = await supabase
    .from("blog_posts")
    .select("status, published_at, slug")
    .eq("id", postId)
    .maybeSingle()
  if (lookupErr) return { ok: false, error: lookupErr.message }
  if (!existing) return { ok: false, error: "Post not found" }

  const goingPublic = existing.status !== "published"
  const nextStatus: PostStatus = goingPublic ? "published" : "draft"
  const nextPublishedAt =
    goingPublic && !existing.published_at
      ? new Date().toISOString()
      : existing.published_at

  const { error } = await supabase
    .from("blog_posts")
    .update({ status: nextStatus, published_at: nextPublishedAt })
    .eq("id", postId)
  if (error) return { ok: false, error: error.message }

  revalidateBlogPaths(existing.slug)
  return { ok: true }
}
