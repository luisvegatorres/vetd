import "server-only"

import { randomBytes } from "node:crypto"

import { NextResponse } from "next/server"

import { getGoogleConfig } from "@/lib/google/config"
import { buildAuthUrl } from "@/lib/google/oauth"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const STATE_COOKIE = "google_oauth_state"
const USER_COOKIE = "google_oauth_user"

export async function GET() {
  const config = getGoogleConfig()
  if (!config) {
    return NextResponse.json(
      { error: "google_not_configured" },
      { status: 501 },
    )
  }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) {
    return NextResponse.redirect(new URL("/auth/login", config.redirectUri))
  }

  const state = randomBytes(24).toString("hex")
  const response = NextResponse.redirect(buildAuthUrl(config, state))

  // httpOnly state cookies — verified in the callback. Lax SameSite is fine
  // since Google redirects back to us via a top-level navigation.
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600, // 10 minutes
  }
  response.cookies.set(STATE_COOKIE, state, cookieOptions)
  response.cookies.set(USER_COOKIE, auth.user.id, cookieOptions)
  return response
}
