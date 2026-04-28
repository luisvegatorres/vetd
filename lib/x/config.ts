import "server-only"

export const X_SCOPES = [
  "users.read",
  "tweet.read",
  "tweet.write",
  "media.write",
  "offline.access",
] as const

export const X_PROVIDER = "x"

export type XConfig = {
  clientId: string
  clientSecret: string
  redirectUri: string
  cronSecret: string | null
}

export function getXConfig(): XConfig | null {
  const clientId = process.env.X_CLIENT_ID
  const clientSecret = process.env.X_CLIENT_SECRET
  if (!clientId || !clientSecret) return null

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"

  return {
    clientId,
    clientSecret,
    redirectUri: `${appUrl}/api/x/oauth/callback`,
    cronSecret: process.env.CRON_SECRET ?? null,
  }
}

export function isXConfigured(): boolean {
  return getXConfig() !== null
}
