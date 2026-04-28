import "server-only"

import { randomBytes } from "node:crypto"

import { NextResponse } from "next/server"

import { getInstagramConfig } from "@/lib/instagram/config"
import { buildAuthorizeUrl } from "@/lib/instagram/oauth"
import { requireInstagramAdminAccess } from "@/lib/instagram/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const STATE_COOKIE = "instagram_oauth_state"
const USER_COOKIE = "instagram_oauth_user"

export async function GET(request: Request) {
  const config = getInstagramConfig()
  if (!config) {
    return NextResponse.json(
      { error: "instagram_not_configured" },
      { status: 501 },
    )
  }

  const access = await requireInstagramAdminAccess()
  if (!access.ok) {
    const url = new URL(request.url)
    return NextResponse.redirect(new URL("/auth/login", url.origin))
  }

  const state = randomBytes(24).toString("hex")
  const response = NextResponse.redirect(buildAuthorizeUrl(config, state))

  // httpOnly state cookies, verified in the callback. Lax SameSite is fine
  // since Instagram redirects back via a top-level navigation.
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  }
  response.cookies.set(STATE_COOKIE, state, cookieOptions)
  response.cookies.set(USER_COOKIE, access.userId, cookieOptions)
  return response
}
