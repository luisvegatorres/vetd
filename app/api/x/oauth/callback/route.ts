import "server-only"

import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getProfile } from "@/lib/x/client"
import { X_PROVIDER, X_SCOPES, getXConfig } from "@/lib/x/config"
import { exchangeCodeForToken } from "@/lib/x/oauth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const STATE_COOKIE = "x_oauth_state"
const VERIFIER_COOKIE = "x_oauth_verifier"
const USER_COOKIE = "x_oauth_user"

function adminRedirect(origin: string, qs: Record<string, string>) {
  const url = new URL("/admin/integrations", origin)
  for (const [k, v] of Object.entries(qs)) url.searchParams.set(k, v)
  return NextResponse.redirect(url)
}

function readCookie(request: Request, name: string): string | undefined {
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
    ?.split("=")[1]
}

export async function GET(request: Request) {
  const config = getXConfig()
  if (!config) {
    return NextResponse.json({ error: "x_not_configured" }, { status: 501 })
  }

  const url = new URL(request.url)
  const origin = url.origin
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const errorParam = url.searchParams.get("error")
  const errorDescription = url.searchParams.get("error_description")

  if (errorParam) {
    return adminRedirect(origin, {
      x: "error",
      reason: errorDescription ?? errorParam,
    })
  }
  if (!code || !state) {
    return adminRedirect(origin, { x: "error", reason: "missing_code" })
  }

  const cookieState = readCookie(request, STATE_COOKIE)
  const codeVerifier = readCookie(request, VERIFIER_COOKIE)
  const cookieUser = readCookie(request, USER_COOKIE)

  if (!cookieState || cookieState !== state) {
    return adminRedirect(origin, { x: "error", reason: "bad_state" })
  }
  if (!codeVerifier) {
    return adminRedirect(origin, { x: "error", reason: "missing_verifier" })
  }
  if (!cookieUser) {
    return adminRedirect(origin, { x: "error", reason: "no_user" })
  }

  let token
  try {
    token = await exchangeCodeForToken(config, { code, codeVerifier })
  } catch (err) {
    console.error("[x oauth callback] token exchange failed", err)
    return adminRedirect(origin, { x: "error", reason: "token_exchange" })
  }

  if (!token.refresh_token) {
    return adminRedirect(origin, {
      x: "error",
      reason: "missing_refresh_token",
    })
  }

  let profile
  try {
    profile = await getProfile(token.access_token)
  } catch (err) {
    console.error("[x oauth callback] profile fetch failed", err)
    return adminRedirect(origin, { x: "error", reason: "profile_fetch" })
  }

  const now = new Date().toISOString()
  const expiresAt = new Date(Date.now() + token.expires_in * 1000)
  const scopes = token.scope ? token.scope.split(" ") : [...X_SCOPES]

  const admin = createAdminClient()
  const { error } = await admin.from("app_integrations").upsert(
    {
      provider: X_PROVIDER,
      account_id: profile.id,
      username: profile.username,
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      token_expires_at: expiresAt.toISOString(),
      scopes,
      connected_by: cookieUser,
      connected_at: now,
      last_refreshed_at: now,
    },
    { onConflict: "provider" }
  )
  if (error) {
    console.error("[x oauth callback] upsert failed", error)
    return adminRedirect(origin, { x: "error", reason: "persist_failed" })
  }

  const response = adminRedirect(origin, { x: "connected" })
  response.cookies.set(STATE_COOKIE, "", { path: "/", maxAge: 0 })
  response.cookies.set(VERIFIER_COOKIE, "", { path: "/", maxAge: 0 })
  response.cookies.set(USER_COOKIE, "", { path: "/", maxAge: 0 })
  return response
}
