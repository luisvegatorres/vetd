import "server-only"

import type { createClient as createServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>
type InteractionType = Database["public"]["Enums"]["interaction_type"]

// Tagged `source` so CRM-derived rows are distinguishable from Cal.com bookings
// (`source = "cal"`) and any manual log actions we add later.
export const CRM_SOURCE = "crm"

type LogArgs = {
  supabase: SupabaseServerClient
  clientId: string
  loggedBy: string
  type: InteractionType
  title: string
  content?: string | null
  projectId?: string | null
  /**
   * Deterministic identifier that keeps duplicate events (same status toggled
   * twice, rapid form resubmissions) from inflating a rep's activity count.
   * Combines with CRM_SOURCE into the unique partial index
   * interactions_source_source_ref_key.
   */
  sourceRef: string
}

/**
 * Fire-and-forget: failures are logged but do not block the caller's action.
 * The commission/activity data being slightly stale is strictly better than a
 * user-facing error on an otherwise-successful update.
 */
export async function logActivity(args: LogArgs): Promise<void> {
  const { supabase, clientId, loggedBy, type, title, content, projectId, sourceRef } =
    args
  const { error } = await supabase.from("interactions").upsert(
    {
      client_id: clientId,
      logged_by: loggedBy,
      type,
      title,
      content: content ?? null,
      project_id: projectId ?? null,
      source: CRM_SOURCE,
      source_ref: sourceRef,
      occurred_at: new Date().toISOString(),
    },
    { onConflict: "source,source_ref", ignoreDuplicates: true },
  )
  if (error) {
    console.error("[logActivity] failed to log interaction", {
      sourceRef,
      error: error.message,
    })
  }
}

export function sourceRefFor(
  kind: string,
  ...parts: (string | number | null | undefined)[]
): string {
  return [kind, ...parts.filter((p) => p != null && p !== "")].join(":")
}
