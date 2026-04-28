import { redirect } from "next/navigation"

import { InstagramIntegrationCard } from "@/components/admin/instagram-integration-card"
import { XIntegrationCard } from "@/components/admin/x-integration-card"
import {
  INSTAGRAM_PROVIDER,
  isInstagramConfigured,
} from "@/lib/instagram/config"
import { createClient } from "@/lib/supabase/server"
import { X_PROVIDER, isXConfigured } from "@/lib/x/config"

export default async function AdminIntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ instagram?: string; x?: string; reason?: string }>
}) {
  const params = await searchParams

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect("/auth/login?next=/admin/integrations")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle()

  if (profile?.role !== "admin") redirect("/dashboard")

  const configured = isInstagramConfigured()
  const xConfigured = isXConfigured()

  let connection: {
    username: string | null
    accountId: string
    scopes: string[]
    tokenExpiresAt: string
    lastRefreshedAt: string | null
    connectedAt: string
  } | null = null
  let xConnection: {
    username: string | null
    accountId: string
    scopes: string[]
    tokenExpiresAt: string
    lastRefreshedAt: string | null
    connectedAt: string
  } | null = null

  if (configured) {
    const { data } = await supabase
      .from("app_integrations")
      .select(
        "account_id, username, scopes, token_expires_at, last_refreshed_at, connected_at"
      )
      .eq("provider", INSTAGRAM_PROVIDER)
      .maybeSingle()
    if (data) {
      connection = {
        accountId: data.account_id,
        username: data.username,
        scopes: data.scopes,
        tokenExpiresAt: data.token_expires_at,
        lastRefreshedAt: data.last_refreshed_at,
        connectedAt: data.connected_at,
      }
    }
  }

  if (xConfigured) {
    const { data } = await supabase
      .from("app_integrations")
      .select(
        "account_id, username, scopes, token_expires_at, last_refreshed_at, connected_at"
      )
      .eq("provider", X_PROVIDER)
      .maybeSingle()
    if (data) {
      xConnection = {
        accountId: data.account_id,
        username: data.username,
        scopes: data.scopes,
        tokenExpiresAt: data.token_expires_at,
        lastRefreshedAt: data.last_refreshed_at,
        connectedAt: data.connected_at,
      }
    }
  }

  const errorReason =
    params.instagram === "error" ? (params.reason ?? "unknown") : undefined
  const xErrorReason =
    params.x === "error" ? (params.reason ?? "unknown") : undefined

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl uppercase">Integrations</h1>
        <p className="text-sm text-muted-foreground">
          Org-wide third-party connections. Per-rep integrations like Google
          Workspace live under each user&apos;s settings.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <InstagramIntegrationCard
          configured={configured}
          connection={connection}
          errorReason={errorReason}
        />
        <XIntegrationCard
          configured={xConfigured}
          connection={xConnection}
          errorReason={xErrorReason}
        />
      </div>
    </div>
  )
}
