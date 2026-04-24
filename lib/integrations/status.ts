import "server-only"

export type StripeMode = "test" | "live" | "unknown"

export type StripeStatus = {
  configured: boolean
  mode: StripeMode
  webhookConfigured: boolean
  presencePriceConfigured: boolean
  growthPriceConfigured: boolean
  publishableKeyConfigured: boolean
}

export function getStripeStatus(): StripeStatus {
  const secret = process.env.STRIPE_SECRET_KEY ?? ""
  const mode: StripeMode = secret.startsWith("sk_live_")
    ? "live"
    : secret.startsWith("sk_test_")
      ? "test"
      : "unknown"
  return {
    configured: Boolean(secret),
    mode,
    webhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    presencePriceConfigured: Boolean(process.env.STRIPE_PRICE_ID_PRESENCE),
    growthPriceConfigured: Boolean(process.env.STRIPE_PRICE_ID_GROWTH),
    publishableKeyConfigured: Boolean(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    ),
  }
}

export type CalcomStatus = {
  webhookConfigured: boolean
  bookingLinkConfigured: boolean
  bookingLink: string | null
}

export function getCalcomStatus(): CalcomStatus {
  const link =
    process.env.NEXT_PUBLIC_CAL_LINK || process.env.NEXT_PUBLIC_CALENDLY_URL
  return {
    webhookConfigured: Boolean(process.env.CAL_WEBHOOK_SECRET),
    bookingLinkConfigured: Boolean(link),
    bookingLink: link ?? null,
  }
}

export type SmtpStatus = {
  configured: boolean
  host: string | null
  user: string | null
  port: number
  leadsInbox: string
}

export function getSmtpStatus(): SmtpStatus {
  return {
    configured: Boolean(
      process.env.GMAIL_SMTP_HOST &&
        process.env.GMAIL_SMTP_USER &&
        process.env.GMAIL_SMTP_PASSWORD,
    ),
    host: process.env.GMAIL_SMTP_HOST ?? null,
    user: process.env.GMAIL_SMTP_USER ?? null,
    port: Number(process.env.GMAIL_SMTP_PORT ?? 587),
    leadsInbox: process.env.LEADS_NOTIFICATION_EMAIL ?? "leads@vetd.agency",
  }
}

export type SupabaseStatus = {
  configured: boolean
  url: string | null
  projectRef: string | null
  serviceRoleConfigured: boolean
}

export function getSupabaseStatus(): SupabaseStatus {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null
  const projectRef = url ? extractProjectRef(url) : null
  return {
    configured: Boolean(
      url && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ),
    url,
    projectRef,
    serviceRoleConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  }
}

function extractProjectRef(url: string): string | null {
  try {
    const host = new URL(url).host
    const parts = host.split(".")
    if (parts.length >= 2 && parts[1] === "supabase") return parts[0]
    return null
  } catch {
    return null
  }
}

export type VercelStatus = {
  deployed: boolean
  env: string | null
  region: string | null
  analyticsEnabled: boolean
  speedInsightsEnabled: boolean
  appUrl: string | null
}

export function getVercelStatus(): VercelStatus {
  const env = process.env.VERCEL_ENV ?? null
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
  return {
    deployed: Boolean(process.env.VERCEL),
    env,
    region: process.env.VERCEL_REGION ?? null,
    analyticsEnabled: true,
    speedInsightsEnabled: true,
    appUrl,
  }
}
