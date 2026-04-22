import "server-only"

import type { createAdminClient } from "@/lib/supabase/admin"
import { getAccessTokenForRep } from "@/lib/google/tokens"
import type { Json } from "@/lib/supabase/types"

type AdminClient = ReturnType<typeof createAdminClient>

const CALENDAR_LIST_ENDPOINT =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events"

type GcalAttendee = {
  email?: string
  self?: boolean
  organizer?: boolean
  responseStatus?: string
}

type GcalEvent = {
  id: string
  status?: string
  summary?: string
  description?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
  attendees?: GcalAttendee[]
  organizer?: { email?: string; self?: boolean }
  creator?: { email?: string; self?: boolean }
  htmlLink?: string
}

type GcalListResponse = {
  items?: GcalEvent[]
  nextPageToken?: string
  nextSyncToken?: string
}

export type CalendarSyncResult = {
  matched: number
  scanned: number
  nextSyncToken: string | null
}

/**
 * Pulls events from the rep's primary calendar, matches attendees against
 * clients.email, and writes `meeting` interactions. Uses Google's syncToken
 * cursor for incremental syncs; first run pulls the trailing 14 days.
 *
 * Idempotent via (source='gcal', source_ref=eventId).
 */
export async function syncCalendarForRep(
  supabase: AdminClient,
  repId: string,
): Promise<CalendarSyncResult> {
  const accessToken = await getAccessTokenForRep(supabase, repId)

  const { data: integration } = await supabase
    .from("rep_integrations")
    .select("sync_state")
    .eq("rep_id", repId)
    .eq("provider", "google")
    .maybeSingle()

  const syncState = (integration?.sync_state ?? {}) as Record<string, unknown>
  const priorSyncToken =
    typeof syncState.calendarNextSyncToken === "string"
      ? syncState.calendarNextSyncToken
      : null

  // Build the seed query. With a syncToken, most query params are disallowed.
  const baseParams: Record<string, string> = priorSyncToken
    ? { syncToken: priorSyncToken }
    : {
        timeMin: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        singleEvents: "true",
        showDeleted: "false",
      }

  const events: GcalEvent[] = []
  let nextSyncToken: string | null = null
  let pageToken: string | null = null
  try {
    do {
      const params = new URLSearchParams({
        ...baseParams,
        maxResults: "250",
        ...(pageToken ? { pageToken } : {}),
      })
      const res = await fetch(
        `${CALENDAR_LIST_ENDPOINT}?${params.toString()}`,
        { headers: { authorization: `Bearer ${accessToken}` } },
      )
      if (res.status === 410) {
        // Sync token expired — force a full reseed next call.
        await supabase
          .from("rep_integrations")
          .update({ sync_state: { ...syncState, calendarNextSyncToken: null } })
          .eq("rep_id", repId)
          .eq("provider", "google")
        return { matched: 0, scanned: 0, nextSyncToken: null }
      }
      if (!res.ok) {
        throw new Error(
          `Calendar list failed: ${res.status} ${await res.text()}`,
        )
      }
      const body = (await res.json()) as GcalListResponse
      if (body.items) events.push(...body.items)
      pageToken = body.nextPageToken ?? null
      if (!pageToken && body.nextSyncToken) nextSyncToken = body.nextSyncToken
    } while (pageToken)
  } catch (err) {
    throw err instanceof Error ? err : new Error(String(err))
  }

  // Build email → client_id map from owned-email matches. We fetch all
  // clients with an email once per sync — the n of clients is small enough
  // that a hash-join in memory beats n round-trips.
  const clientEmailMap = await buildClientEmailMap(supabase)

  let matched = 0
  for (const event of events) {
    if (event.status === "cancelled") continue
    const startIso = event.start?.dateTime ?? event.start?.date
    if (!startIso) continue

    // Find the first attendee email that matches one of our clients.
    const attendeeEmails = (event.attendees ?? [])
      .map((a) => a.email?.toLowerCase().trim())
      .filter((e): e is string => !!e)
    const matchedClientId = attendeeEmails
      .map((e) => clientEmailMap.get(e))
      .find((id): id is string => !!id)

    if (!matchedClientId) continue

    const title = event.summary?.trim() || "Meeting"
    const occurredAt = new Date(startIso).toISOString()

    const { error } = await supabase.from("interactions").upsert(
      {
        client_id: matchedClientId,
        logged_by: repId,
        type: "meeting",
        title,
        content: event.description?.slice(0, 2000) ?? null,
        source: "gcal",
        source_ref: event.id,
        source_payload: event as unknown as Json,
        occurred_at: occurredAt,
      },
      { onConflict: "source,source_ref", ignoreDuplicates: false },
    )
    if (error) {
      console.error("[calendar sync] upsert failed", error)
      continue
    }
    matched += 1
  }

  if (nextSyncToken) {
    await supabase
      .from("rep_integrations")
      .update({
        sync_state: { ...syncState, calendarNextSyncToken: nextSyncToken },
      })
      .eq("rep_id", repId)
      .eq("provider", "google")
  }

  return { matched, scanned: events.length, nextSyncToken }
}

async function buildClientEmailMap(
  supabase: AdminClient,
): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const { data, error } = await supabase
    .from("clients")
    .select("id, email")
    .not("email", "is", null)
  if (error) throw error
  for (const row of data ?? []) {
    if (!row.email) continue
    map.set(row.email.toLowerCase().trim(), row.id)
  }
  return map
}
