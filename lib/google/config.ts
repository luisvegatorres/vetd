import "server-only"

// Scopes granted in a single consent prompt. The rep sees one "Allow Vetd
// to ..." screen and everything unlocks together.
//
// - calendar.readonly:  list events (sync into interactions)
// - calendar.events:    create meetings with clients from the CRM (attendees,
//                       Google Meet link, invites sent automatically)
// - gmail.readonly:     list messages + read headers (no modify)
// - gmail.send:         send mail as the rep (used to email proposals,
//                       contracts, and deposit links so replies land in the
//                       rep's inbox instead of no-reply@)
// - openid/email/profile: identify which Google account was connected
export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
] as const

export const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send"
export const CALENDAR_EVENTS_SCOPE =
  "https://www.googleapis.com/auth/calendar.events"

export type GoogleConfig = {
  clientId: string
  clientSecret: string
  redirectUri: string
  cronSecret: string | null
}

/**
 * Returns config when all Google vars are present, otherwise null. Callers
 * use this to cleanly disable integration surfaces (UI, routes, cron) in
 * environments that haven't provisioned Google Workspace yet. No crashes.
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
