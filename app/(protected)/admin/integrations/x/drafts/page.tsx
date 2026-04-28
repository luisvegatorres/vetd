import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, Sparkles } from "lucide-react"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { X_PROVIDER, isXConfigured } from "@/lib/x/config"
import { createClient } from "@/lib/supabase/server"
import { GenerateButton } from "./_components/generate-button"
import { XDraftCard, type XDraftRow } from "./_components/draft-card"

export default async function XDraftsPage() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect("/auth/login?next=/admin/integrations/x/drafts")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle()
  if (profile?.role !== "admin") redirect("/dashboard")

  if (!isXConfigured()) redirect("/admin/integrations")

  const { data: integration } = await supabase
    .from("app_integrations")
    .select("username, scopes")
    .eq("provider", X_PROVIDER)
    .maybeSingle()
  if (!integration) redirect("/admin/integrations")

  const canPublish = integration.scopes.includes("tweet.write")

  const { data: drafts } = await supabase
    .from("x_drafts")
    .select(
      "id, topic, text, status, published_post_id, published_url, published_at, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(50)

  const rows: XDraftRow[] = (drafts ?? []).map((d) => ({
    id: d.id,
    topic: d.topic,
    text: d.text,
    status: d.status as "draft" | "published" | "discarded",
    publishedPostId: d.published_post_id,
    publishedUrl: d.published_url,
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
          <h1 className="mt-2 font-heading text-2xl uppercase">X drafts</h1>
          <p className="text-sm text-muted-foreground">
            AI-generated post drafts for{" "}
            {integration.username ? `@${integration.username}` : "X"}.{" "}
            {draftCount} draft{draftCount === 1 ? "" : "s"}, {publishedCount}{" "}
            published.
          </p>
        </div>
        <GenerateButton />
      </div>

      {!canPublish ? (
        <div className="border border-destructive/40 bg-destructive/5 p-4 text-sm">
          The connected token is missing the{" "}
          <code className="rounded bg-muted px-1">tweet.write</code> scope.
          Generate and review drafts here, but publishing will fail until you
          reconnect.
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
              Click Generate draft above. Gemini will produce a short post
              tuned for a developer audience.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {rows.map((draft) => (
            <XDraftCard
              key={draft.id}
              draft={draft}
              canPublish={canPublish && draft.status === "draft"}
            />
          ))}
        </div>
      )}
    </div>
  )
}
