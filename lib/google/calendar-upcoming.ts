import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import { getAccessTokenForRep } from "@/lib/google/tokens"

const CALENDAR_LIST_ENDPOINT =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events"

const CALENDAR_READONLY_SCOPE =
  "https://www.googleapis.com/auth/calendar.readonly"

export type UpcomingEvent = {
  id: string
  title: string
  description: string | null
  startsAt: string
  durationMinutes: number
  /** Link to open the event in Google Calendar. */
  htmlLink: string
  joinUrl: string | null
  hasMeetLink: boolean
  attendee: { name: string; email: string | null }
  client: { id: string; name: string; email: string | null } | null
}

export type UpcomingEventsResult =
  | { status: "ok"; events: UpcomingEvent[] }
  | { status: "not_connected" }
  | { status: "error"; message: string }

type GcalAttendee = {
  email?: string
  displayName?: string
  self?: boolean
  organizer?: boolean
  responseStatus?: string
}

type GcalEvent = {
  id: string
  status?: string
  summary?: string
  description?: string
  htmlLink?: string
  start?: { dateTime?: string; date?: string; timeZone?: string }
  end?: { dateTime?: string; date?: string; timeZone?: string }
  attendees?: GcalAttendee[]
  organizer?: { email?: string; displayName?: string; self?: boolean }
  hangoutLink?: string
  location?: string
  conferenceData?: {
    entryPoints?: { entryPointType?: string; uri?: string }[]
  }
}

type GcalListResponse = { items?: GcalEvent[] }

type AdminClient = ReturnType<typeof createAdminClient>

/**
 * Live-fetches the next N events from the rep's primary Google Calendar
 * (timed events only — all-day entries are skipped). Matches attendee
 * emails against `clients.email` to populate `clientId` when possible;
 * meetings without a matching client still appear.
 *
 * Used by the dashboard's NEXT UP card so scheduled meetings show up
 * immediately, without waiting for the daily calendar-sync cron.
 */
export async function listUpcomingEventsForRep(
  repId: string,
  limit = 3,
): Promise<UpcomingEventsResult> {
  const admin = createAdminClient()

  const { data: integration } = await admin
    .from("rep_integrations")
    .select("scopes, google_email")
    .eq("rep_id", repId)
    .eq("provider", "google")
    .maybeSingle()

  if (!integration) return { status: "not_connected" }
  if (!integration.scopes?.includes(CALENDAR_READONLY_SCOPE)) {
    return { status: "not_connected" }
  }

  let accessToken: string
  try {
    accessToken = await getAccessTokenForRep(admin, repId)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { status: "error", message }
  }

  const repEmail = integration.google_email?.toLowerCase().trim() ?? null

  const params = new URLSearchParams({
    timeMin: new Date().toISOString(),
    maxResults: String(Math.max(1, Math.min(20, limit))),
    singleEvents: "true",
    orderBy: "startTime",
    showDeleted: "false",
  })

  const res = await fetch(`${CALENDAR_LIST_ENDPOINT}?${params.toString()}`, {
    headers: { authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const body = await res.text()
    return {
      status: "error",
      message: `Calendar list ${res.status}: ${body.slice(0, 300)}`,
    }
  }

  const body = (await res.json()) as GcalListResponse
  const rawEvents = (body.items ?? [])
    .filter((e) => e.status !== "cancelled")
    .filter((e) => !!e.start?.dateTime)

  const clientLookup = await buildClientLookup(admin)

  const events: UpcomingEvent[] = rawEvents.map((event) => {
    const startsAt = new Date(event.start!.dateTime!).toISOString()
    const endIso = event.end?.dateTime ?? null
    const durationMinutes = endIso
      ? Math.max(
          5,
          Math.round(
            (new Date(endIso).getTime() - new Date(startsAt).getTime()) /
              60_000,
          ),
        )
      : 30

    const videoEntry = event.conferenceData?.entryPoints?.find(
      (ep) => ep.entryPointType === "video",
    )
    const hangoutLink =
      event.hangoutLink ?? videoEntry?.uri ?? null
    const joinUrl =
      hangoutLink ??
      (event.location?.startsWith("http") ? event.location : null)

    const others = (event.attendees ?? []).filter((a) => {
      if (a.self) return false
      if (!a.email) return false
      if (repEmail && a.email.toLowerCase().trim() === repEmail) return false
      return true
    })
    const pick: { email?: string; displayName?: string } | null =
      others[0] ??
      (event.organizer && !event.organizer.self ? event.organizer : null)

    const attendeeEmail = pick?.email ?? null
    const attendeeName =
      pick?.displayName?.trim() || attendeeEmail || "Unknown"

    const matchedClient = attendeeEmail
      ? (clientLookup.get(attendeeEmail.toLowerCase().trim()) ?? null)
      : null

    return {
      id: event.id,
      title: event.summary?.trim() || "Meeting",
      description: event.description?.trim() || null,
      startsAt,
      durationMinutes,
      htmlLink: event.htmlLink ?? "",
      joinUrl: joinUrl ?? null,
      hasMeetLink: !!hangoutLink,
      attendee: { name: attendeeName, email: attendeeEmail },
      client: matchedClient,
    }
  })

  return { status: "ok", events }
}

async function buildClientLookup(
  admin: AdminClient,
): Promise<Map<string, { id: string; name: string; email: string | null }>> {
  const map = new Map<
    string,
    { id: string; name: string; email: string | null }
  >()
  const { data } = await admin
    .from("clients")
    .select("id, name, email")
    .not("email", "is", null)
  for (const row of data ?? []) {
    if (!row.email) continue
    map.set(row.email.toLowerCase().trim(), {
      id: row.id,
      name: row.name,
      email: row.email,
    })
  }
  return map
}
