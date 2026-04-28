import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import {
  INSTAGRAM_PROVIDER,
  isInstagramConfigured,
} from "@/lib/instagram/config"
import { createClient } from "@/lib/supabase/server"
import { PostComposer } from "./post-form"

export default async function ComposeInstagramPostPage() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect("/auth/login?next=/admin/integrations/post")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle()
  if (profile?.role !== "admin") redirect("/dashboard")

  if (!isInstagramConfigured()) redirect("/admin/integrations")

  const { data: integration } = await supabase
    .from("app_integrations")
    .select("username, scopes, token_expires_at")
    .eq("provider", INSTAGRAM_PROVIDER)
    .maybeSingle()

  if (!integration) redirect("/admin/integrations")

  const hasPublishScope = integration.scopes.includes(
    "instagram_business_content_publish",
  )

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/integrations"
          className="inline-flex items-center gap-1 text-xs uppercase text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" aria-hidden />
          Back to integrations
        </Link>
        <h1 className="mt-2 font-heading text-2xl uppercase">Compose post</h1>
        <p className="text-sm text-muted-foreground">
          Posts publish immediately to{" "}
          {integration.username ? (
            <a
              href={`https://www.instagram.com/${integration.username}/`}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
            >
              @{integration.username}
            </a>
          ) : (
            "the connected account"
          )}
          . Single image only for now.
        </p>
      </div>

      {hasPublishScope ? (
        <PostComposer username={integration.username ?? ""} />
      ) : (
        <div className="border border-destructive/40 bg-destructive/5 p-6 text-sm">
          <p className="font-medium">Publish scope is missing.</p>
          <p className="mt-1 text-muted-foreground">
            The connected token does not include{" "}
            <code className="rounded bg-muted px-1">
              instagram_business_content_publish
            </code>
            . Disconnect from{" "}
            <Link href="/admin/integrations" className="underline">
              the integrations page
            </Link>{" "}
            and reconnect to grant it, or enable the permission in the Meta
            dashboard first.
          </p>
        </div>
      )}
    </div>
  )
}
