import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import {
  getAccessTokenForRep,
  hasCalendarEventsScope,
} from "@/lib/google/tokens"

const CALENDAR_EVENT_ENDPOINT =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events"

export type UpdateMeetingAttendee = {
  email: string
  displayName?: string
}

export type UpdateMeetingArgs = {
  repId: string
  eventId: string
  title?: string
  description?: string | null
  /** ISO-8601 start; end is computed from durationMinutes. Both must be set together. */
  startAt?: string
  durationMinutes?: number
  timeZone?: string
  /** When provided, replaces the attendee list. Google sends updates to adds/removes. */
  attendees?: UpdateMeetingAttendee[]
  /** When true, adds a Google Meet link if one isn't already attached. Not used to remove one. */
  includeMeetLink?: boolean
}

export type UpdateMeetingResult =
  | {
      ok: true
      eventId: string
      htmlLink: string
      hangoutLink: string | null
      startAt: string
      endAt: string
    }
  | { ok: false; error: string; code?: "scope_missing" | "auth_expired" }

export async function updateMeetingAsRep(
  args: UpdateMeetingArgs,
): Promise<UpdateMeetingResult> {
  const admin = createAdminClient()

  if (!(await hasCalendarEventsScope(admin, args.repId))) {
    return {
      ok: false,
      error:
        "Calendar event changes aren't enabled for your account yet. Reconnect Google from Settings to grant access.",
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

  const body: Record<string, unknown> = {}
  if (typeof args.title === "string") body.summary = args.title
  if (args.description !== undefined) {
    body.description = args.description ?? ""
  }

  let startIso: string | null = null
  let endIso: string | null = null
  if (args.startAt && args.durationMinutes) {
    const start = new Date(args.startAt)
    if (Number.isNaN(start.getTime())) {
      return { ok: false, error: "Invalid start time" }
    }
    const end = new Date(start.getTime() + args.durationMinutes * 60_000)
    startIso = start.toISOString()
    endIso = end.toISOString()
    body.start = { dateTime: startIso, timeZone: args.timeZone }
    body.end = { dateTime: endIso, timeZone: args.timeZone }
  }

  if (args.attendees) {
    body.attendees = args.attendees.map((a) => ({
      email: a.email,
      displayName: a.displayName,
    }))
  }

  const addMeet = args.includeMeetLink === true
  if (addMeet) {
    body.conferenceData = {
      createRequest: {
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    }
  }

  const params = new URLSearchParams({
    sendUpdates: "all",
    ...(addMeet ? { conferenceDataVersion: "1" } : {}),
  })

  const response = await fetch(
    `${CALENDAR_EVENT_ENDPOINT}/${encodeURIComponent(
      args.eventId,
    )}?${params.toString()}`,
    {
      method: "PATCH",
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
          "Google rejected the update (auth or scope issue). Reconnect Google from Settings.",
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
    start?: { dateTime?: string }
    end?: { dateTime?: string }
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
    startAt: data.start?.dateTime ?? startIso ?? args.startAt ?? "",
    endAt: data.end?.dateTime ?? endIso ?? "",
  }
}
