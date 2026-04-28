import "server-only"

// Scopes for "Instagram API with Instagram Login" (the post-Basic-Display
// product, surfaced under Meta dashboard → Instagram → API setup with
// Instagram Login). The connected account must be Business or Creator.
//
// - instagram_business_basic:           profile + media metadata
// - instagram_business_content_publish: create + publish posts/reels
export const INSTAGRAM_SCOPES = [
  "instagram_business_basic",
  "instagram_business_content_publish",
] as const

export const INSTAGRAM_PROVIDER = "instagram"

export type InstagramConfig = {
  appId: string
  appSecret: string
  redirectUri: string
  cronSecret: string | null
}

/**
 * Returns config when both Instagram vars are present, otherwise null.
 * Callers use this to cleanly disable the integration UI/routes/cron in
 * environments that haven't set up the Meta app yet. Note that the
 * Instagram App ID is the one surfaced under "Instagram → API setup with
 * Instagram Login" in the Meta dashboard, NOT the top-level Meta App ID.
 */
export function getInstagramConfig(): InstagramConfig | null {
  const appId = process.env.INSTAGRAM_APP_ID
  const appSecret = process.env.INSTAGRAM_APP_SECRET
  if (!appId || !appSecret) return null

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"

  return {
    appId,
    appSecret,
    redirectUri: `${appUrl}/api/instagram/oauth/callback`,
    cronSecret: process.env.CRON_SECRET ?? null,
  }
}

export function isInstagramConfigured(): boolean {
  return getInstagramConfig() !== null
}
