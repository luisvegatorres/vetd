import "server-only"

import { NextResponse } from "next/server"

import { getProfile } from "@/lib/instagram/client"
import {
  INSTAGRAM_PROVIDER,
  INSTAGRAM_SCOPES,
  getInstagramConfig,
} from "@/lib/instagram/config"
import {
  exchangeCodeForShortToken,
  exchangeShortForLongToken,
} from "@/lib/instagram/oauth"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const STATE_COOKIE = "instagram_oauth_state"
const USER_COOKIE = "instagram_oauth_user"

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
  const config = getInstagramConfig()
  if (!config) {
    return NextResponse.json(
      { error: "instagram_not_configured" },
      { status: 501 },
    )
  }

  const url = new URL(request.url)
  const origin = url.origin
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const errorParam = url.searchParams.get("error")
  const errorReason = url.searchParams.get("error_reason")

  if (errorParam) {
    return adminRedirect(origin, {
      instagram: "error",
      reason: errorReason ?? errorParam,
    })
  }
  if (!code || !state) {
    return adminRedirect(origin, {
      instagram: "error",
      reason: "missing_code",
    })
  }

  const cookieState = readCookie(request, STATE_COOKIE)
  const cookieUser = readCookie(request, USER_COOKIE)

  if (!cookieState || cookieState !== state) {
    return adminRedirect(origin, { instagram: "error", reason: "bad_state" })
  }
  if (!cookieUser) {
    return adminRedirect(origin, { instagram: "error", reason: "no_user" })
  }

  let shortToken
  try {
    shortToken = await exchangeCodeForShortToken(config, code)
  } catch (err) {
    console.error("[instagram oauth callback] short exchange failed", err)
    return adminRedirect(origin, {
      instagram: "error",
      reason: "token_exchange",
    })
  }

  let longToken
  try {
    longToken = await exchangeShortForLongToken(config, shortToken.access_token)
  } catch (err) {
    console.error("[instagram oauth callback] long exchange failed", err)
    return adminRedirect(origin, {
      instagram: "error",
      reason: "long_token_exchange",
    })
  }

  let profile
  try {
    profile = await getProfile(longToken.access_token)
  } catch (err) {
    console.error("[instagram oauth callback] profile fetch failed", err)
    return adminRedirect(origin, {
      instagram: "error",
      reason: "profile_fetch",
    })
  }

  const expiresAt = new Date(Date.now() + longToken.expires_in * 1000)
  const now = new Date().toISOString()

  const admin = createAdminClient()
  const { error } = await admin.from("app_integrations").upsert(
    {
      provider: INSTAGRAM_PROVIDER,
      account_id: profile.id,
      username: profile.username,
      access_token: longToken.access_token,
      token_expires_at: expiresAt.toISOString(),
      scopes: [...INSTAGRAM_SCOPES],
      connected_by: cookieUser,
      connected_at: now,
      last_refreshed_at: now,
    },
    { onConflict: "provider" },
  )
  if (error) {
    console.error("[instagram oauth callback] upsert failed", error)
    return adminRedirect(origin, {
      instagram: "error",
      reason: "persist_failed",
    })
  }

  const response = adminRedirect(origin, { instagram: "connected" })
  response.cookies.set(STATE_COOKIE, "", { path: "/", maxAge: 0 })
  response.cookies.set(USER_COOKIE, "", { path: "/", maxAge: 0 })
  return response
}
