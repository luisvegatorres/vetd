import "server-only"

import { randomBytes } from "node:crypto"

import { NextResponse } from "next/server"

import { requireXAdminAccess } from "@/lib/x/auth"
import { getXConfig } from "@/lib/x/config"
import { buildAuthorizeUrl, createCodeChallenge } from "@/lib/x/oauth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const STATE_COOKIE = "x_oauth_state"
const VERIFIER_COOKIE = "x_oauth_verifier"
const USER_COOKIE = "x_oauth_user"

export async function GET(request: Request) {
  const config = getXConfig()
  if (!config) {
    return NextResponse.json({ error: "x_not_configured" }, { status: 501 })
  }

  const access = await requireXAdminAccess()
  if (!access.ok) {
    const url = new URL(request.url)
    return NextResponse.redirect(new URL("/auth/login", url.origin))
  }

  const state = randomBytes(24).toString("hex")
  const codeVerifier = randomBytes(32).toString("base64url")
  const codeChallenge = createCodeChallenge(codeVerifier)
  const response = NextResponse.redirect(
    buildAuthorizeUrl(config, { state, codeChallenge })
  )

  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  }
  response.cookies.set(STATE_COOKIE, state, cookieOptions)
  response.cookies.set(VERIFIER_COOKIE, codeVerifier, cookieOptions)
  response.cookies.set(USER_COOKIE, access.userId, cookieOptions)
  return response
}
