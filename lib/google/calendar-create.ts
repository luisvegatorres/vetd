import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import {
  getAccessTokenForRep,
  hasCalendarEventsScope,
} from "@/lib/google/tokens"

const CALENDAR_INSERT_ENDPOINT =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events"

export type CreateMeetingAttendee = {
  email: string
  displayName?: string
}

export type CreateMeetingArgs = {
  repId: string
  title: string
  description?: string | null
  /** ISO-8601 start; end is computed from durationMinutes. */
  startAt: string
  durationMinutes: number
  /** IANA zone (e.g. "America/New_York"). Passed through to the Calendar API. */
  timeZone: string
  attendees: CreateMeetingAttendee[]
  /** When true (default), Google generates a Meet link + inserts it in the event. */
  includeMeetLink?: boolean
}

export type CreateMeetingResult =
  | {
      ok: true
      eventId: string
      htmlLink: string
      hangoutLink: string | null
      startAt: string
      endAt: string
    }
  | { ok: false; error: string; code?: "scope_missing" | "auth_expired" }

export async function createMeetingAsRep(
  args: CreateMeetingArgs,
): Promise<CreateMeetingResult> {
  const admin = createAdminClient()

  if (!(await hasCalendarEventsScope(admin, args.repId))) {
    return {
      ok: false,
      error:
        "Calendar event creation isn't enabled for your account yet. Reconnect Google from Settings to grant access.",
      code: "scope_missing",
    }
  }

  let accessToken: string
  try {
    accessToken = await getAccessTokenForRep(admin, args.repId)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: message, code: "auth_expired" }
  }

  const start = new Date(args.startAt)
  if (Number.isNaN(start.getTime())) {
    return { ok: false, error: "Invalid start time" }
  }
  const end = new Date(start.getTime() + args.durationMinutes * 60_000)

  const includeMeet = args.includeMeetLink ?? true
  const body: Record<string, unknown> = {
    summary: args.title,
    description: args.description || undefined,
    start: { dateTime: start.toISOString(), timeZone: args.timeZone },
    end: { dateTime: end.toISOString(), timeZone: args.timeZone },
    attendees: args.attendees.map((a) => ({
      email: a.email,
      displayName: a.displayName,
    })),
    reminders: { useDefault: true },
  }
  if (includeMeet) {
    body.conferenceData = {
      createRequest: {
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    }
  }

  const params = new URLSearchParams({
    sendUpdates: "all",
    ...(includeMeet ? { conferenceDataVersion: "1" } : {}),
  })

  const response = await fetch(
    `${CALENDAR_INSERT_ENDPOINT}?${params.toString()}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  )

  if (!response.ok) {
    const bodyText = await response.text()
    if (response.status === 401 || response.status === 403) {
      return {
        ok: false,
        error:
          "Google rejected the calendar insert (auth or scope issue). Reconnect Google from Settings.",
        code: "scope_missing",
      }
    }
    return {
      ok: false,
      error: `Calendar API error ${response.status}: ${bodyText.slice(0, 500)}`,
    }
  }

  const data = (await response.json()) as {
    id?: string
    htmlLink?: string
    hangoutLink?: string
    conferenceData?: {
      entryPoints?: { entryPointType?: string; uri?: string }[]
    }
  }
  if (!data.id || !data.htmlLink) {
    return { ok: false, error: "Calendar returned an incomplete event" }
  }
  const videoEntry = data.conferenceData?.entryPoints?.find(
    (e) => e.entryPointType === "video",
  )
  const hangoutLink = data.hangoutLink ?? videoEntry?.uri ?? null

  return {
    ok: true,
    eventId: data.id,
    htmlLink: data.htmlLink,
    hangoutLink,
    startAt: start.toISOString(),
    endAt: end.toISOString(),
  }
}
