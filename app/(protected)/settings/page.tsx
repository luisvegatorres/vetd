import {
  Activity,
  Calendar,
  CalendarCheck,
  CreditCard,
  Database,
  Gauge,
  Globe,
  Inbox,
  KeyRound,
  Receipt,
  Send,
  Shield,
  Webhook,
} from "lucide-react"

import { AvailabilityCard } from "@/components/settings/availability-card"
import { GoogleIntegrationCard } from "@/components/settings/google-integration-card"
import { IntegrationCard } from "@/components/settings/integration-card"
import { isGoogleConfigured } from "@/lib/google/config"
import {
  getCalcomStatus,
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
  if (auth.user) {
    const { data } = await supabase
      .from("profiles")
      .select("working_hours")
      .eq("id", auth.user.id)
      .maybeSingle()
    initialWorkingHours = parseWorkingHours(data?.working_hours)
  }

  const errorReason =
    params.google === "error" ? (params.reason ?? "unknown") : undefined

  const stripe = getStripeStatus()
  const calcom = getCalcomStatus()
  const smtp = getSmtpStatus()
  const supabaseStatus = getSupabaseStatus()
  const vercel = getVercelStatus()

  return (
    <div className="space-y-6">
      <GoogleIntegrationCard
        configured={configured}
        connection={connection}
        errorReason={errorReason}
      />

      <IntegrationCard
        title="Supabase"
        description="Postgres database, authentication, row-level security, and storage powering the entire CRM."
        status={supabaseStatus.configured ? "connected" : "not-configured"}
        meta={
          supabaseStatus.configured
            ? [
                {
                  label: "Project ref",
                  value: supabaseStatus.projectRef ?? "—",
                },
                {
                  label: "URL",
                  value: supabaseStatus.url ? (
                    <span className="break-all font-mono text-xs">
                      {supabaseStatus.url}
                    </span>
                  ) : (
                    "—"
                  ),
                },
              ]
            : undefined
        }
        capabilities={[
          {
            enabled: supabaseStatus.configured,
            icon: <Database aria-hidden />,
            label: "Postgres — CRM data",
          },
          {
            enabled: supabaseStatus.configured,
            icon: <Shield aria-hidden />,
            label: "Auth — login & RLS",
          },
          {
            enabled: supabaseStatus.serviceRoleConfigured,
            icon: <KeyRound aria-hidden />,
            label: "Service role — admin ops",
          },
        ]}
        footer={
          supabaseStatus.configured
            ? undefined
            : "Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, and SUPABASE_SERVICE_ROLE_KEY in the deployment environment."
        }
        actions={
          supabaseStatus.projectRef ? (
            <a
              href={`https://supabase.com/dashboard/project/${supabaseStatus.projectRef}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm underline-offset-4 hover:underline"
            >
              Open Supabase dashboard →
            </a>
          ) : null
        }
      />

      <IntegrationCard
        title="Stripe"
        description="Hosted Checkout, recurring subscriptions, and webhook-driven commission ledger updates."
        status={
          stripe.configured && stripe.webhookConfigured
            ? "connected"
            : stripe.configured
              ? "error"
              : "not-configured"
        }
        meta={
          stripe.configured
            ? [
                {
                  label: "Mode",
                  value:
                    stripe.mode === "live" ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Live
                      </span>
                    ) : stripe.mode === "test" ? (
                      <span>Test</span>
                    ) : (
                      "Unknown"
                    ),
                },
                {
                  label: "Webhook signing",
                  value: stripe.webhookConfigured
                    ? "Configured"
                    : "Missing STRIPE_WEBHOOK_SECRET",
                },
              ]
            : undefined
        }
        capabilities={[
          {
            enabled: stripe.configured,
            icon: <CreditCard aria-hidden />,
            label: "Checkout — one-time projects",
          },
          {
            enabled: stripe.presencePriceConfigured,
            icon: <Receipt aria-hidden />,
            label: "Plan — Presence",
          },
          {
            enabled: stripe.growthPriceConfigured,
            icon: <Receipt aria-hidden />,
            label: "Plan — Growth",
          },
          {
            enabled: stripe.webhookConfigured,
            icon: <Webhook aria-hidden />,
            label: "Webhook — invoice & subscription events",
          },
        ]}
        error={
          stripe.configured && !stripe.webhookConfigured
            ? "STRIPE_WEBHOOK_SECRET is missing — invoice events won't update the commission ledger."
            : null
        }
        footer={
          stripe.configured
            ? undefined
            : "Set STRIPE_SECRET_KEY (sk_test_… or sk_live_…), STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID_PRESENCE, and STRIPE_PRICE_ID_GROWTH."
        }
        actions={
          stripe.configured ? (
            <a
              href={
                stripe.mode === "live"
                  ? "https://dashboard.stripe.com/"
                  : "https://dashboard.stripe.com/test"
              }
              target="_blank"
              rel="noreferrer"
              className="text-sm underline-offset-4 hover:underline"
            >
              Open Stripe dashboard →
            </a>
          ) : null
        }
      />

      <IntegrationCard
        title="Cal.com"
        description="Discovery-call scheduling. Webhooks upsert bookings into client interactions automatically."
        status={
          calcom.webhookConfigured
            ? "connected"
            : calcom.bookingLinkConfigured
              ? "error"
              : "not-configured"
        }
        meta={[
          {
            label: "Webhook signing",
            value: calcom.webhookConfigured
              ? "Configured"
              : "Missing CAL_WEBHOOK_SECRET",
          },
          {
            label: "Booking link",
            value: calcom.bookingLink ? (
              <span className="truncate font-mono text-xs">
                {calcom.bookingLink}
              </span>
            ) : (
              "Not set"
            ),
          },
        ]}
        capabilities={[
          {
            enabled: calcom.webhookConfigured,
            icon: <CalendarCheck aria-hidden />,
            label: "Bookings — created · rescheduled · cancelled",
          },
          {
            enabled: calcom.bookingLinkConfigured,
            icon: <Calendar aria-hidden />,
            label: "Marketing CTA — discovery call",
          },
        ]}
        error={
          !calcom.webhookConfigured
            ? "Set CAL_WEBHOOK_SECRET (must match the value in the Cal.com webhook config) to enable HMAC verification."
            : null
        }
        actions={
          <a
            href="https://app.cal.com/event-types"
            target="_blank"
            rel="noreferrer"
            className="text-sm underline-offset-4 hover:underline"
          >
            Open Cal.com dashboard →
          </a>
        }
      />

      <IntegrationCard
        title="Gmail SMTP relay"
        description="Transactional email via Google Workspace. Powers contact-form notifications and outbound CRM mail."
        status={smtp.configured ? "connected" : "not-configured"}
        meta={
          smtp.configured
            ? [
                {
                  label: "Host",
                  value: (
                    <span className="font-mono text-xs">
                      {smtp.host}:{smtp.port}
                    </span>
                  ),
                },
                {
                  label: "Authenticated as",
                  value: smtp.user ?? "—",
                },
                {
                  label: "Leads inbox",
                  value: smtp.leadsInbox,
                  span: "full",
                },
              ]
            : undefined
        }
        capabilities={[
          {
            enabled: smtp.configured,
            icon: <Send aria-hidden />,
            label: "Outbound — transactional email",
          },
          {
            enabled: smtp.configured,
            icon: <Inbox aria-hidden />,
            label: "Routing — leads@ notifications",
          },
        ]}
        footer={
          smtp.configured
            ? undefined
            : "Set GMAIL_SMTP_HOST, GMAIL_SMTP_USER, GMAIL_SMTP_PASSWORD (Google app password) and optionally LEADS_NOTIFICATION_EMAIL."
        }
        actions={
          <a
            href="https://admin.google.com/"
            target="_blank"
            rel="noreferrer"
            className="text-sm underline-offset-4 hover:underline"
          >
            Open Workspace admin →
          </a>
        }
      />

      <IntegrationCard
        title="Vercel"
        description="Hosting, analytics, and Speed Insights for the production deployment."
        status={vercel.deployed ? "connected" : "not-connected"}
        meta={
          vercel.deployed
            ? [
                {
                  label: "Environment",
                  value: vercel.env ?? "—",
                },
                {
                  label: "Region",
                  value: vercel.region ?? "—",
                },
                {
                  label: "App URL",
                  value: vercel.appUrl ? (
                    <span className="break-all font-mono text-xs">
                      {vercel.appUrl}
                    </span>
                  ) : (
                    "—"
                  ),
                  span: "full",
                },
              ]
            : [
                {
                  label: "Environment",
                  value: "Local development",
                  span: "full",
                },
              ]
        }
        capabilities={[
          {
            enabled: vercel.analyticsEnabled,
            icon: <Activity aria-hidden />,
            label: "Analytics — page views",
          },
          {
            enabled: vercel.speedInsightsEnabled,
            icon: <Gauge aria-hidden />,
            label: "Speed Insights — Core Web Vitals",
          },
          {
            enabled: vercel.deployed,
            icon: <Globe aria-hidden />,
            label: "Hosting — production",
          },
        ]}
        footer={
          vercel.deployed
            ? undefined
            : "Vercel-only details (region, environment) appear when this build runs on Vercel infrastructure."
        }
        actions={
          <a
            href="https://vercel.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="text-sm underline-offset-4 hover:underline"
          >
            Open Vercel dashboard →
          </a>
        }
      />

      <AvailabilityCard initialWorkingHours={initialWorkingHours} />
    </div>
  )
}
