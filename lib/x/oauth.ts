import "server-only"

import { createHash } from "node:crypto"

import { X_SCOPES, type XConfig } from "@/lib/x/config"

const AUTH_ENDPOINT = "https://x.com/i/oauth2/authorize"
const TOKEN_ENDPOINT = "https://api.x.com/2/oauth2/token"

export type XTokenResponse = {
  token_type: "bearer"
  expires_in: number
  access_token: string
  scope?: string
  refresh_token?: string
}

export function createCodeChallenge(codeVerifier: string): string {
  return createHash("sha256").update(codeVerifier).digest("base64url")
}

export function buildAuthorizeUrl(
  config: XConfig,
  input: { state: string; codeChallenge: string }
): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: X_SCOPES.join(" "),
    state: input.state,
    code_challenge: input.codeChallenge,
    code_challenge_method: "S256",
  })
  return `${AUTH_ENDPOINT}?${params.toString()}`
}

function basicAuth(config: XConfig): string {
  return `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`
}

export async function exchangeCodeForToken(
  config: XConfig,
  input: { code: string; codeVerifier: string }
): Promise<XTokenResponse> {
  const body = new URLSearchParams({
    code: input.code,
    grant_type: "authorization_code",
    redirect_uri: config.redirectUri,
    code_verifier: input.codeVerifier,
  })
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      authorization: basicAuth(config),
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`X token exchange failed: ${res.status} ${text}`)
  }
  return (await res.json()) as XTokenResponse
}

export async function refreshAccessToken(
  config: XConfig,
  refreshToken: string
): Promise<XTokenResponse> {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  })
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      authorization: basicAuth(config),
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`X token refresh failed: ${res.status} ${text}`)
  }
  return (await res.json()) as XTokenResponse
}
