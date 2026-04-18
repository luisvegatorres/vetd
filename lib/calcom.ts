import "server-only"

import { createClient } from "@/lib/supabase/server"

export type CalBooking = {
  id: string
  title: string
  startsAt: string
  endsAt: string | null
  joinUrl: string | null
  attendee: {
    name: string
    email: string | null
  }
  clientId: string | null
}

export async function getUpcomingBookings(limit = 5): Promise<CalBooking[]> {
  const supabase = await createClient()
  const nowIso = new Date().toISOString()

  const { data, error } = await supabase
    .from("interactions")
    .select(
      `
        id,
        title,
        occurred_at,
        client_id,
        clients ( name, email )
      `,
    )
    .eq("type", "meeting")
    .gte("occurred_at", nowIso)
    .order("occurred_at", { ascending: true })
    .limit(limit)

  if (error || !data) return []

  return data.map((row) => {
    const client = Array.isArray(row.clients) ? row.clients[0] : row.clients
    return {
      id: row.id,
      title: row.title,
      startsAt: row.occurred_at,
      endsAt: null,
      joinUrl: null,
      attendee: {
        name: client?.name ?? "Unknown",
        email: client?.email ?? null,
      },
      clientId: row.client_id,
    }
  })
}
