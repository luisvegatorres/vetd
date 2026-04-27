import { notFound, redirect } from "next/navigation"

import {
  PostEditor,
  type PostEditorInitial,
} from "@/app/(protected)/dashboard/blog/_components/post-editor"
import { createClient } from "@/lib/supabase/server"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type PageParams = { id: string }

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<PageParams>
}) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect(`/auth/login?next=/dashboard/blog/${id}`)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle()
  if (!profile || (profile.role !== "admin" && profile.role !== "editor")) {
    redirect("/dashboard")
  }

  const { data: post } = await supabase
    .from("blog_posts")
    .select(
      "id, slug, title_en, title_es, excerpt_en, excerpt_es, body_md_en, body_md_es, cover_image_url, tags, status, published_at",
    )
    .eq("id", id)
    .maybeSingle()
  if (!post) notFound()

  const initial: PostEditorInitial = {
    id: post.id,
    slug: post.slug,
    title_en: post.title_en,
    title_es: post.title_es ?? "",
    excerpt_en: post.excerpt_en ?? "",
    excerpt_es: post.excerpt_es ?? "",
    body_md_en: post.body_md_en,
    body_md_es: post.body_md_es ?? "",
    cover_image_url: post.cover_image_url ?? "",
    tags: post.tags,
    status: (post.status === "published" || post.status === "scheduled"
      ? post.status
      : "draft") as "draft" | "scheduled" | "published",
    published_at: post.published_at,
  }

  return <PostEditor mode="edit" initial={initial} />
}
