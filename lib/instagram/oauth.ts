import "server-only"

import { INSTAGRAM_SCOPES, type InstagramConfig } from "@/lib/instagram/config"

const AUTH_ENDPOINT = "https://www.instagram.com/oauth/authorize"
const SHORT_TOKEN_ENDPOINT = "https://api.instagram.com/oauth/access_token"
const GRAPH_BASE = "https://graph.instagram.com"

export type ShortTokenResponse = {
  access_token: string
  user_id: number | string
  permissions?: string
}

export type LongTokenResponse = {
  access_token: string
  token_type: "bearer"
  expires_in: number
}

export function buildAuthorizeUrl(
  config: InstagramConfig,
  state: string,
): string {
  const params = new URLSearchParams({
    client_id: config.appId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: INSTAGRAM_SCOPES.join(","),
    state,
  })
  return `${AUTH_ENDPOINT}?${params.toString()}`
}

export async function exchangeCodeForShortToken(
  config: InstagramConfig,
  code: string,
): Promise<ShortTokenResponse> {
  const body = new URLSearchParams({
    client_id: config.appId,
    client_secret: config.appSecret,
    grant_type: "authorization_code",
    redirect_uri: config.redirectUri,
    code,
  })
  const res = await fetch(SHORT_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Instagram code exchange failed: ${res.status} ${text}`)
  }
  return (await res.json()) as ShortTokenResponse
}

export async function exchangeShortForLongToken(
  config: InstagramConfig,
  shortToken: string,
): Promise<LongTokenResponse> {
  const params = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: config.appSecret,
    access_token: shortToken,
  })
  const res = await fetch(`${GRAPH_BASE}/access_token?${params.toString()}`)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(
      `Instagram long-token exchange failed: ${res.status} ${text}`,
    )
  }
  return (await res.json()) as LongTokenResponse
}

export async function refreshLongToken(
  longToken: string,
): Promise<LongTokenResponse> {
  const params = new URLSearchParams({
    grant_type: "ig_refresh_token",
    access_token: longToken,
  })
  const res = await fetch(
    `${GRAPH_BASE}/refresh_access_token?${params.toString()}`,
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Instagram token refresh failed: ${res.status} ${text}`)
  }
  return (await res.json()) as LongTokenResponse
}
