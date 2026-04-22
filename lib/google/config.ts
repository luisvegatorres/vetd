import "server-only"

// Scopes granted in a single consent prompt. The rep sees one "Allow Innovate
// App Studios to ..." screen and both Calendar + Gmail unlock together.
//
// - calendar.readonly: list events (no mutations)
// - gmail.readonly:    list messages + read headers (no send, no modify)
// - openid/email/profile: identify which Google account was connected
export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/gmail.readonly",
] as const

export type GoogleConfig = {
  clientId: string
  clientSecret: string
  redirectUri: string
  cronSecret: string | null
}

/**
 * Returns config when all Google vars are present, otherwise null. Callers
 * use this to cleanly disable integration surfaces (UI, routes, cron) in
 * environments that haven't provisioned Google Workspace yet — no crashes.
 */
export function getGoogleConfig(): GoogleConfig | null {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) return null

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"

  return {
    clientId,
    clientSecret,
    redirectUri: `${appUrl}/api/google/oauth/callback`,
    cronSecret: process.env.CRON_SECRET ?? null,
  }
}

export function isGoogleConfigured(): boolean {
  return getGoogleConfig() !== null
}
