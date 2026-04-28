import "server-only"

import { X_PROVIDER, getXConfig } from "@/lib/x/config"
import { refreshAccessToken } from "@/lib/x/oauth"
import { createAdminClient } from "@/lib/supabase/admin"

const REFRESH_SKEW_MS = 5 * 60 * 1000

export type XAccessTokenResult =
  | { ok: true; accessToken: string }
  | { ok: false; error: string }

export async function getValidXAccessToken(): Promise<XAccessTokenResult> {
  const config = getXConfig()
  if (!config) return { ok: false, error: "X is not configured" }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("app_integrations")
    .select("access_token, refresh_token, token_expires_at")
    .eq("provider", X_PROVIDER)
    .maybeSingle()

  if (error) return { ok: false, error: error.message }
  if (!data?.access_token) return { ok: false, error: "X is not connected" }

  const expiresAt = new Date(data.token_expires_at).getTime()
  if (Number.isFinite(expiresAt) && expiresAt - REFRESH_SKEW_MS > Date.now()) {
    return { ok: true, accessToken: data.access_token }
  }

  if (!data.refresh_token) {
    return { ok: false, error: "X refresh token is missing; reconnect X" }
  }

  try {
    const fresh = await refreshAccessToken(config, data.refresh_token)
    const refreshToken = fresh.refresh_token ?? data.refresh_token
    const expiresAt = new Date(Date.now() + fresh.expires_in * 1000)
    const { error: updateError } = await admin
      .from("app_integrations")
      .update({
        access_token: fresh.access_token,
        refresh_token: refreshToken,
        token_expires_at: expiresAt.toISOString(),
        last_refreshed_at: new Date().toISOString(),
      })
      .eq("provider", X_PROVIDER)

    if (updateError) return { ok: false, error: updateError.message }
    return { ok: true, accessToken: fresh.access_token }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
