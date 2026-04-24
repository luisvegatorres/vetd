import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import { getAccessTokenForRep } from "@/lib/google/tokens"

const FREE_BUSY_ENDPOINT = "https://www.googleapis.com/calendar/v3/freeBusy"

export type BusyInterval = { start: string; end: string }

export type CalendarBusyResult =
  | { ok: true; busy: BusyInterval[] }
  | { ok: false; error: string }

/**
 * Queries the rep's primary calendar for busy intervals between two instants.
 * Uses the freeBusy API (available under the existing calendar.readonly
 * scope) — returns only start/end of busy blocks, no event details.
 */
export async function getRepCalendarBusy(input: {
  repId: string
  timeMin: string
  timeMax: string
  timeZone?: string
}): Promise<CalendarBusyResult> {
  const admin = createAdminClient()

  let accessToken: string
  try {
    accessToken = await getAccessTokenForRep(admin, input.repId)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: message }
  }

  const response = await fetch(FREE_BUSY_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin: input.timeMin,
      timeMax: input.timeMax,
      timeZone: input.timeZone,
      items: [{ id: "primary" }],
    }),
  })

  if (!response.ok) {
    const bodyText = await response.text()
    return {
      ok: false,
      error: `freeBusy ${response.status}: ${bodyText.slice(0, 300)}`,
    }
  }

  const data = (await response.json()) as {
    calendars?: Record<string, { busy?: BusyInterval[]; errors?: unknown }>
  }
  const primary = data.calendars?.primary
  if (!primary) return { ok: true, busy: [] }
  return { ok: true, busy: primary.busy ?? [] }
}
