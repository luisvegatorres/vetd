import "server-only"

import { NextResponse } from "next/server"

import { getGoogleConfig } from "@/lib/google/config"
import { decodeIdTokenPayload, exchangeCode } from "@/lib/google/oauth"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const STATE_COOKIE = "google_oauth_state"
const USER_COOKIE = "google_oauth_user"

function settingsRedirect(origin: string, qs: Record<string, string>) {
  const url = new URL("/settings", origin)
  for (const [k, v] of Object.entries(qs)) url.searchParams.set(k, v)
  return NextResponse.redirect(url)
}

export async function GET(request: Request) {
  const config = getGoogleConfig()
  if (!config) {
    return NextResponse.json(
      { error: "google_not_configured" },
      { status: 501 },
    )
  }

  const url = new URL(request.url)
  const origin = url.origin
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const errorParam = url.searchParams.get("error")

  if (errorParam) {
    return settingsRedirect(origin, { google: "error", reason: errorParam })
  }
  if (!code || !state) {
    return settingsRedirect(origin, { google: "error", reason: "missing_code" })
  }

  const cookieState = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${STATE_COOKIE}=`))
    ?.split("=")[1]

  const cookieUser = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${USER_COOKIE}=`))
    ?.split("=")[1]

  if (!cookieState || cookieState !== state) {
    return settingsRedirect(origin, { google: "error", reason: "bad_state" })
  }
  if (!cookieUser) {
    return settingsRedirect(origin, { google: "error", reason: "no_user" })
  }

  let tokenResponse
  try {
    tokenResponse = await exchangeCode(config, code)
  } catch (err) {
    console.error("[google oauth callback] exchange failed", err)
    return settingsRedirect(origin, {
      google: "error",
      reason: "token_exchange",
    })
  }

  if (!tokenResponse.refresh_token) {
    // Google only returns refresh_token on first consent. Our start route
    // sets prompt=consent so we should always get one — if we don't, the
    // connection is unusable for cron sync.
    return settingsRedirect(origin, {
      google: "error",
      reason: "no_refresh_token",
    })
  }

  const idPayload = tokenResponse.id_token
    ? decodeIdTokenPayload(tokenResponse.id_token)
    : null
  const googleEmail = idPayload?.email ?? null

  const scopes = tokenResponse.scope.split(/\s+/).filter(Boolean)
  const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000)

  const admin = createAdminClient()
  const { error } = await admin
    .from("rep_integrations")
    .upsert(
      {
        rep_id: cookieUser,
        provider: "google",
        google_email: googleEmail,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        token_expires_at: expiresAt.toISOString(),
        scopes,
        // Reset sync cursors on reconnect so the next cron run re-seeds.
        sync_state: {},
        last_sync_error: null,
      },
      { onConflict: "rep_id,provider" },
    )
  if (error) {
    console.error("[google oauth callback] upsert failed", error)
    return settingsRedirect(origin, {
      google: "error",
      reason: "persist_failed",
    })
  }

  const response = settingsRedirect(origin, { google: "connected" })
  // Clear the transient cookies.
  response.cookies.set(STATE_COOKIE, "", { path: "/", maxAge: 0 })
  response.cookies.set(USER_COOKIE, "", { path: "/", maxAge: 0 })
  return response
}
