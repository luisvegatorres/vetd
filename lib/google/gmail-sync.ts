import "server-only"

import type { createAdminClient } from "@/lib/supabase/admin"
import { getAccessTokenForRep } from "@/lib/google/tokens"

type AdminClient = ReturnType<typeof createAdminClient>

const GMAIL_LIST_ENDPOINT =
  "https://gmail.googleapis.com/gmail/v1/users/me/messages"

type GmailListResponse = {
  messages?: { id: string; threadId: string }[]
  nextPageToken?: string
  resultSizeEstimate?: number
}

type GmailHeader = { name: string; value: string }

type GmailMessage = {
  id: string
  threadId: string
  internalDate?: string
  snippet?: string
  labelIds?: string[]
  payload?: {
    headers?: GmailHeader[]
  }
}

export type GmailSyncResult = {
  matched: number
  scanned: number
}

/**
 * Pulls the rep's recent Gmail messages, matches against clients.email on
 * either side of the conversation (sender or any recipient), and writes
 * `email` interactions.
 *
 * MVP uses a time-bounded list query (`newer_than:2d`). Once this is live
 * at scale we should swap to the Gmail History API with a stored startHistoryId
 * for true incremental sync; until then the (source, source_ref) unique index
 * keeps us idempotent so time-based overlap is harmless.
 */
export async function syncGmailForRep(
  supabase: AdminClient,
  repId: string,
): Promise<GmailSyncResult> {
  const accessToken = await getAccessTokenForRep(supabase, repId)

  // Build a single search query that picks up both sent and received mail
  // with any of our clients' email addresses on any line. Gmail's `newer_than`
  // uses shorthand days.
  const clientEmailMap = await buildClientEmailMap(supabase)
  if (clientEmailMap.size === 0) return { matched: 0, scanned: 0 }

  // Gmail query length is bounded (~4KB). Chunk aggressively to stay safe.
  const allEmails = Array.from(clientEmailMap.keys())
  const chunks: string[][] = []
  for (let i = 0; i < allEmails.length; i += 25) {
    chunks.push(allEmails.slice(i, i + 25))
  }

  const seen = new Set<string>()
  const messages: GmailMessage[] = []

  for (const chunk of chunks) {
    const expr = chunk.map((e) => `(from:${e} OR to:${e})`).join(" OR ")
    const query = `${expr} newer_than:2d`
    let pageToken: string | null = null
    do {
      const params = new URLSearchParams({
        q: query,
        maxResults: "100",
        ...(pageToken ? { pageToken } : {}),
      })
      const res = await fetch(`${GMAIL_LIST_ENDPOINT}?${params.toString()}`, {
        headers: { authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) {
        throw new Error(
          `Gmail list failed: ${res.status} ${await res.text()}`,
        )
      }
      const body = (await res.json()) as GmailListResponse
      for (const m of body.messages ?? []) {
        if (seen.has(m.id)) continue
        seen.add(m.id)
        // Pull headers for this message (metadata-only costs less quota).
        const msg = await fetchMessageMetadata(accessToken, m.id)
        if (msg) messages.push(msg)
      }
      pageToken = body.nextPageToken ?? null
    } while (pageToken)
  }

  let matched = 0
  for (const msg of messages) {
    const headers = headerMap(msg.payload?.headers)
    const subject = headers.get("subject")?.slice(0, 250) || "(no subject)"
    const from = extractFirstEmail(headers.get("from"))
    const to = [
      ...extractAllEmails(headers.get("to")),
      ...extractAllEmails(headers.get("cc")),
    ]
    const candidates = [from, ...to].filter((e): e is string => !!e)
    const matchedClientId = candidates
      .map((e) => clientEmailMap.get(e))
      .find((id): id is string => !!id)
    if (!matchedClientId) continue

    const occurredAt = msg.internalDate
      ? new Date(Number(msg.internalDate)).toISOString()
      : new Date().toISOString()

    const { error } = await supabase.from("interactions").upsert(
      {
        client_id: matchedClientId,
        logged_by: repId,
        type: "email",
        title: subject,
        content: msg.snippet?.slice(0, 1000) ?? null,
        source: "gmail",
        source_ref: msg.id,
        occurred_at: occurredAt,
      },
      { onConflict: "source,source_ref", ignoreDuplicates: false },
    )
    if (error) {
      console.error("[gmail sync] upsert failed", error)
      continue
    }
    matched += 1
  }

  return { matched, scanned: messages.length }
}

async function fetchMessageMetadata(
  accessToken: string,
  id: string,
): Promise<GmailMessage | null> {
  // Gmail accepts repeated `metadataHeaders` params — URLSearchParams dedupes
  // keys, so build the query string manually.
  const url =
    `${GMAIL_LIST_ENDPOINT}/${id}?format=metadata` +
    "&metadataHeaders=From&metadataHeaders=To" +
    "&metadataHeaders=Cc&metadataHeaders=Subject&metadataHeaders=Date"

  const res = await fetch(url, {
    headers: { authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    console.warn(`[gmail sync] message ${id} metadata failed: ${res.status}`)
    return null
  }
  return (await res.json()) as GmailMessage
}

function headerMap(headers: GmailHeader[] | undefined): Map<string, string> {
  const map = new Map<string, string>()
  for (const h of headers ?? []) {
    map.set(h.name.toLowerCase(), h.value)
  }
  return map
}

const EMAIL_RE = /([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/gi

function extractFirstEmail(value: string | undefined): string | null {
  if (!value) return null
  const m = value.match(EMAIL_RE)
  return m?.[0]?.toLowerCase() ?? null
}

function extractAllEmails(value: string | undefined): string[] {
  if (!value) return []
  const m = value.match(EMAIL_RE)
  return (m ?? []).map((e) => e.toLowerCase())
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
