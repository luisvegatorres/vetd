import "server-only"

import { NextResponse } from "next/server"

import { syncCalendarForRep } from "@/lib/google/calendar-sync"
import { getGoogleConfig } from "@/lib/google/config"
import { syncGmailForRep } from "@/lib/google/gmail-sync"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Vercel Cron (and similar) send an Authorization header we verify against
// CRON_SECRET. A missing/mismatched secret returns 401 so random probes can't
// hammer the sync endpoint.
export async function GET(request: Request) {
  const config = getGoogleConfig()
  if (!config) {
    return NextResponse.json(
      { ok: false, error: "google_not_configured" },
      { status: 501 },
    )
  }

  if (config.cronSecret) {
    const header = request.headers.get("authorization") ?? ""
    const expected = `Bearer ${config.cronSecret}`
    if (header !== expected) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
    }
  }

  const admin = createAdminClient()
  const { data: integrations, error } = await admin
    .from("rep_integrations")
    .select("rep_id, scopes")
    .eq("provider", "google")
  if (error) {
    console.error("[cron sync-google] list failed", error)
    return NextResponse.json({ ok: false, error: "list_failed" }, { status: 500 })
  }

  const results: Array<{
    repId: string
    calendar?: { matched: number; scanned: number } | { error: string }
    gmail?: { matched: number; scanned: number } | { error: string }
  }> = []

  for (const row of integrations ?? []) {
    const scopes = new Set(row.scopes)
    const out: (typeof results)[number] = { repId: row.rep_id }
    const errors: string[] = []

    if (scopes.has("https://www.googleapis.com/auth/calendar.readonly")) {
      try {
        const r = await syncCalendarForRep(admin, row.rep_id)
        out.calendar = { matched: r.matched, scanned: r.scanned }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`[cron sync-google] calendar failed for ${row.rep_id}`, err)
        out.calendar = { error: message }
        errors.push(`calendar: ${message}`)
      }
    }

    if (scopes.has("https://www.googleapis.com/auth/gmail.readonly")) {
      try {
        const r = await syncGmailForRep(admin, row.rep_id)
        out.gmail = { matched: r.matched, scanned: r.scanned }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`[cron sync-google] gmail failed for ${row.rep_id}`, err)
        out.gmail = { error: message }
        errors.push(`gmail: ${message}`)
      }
    }

    await admin
      .from("rep_integrations")
      .update({
        last_synced_at: new Date().toISOString(),
        last_sync_error: errors.length > 0 ? errors.join("; ") : null,
      })
      .eq("rep_id", row.rep_id)
      .eq("provider", "google")

    results.push(out)
  }

  return NextResponse.json({ ok: true, results })
}
