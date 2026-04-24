import "server-only"

import { GOOGLE_SCOPES, type GoogleConfig } from "@/lib/google/config"

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"

export type GoogleTokenResponse = {
  access_token: string
  expires_in: number
  refresh_token?: string
  scope: string
  token_type: string
  id_token?: string
}

export type DecodedIdToken = {
  email?: string
  hd?: string // hosted domain; present on Workspace accounts
  sub?: string
}

export function buildAuthUrl(config: GoogleConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPES.join(" "),
    // `offline` → Google returns a refresh_token.
    // `prompt=consent` → forces re-prompt so we always get refresh_token even
    // on reconnects; without this, Google omits refresh_token on re-auth.
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  })
  return `${AUTH_ENDPOINT}?${params.toString()}`
}

export async function exchangeCode(
  config: GoogleConfig,
  code: string,
): Promise<GoogleTokenResponse> {
  const body = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: "authorization_code",
  })
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Google token exchange failed: ${res.status} ${text}`)
  }
  return (await res.json()) as GoogleTokenResponse
}

export async function refreshAccessToken(
  config: GoogleConfig,
  refreshToken: string,
): Promise<GoogleTokenResponse> {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "refresh_token",
  })
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Google token refresh failed: ${res.status} ${text}`)
  }
  return (await res.json()) as GoogleTokenResponse
}

/**
 * Quick JWT payload decode. We don't verify the signature here; the token
 * was returned directly from Google's token endpoint over TLS, so it's
 * trusted for identification purposes (reading `email` / `hd`).
 */
export function decodeIdTokenPayload(idToken: string): DecodedIdToken | null {
  const parts = idToken.split(".")
  if (parts.length < 2) return null
  try {
    const payload = parts[1]
    const padded = payload + "===".slice((payload.length + 3) % 4)
    const base64 = padded.replace(/-/g, "+").replace(/_/g, "/")
    const json = Buffer.from(base64, "base64").toString("utf8")
    return JSON.parse(json) as DecodedIdToken
  } catch {
    return null
  }
}
