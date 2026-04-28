import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { X_PROVIDER, isXConfigured } from "@/lib/x/config"
import { XPostComposer } from "./post-form"

export default async function ComposeXPostPage() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect("/auth/login?next=/admin/integrations/x/post")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle()
  if (profile?.role !== "admin") redirect("/dashboard")

  if (!isXConfigured()) redirect("/admin/integrations")

  const { data: integration } = await supabase
    .from("app_integrations")
    .select("username, scopes, token_expires_at")
    .eq("provider", X_PROVIDER)
    .maybeSingle()

  if (!integration) redirect("/admin/integrations")

  const hasPublishScopes =
    integration.scopes.includes("tweet.write") &&
    integration.scopes.includes("media.write")

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/integrations"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground uppercase hover:text-foreground"
        >
          <ArrowLeft className="size-3" aria-hidden />
          Back to integrations
        </Link>
        <h1 className="mt-2 font-heading text-2xl uppercase">Compose X post</h1>
        <p className="text-sm text-muted-foreground">
          Posts publish immediately to{" "}
          {integration.username ? (
            <a
              href={`https://x.com/${integration.username}`}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
            >
              @{integration.username}
            </a>
          ) : (
            "the connected account"
          )}
          . Text is required; one image is optional.
        </p>
      </div>

      {hasPublishScopes ? (
        <XPostComposer username={integration.username ?? ""} />
      ) : (
        <div className="border border-destructive/40 bg-destructive/5 p-6 text-sm">
          <p className="font-medium">Publish scopes are missing.</p>
          <p className="mt-1 text-muted-foreground">
            The connected token must include{" "}
            <code className="rounded bg-muted px-1">tweet.write</code> and{" "}
            <code className="rounded bg-muted px-1">media.write</code>.
            Reconnect from{" "}
            <Link href="/admin/integrations" className="underline">
              the integrations page
            </Link>{" "}
            after enabling them in the X Developer Console.
          </p>
        </div>
      )}
    </div>
  )
}
