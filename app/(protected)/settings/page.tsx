import { AvailabilityCard } from "@/components/settings/availability-card"
import { GoogleIntegrationCard } from "@/components/settings/google-integration-card"
import { isGoogleConfigured } from "@/lib/google/config"
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

  return (
    <div className="space-y-6">
      <GoogleIntegrationCard
        configured={configured}
        connection={connection}
        errorReason={errorReason}
      />
      <AvailabilityCard initialWorkingHours={initialWorkingHours} />
    </div>
  )
}
