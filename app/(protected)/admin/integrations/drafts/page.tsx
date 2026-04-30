import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Sparkles } from "lucide-react"
import {
  INSTAGRAM_PROVIDER,
  isInstagramConfigured,
} from "@/lib/instagram/config"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { DraftCard, type DraftRow } from "./_components/draft-card"
import { GenerateButton } from "./_components/generate-button"

const BUCKET = "instagram-uploads"

export default async function InstagramDraftsPage() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect("/auth/login?next=/admin/integrations/drafts")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle()
  if (profile?.role !== "admin") redirect("/dashboard")

  if (!isInstagramConfigured()) redirect("/admin/integrations")

  const { data: integration } = await supabase
    .from("app_integrations")
    .select("username, scopes")
    .eq("provider", INSTAGRAM_PROVIDER)
    .maybeSingle()
  if (!integration) redirect("/admin/integrations")

  const hasPublishScope = integration.scopes.includes(
    "instagram_business_content_publish",
  )

  const { data: drafts } = await supabase
    .from("instagram_drafts")
    .select(
      "id, topic, caption, image_prompt, image_path, status, published_permalink, published_at, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(50)

  const admin = createAdminClient()
  const rows: DraftRow[] = (drafts ?? []).map((d) => ({
    id: d.id,
    topic: d.topic,
    caption: d.caption,
    imagePrompt: d.image_prompt,
    imageUrl: d.image_path
      ? admin.storage.from(BUCKET).getPublicUrl(d.image_path).data.publicUrl
      : null,
    status: d.status as "draft" | "published" | "discarded",
    publishedPermalink: d.published_permalink,
    publishedAt: d.published_at,
    createdAt: d.created_at,
  }))

  const draftCount = rows.filter((r) => r.status === "draft").length
  const publishedCount = rows.filter((r) => r.status === "published").length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/integrations"
            className="inline-flex items-center gap-1 text-xs uppercase text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" aria-hidden />
            Back to integrations
          </Link>
          <h1 className="mt-2 font-heading text-2xl uppercase">
            Instagram drafts
          </h1>
          <p className="text-sm text-muted-foreground">
            AI-generated drafts for{" "}
            {integration.username ? `@${integration.username}` : "Instagram"}.{" "}
            {draftCount} draft{draftCount === 1 ? "" : "s"}, {publishedCount}{" "}
            published.
          </p>
        </div>
        <GenerateButton />
      </div>

      {!hasPublishScope ? (
        <div className="border border-destructive/40 bg-destructive/5 p-4 text-sm">
          The connected token is missing the publish scope. You can still
          generate and review drafts here, but publishing will fail until you
          reconnect with{" "}
          <code className="rounded bg-muted px-1">
            instagram_business_content_publish
          </code>{" "}
          enabled.
        </div>
      ) : null}

      {rows.length === 0 ? (
        <Empty className="border border-border bg-card py-16">
          <EmptyHeader>
            <EmptyMedia>
              <Sparkles className="size-8 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>No drafts yet</EmptyTitle>
            <EmptyDescription>
              Click Generate draft above to have Gemini draft a caption and
              an image brief. Attach your own image before publishing.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {rows.map((draft) => (
            <DraftCard
              key={draft.id}
              draft={draft}
              canPublish={hasPublishScope && draft.status === "draft"}
            />
          ))}
        </div>
      )}
    </div>
  )
}
