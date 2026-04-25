import { CreditCard, Database, Globe, Mail } from "lucide-react"

import { AvailabilityCard } from "@/components/settings/availability-card"
import { GoogleIntegrationCard } from "@/components/settings/google-integration-card"
import { ProfileTitleCard } from "@/components/settings/profile-title-card"
import { IntegrationTile } from "@/components/settings/integration-card"
import { isGoogleConfigured } from "@/lib/google/config"
import {
  getSmtpStatus,
  getStripeStatus,
  getSupabaseStatus,
  getVercelStatus,
} from "@/lib/integrations/status"
import { createClient } from "@/lib/supabase/server"
import { parseWorkingHours } from "@/lib/working-hours"

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string; reason?: string }>
}) {
  const params = await searchParams
  const configured = isGoogleConfigured()

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()

  let connection: {
    googleEmail: string | null
    scopes: string[]
    lastSyncedAt: string | null
    lastSyncError: string | null
  } | null = null

  if (auth.user && configured) {
    const { data } = await supabase
      .from("rep_integrations")
      .select("google_email, scopes, last_synced_at, last_sync_error")
      .eq("rep_id", auth.user.id)
      .eq("provider", "google")
      .maybeSingle()
    if (data) {
      connection = {
        googleEmail: data.google_email,
        scopes: data.scopes,
        lastSyncedAt: data.last_synced_at,
        lastSyncError: data.last_sync_error,
      }
    }
  }

  let initialWorkingHours = parseWorkingHours(undefined)
  let initialTitle: string | null = null
  if (auth.user) {
    const { data } = await supabase
      .from("profiles")
      .select("working_hours, title")
      .eq("id", auth.user.id)
      .maybeSingle()
    initialWorkingHours = parseWorkingHours(data?.working_hours)
    initialTitle = data?.title ?? null
  }

  const errorReason =
    params.google === "error" ? (params.reason ?? "unknown") : undefined

  const stripe = getStripeStatus()
  const smtp = getSmtpStatus()
  const supabaseStatus = getSupabaseStatus()
  const vercel = getVercelStatus()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <GoogleIntegrationCard
          configured={configured}
          connection={connection}
          errorReason={errorReason}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <IntegrationTile
            title="Supabase"
            icon={<Database aria-hidden />}
            status={supabaseStatus.configured ? "connected" : "not-configured"}
            detail={
              supabaseStatus.configured
                ? (supabaseStatus.projectRef ?? "Configured")
                : "Not configured"
            }
            hint="Postgres · auth · RLS"
            href={
              supabaseStatus.projectRef
                ? `https://supabase.com/dashboard/project/${supabaseStatus.projectRef}`
                : null
            }
          />

          <IntegrationTile
            title="Stripe"
            icon={<CreditCard aria-hidden />}
            status={
              stripe.configured && stripe.webhookConfigured
                ? "connected"
                : stripe.configured
                  ? "error"
                  : "not-configured"
            }
            detail={
              stripe.configured
                ? `${stripe.mode === "live" ? "Live" : stripe.mode === "test" ? "Test" : "Unknown"} mode`
                : "Not configured"
            }
            hint={
              stripe.configured
                ? stripe.webhookConfigured
                  ? "Checkout · webhooks · plans"
                  : "Webhook secret missing"
                : "Checkout · subscriptions"
            }
            href={
              stripe.configured
                ? stripe.mode === "live"
                  ? "https://dashboard.stripe.com/"
                  : "https://dashboard.stripe.com/test"
                : null
            }
          />

          <IntegrationTile
            title="Gmail SMTP"
            icon={<Mail aria-hidden />}
            status={smtp.configured ? "connected" : "not-configured"}
            detail={
              smtp.configured ? (smtp.user ?? "Configured") : "Not configured"
            }
            hint={
              smtp.configured
                ? `Leads → ${smtp.leadsInbox}`
                : "Transactional email relay"
            }
            href="https://admin.google.com/"
          />

          <IntegrationTile
            title="Vercel"
            icon={<Globe aria-hidden />}
            status="connected"
            detail={
              vercel.deployed
                ? `${vercel.env ?? "Deployed"}${vercel.region ? ` · ${vercel.region}` : ""}`
                : "Local · deploys to Vercel"
            }
            hint="Hosting · analytics · Speed Insights"
            href="https://vercel.com/dashboard"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <AvailabilityCard initialWorkingHours={initialWorkingHours} />
        <ProfileTitleCard initialTitle={initialTitle} />
      </div>
    </div>
  )
}
