import "server-only"

import { NextResponse } from "next/server"

import { INSTAGRAM_PROVIDER, getInstagramConfig } from "@/lib/instagram/config"
import { refreshLongToken } from "@/lib/instagram/oauth"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Long-lived Instagram tokens last 60 days. We refresh if a token expires
// within 7 days; refresh extends the token by another 60 days. The check is
// idempotent, so the cron can run weekly without churn.
const REFRESH_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

export async function GET(request: Request) {
  const config = getInstagramConfig()
  if (!config) {
    return NextResponse.json(
      { ok: false, error: "instagram_not_configured" },
      { status: 501 },
    )
  }

  if (config.cronSecret) {
    const header = request.headers.get("authorization") ?? ""
    const expected = `Bearer ${config.cronSecret}`
    if (header !== expected) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      )
    }
  }

  const admin = createAdminClient()
  const { data: row, error } = await admin
    .from("app_integrations")
    .select("id, access_token, token_expires_at")
    .eq("provider", INSTAGRAM_PROVIDER)
    .maybeSingle()
  if (error) {
    console.error("[cron refresh-instagram] read failed", error)
    return NextResponse.json(
      { ok: false, error: "read_failed" },
      { status: 500 },
    )
  }
  if (!row) {
    return NextResponse.json({ ok: true, status: "no_connection" })
  }

  const expiresAt = new Date(row.token_expires_at).getTime()
  const refreshAt = expiresAt - REFRESH_WINDOW_MS
  if (Date.now() < refreshAt) {
    return NextResponse.json({
      ok: true,
      status: "fresh",
      expiresAt: row.token_expires_at,
    })
  }

  let refreshed
  try {
    refreshed = await refreshLongToken(row.access_token)
  } catch (err) {
    console.error("[cron refresh-instagram] refresh failed", err)
    return NextResponse.json(
      { ok: false, error: "refresh_failed" },
      { status: 500 },
    )
  }

  const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000)
  const { error: updateError } = await admin
    .from("app_integrations")
    .update({
      access_token: refreshed.access_token,
      token_expires_at: newExpiry.toISOString(),
      last_refreshed_at: new Date().toISOString(),
    })
    .eq("id", row.id)
  if (updateError) {
    console.error("[cron refresh-instagram] update failed", updateError)
    return NextResponse.json(
      { ok: false, error: "update_failed" },
      { status: 500 },
    )
  }

  return NextResponse.json({
    ok: true,
    status: "refreshed",
    expiresAt: newExpiry.toISOString(),
  })
}
