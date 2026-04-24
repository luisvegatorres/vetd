import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import {
  getAccessTokenForRep,
  hasCalendarEventsScope,
} from "@/lib/google/tokens"

const CALENDAR_EVENT_ENDPOINT =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events"

export type CancelMeetingResult =
  | { ok: true }
  | { ok: false; error: string; code?: "scope_missing" | "auth_expired" }

/**
 * Deletes the event from the rep's primary calendar. Google emails
 * cancellations to attendees when sendUpdates=all.
 *
 * Treats 404/410 as success — the event is gone either way, so callers
 * can clean up local state without error.
 */
export async function cancelMeetingAsRep(input: {
  repId: string
  eventId: string
}): Promise<CancelMeetingResult> {
  const admin = createAdminClient()

  if (!(await hasCalendarEventsScope(admin, input.repId))) {
    return {
      ok: false,
      error:
        "Calendar event changes aren't enabled for your account yet. Reconnect Google from Settings to grant access.",
      code: "scope_missing",
    }
  }

  let accessToken: string
  try {
    accessToken = await getAccessTokenForRep(admin, input.repId)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: message, code: "auth_expired" }
  }

  const params = new URLSearchParams({ sendUpdates: "all" })
  const response = await fetch(
    `${CALENDAR_EVENT_ENDPOINT}/${encodeURIComponent(
      input.eventId,
    )}?${params.toString()}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  )

  if (response.ok || response.status === 204) return { ok: true }
  if (response.status === 404 || response.status === 410) return { ok: true }

  const bodyText = await response.text()
  if (response.status === 401 || response.status === 403) {
    return {
      ok: false,
      error:
        "Google rejected the cancellation (auth or scope issue). Reconnect Google from Settings.",
      code: "scope_missing",
    }
  }
  return {
    ok: false,
    error: `Calendar API error ${response.status}: ${bodyText.slice(0, 500)}`,
  }
}
