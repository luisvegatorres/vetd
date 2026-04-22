import "server-only"

import type { createAdminClient } from "@/lib/supabase/admin"
import { getGoogleConfig } from "@/lib/google/config"
import { refreshAccessToken } from "@/lib/google/oauth"

type AdminClient = ReturnType<typeof createAdminClient>

const REFRESH_BUFFER_MS = 60_000 // refresh 60s before actual expiry

/**
 * Returns a valid access token for the rep, refreshing via the stored
 * refresh_token when necessary. Updates rep_integrations on refresh so
 * subsequent calls don't mint new tokens unnecessarily.
 *
 * Throws if the rep has no integration row or Google isn't configured.
 */
export async function getAccessTokenForRep(
  supabase: AdminClient,
  repId: string,
): Promise<string> {
  const config = getGoogleConfig()
  if (!config) throw new Error("Google integration not configured")

  const { data, error } = await supabase
    .from("rep_integrations")
    .select("id, refresh_token, access_token, token_expires_at")
    .eq("rep_id", repId)
    .eq("provider", "google")
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error(`No Google integration for rep ${repId}`)

  const expiresAt = new Date(data.token_expires_at).getTime()
  if (expiresAt - REFRESH_BUFFER_MS > Date.now()) {
    return data.access_token
  }

  const fresh = await refreshAccessToken(config, data.refresh_token)
  const newExpiresAt = new Date(Date.now() + fresh.expires_in * 1000)
  // Google doesn't always return a new refresh_token on refresh — keep the
  // existing one in that case.
  const refreshToken = fresh.refresh_token ?? data.refresh_token

  const { error: updateError } = await supabase
    .from("rep_integrations")
    .update({
      access_token: fresh.access_token,
      refresh_token: refreshToken,
      token_expires_at: newExpiresAt.toISOString(),
    })
    .eq("id", data.id)
  if (updateError) {
    console.error("[google tokens] persist refresh failed", updateError)
  }
  return fresh.access_token
}
