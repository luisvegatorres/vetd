import "server-only"

import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { X_PROVIDER, getXConfig } from "@/lib/x/config"
import { refreshAccessToken } from "@/lib/x/oauth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const REFRESH_WITHIN_MS = 30 * 60 * 1000

export async function GET(request: Request) {
  const config = getXConfig()
  if (!config) {
    return NextResponse.json(
      { ok: false, error: "x_not_configured" },
      { status: 501 }
    )
  }
  if (!config.cronSecret) {
    return NextResponse.json(
      { ok: false, error: "cron_secret_missing" },
      { status: 501 }
    )
  }

  const auth = request.headers.get("authorization")
  if (auth !== `Bearer ${config.cronSecret}`) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    )
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("app_integrations")
    .select("access_token, refresh_token, token_expires_at")
    .eq("provider", X_PROVIDER)
    .maybeSingle()

  if (error) {
    console.error("[cron refresh-x] read failed", error)
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    )
  }
  if (!data)
    return NextResponse.json({
      ok: true,
      refreshed: false,
      reason: "not_connected",
    })
  if (!data.refresh_token) {
    return NextResponse.json(
      { ok: false, error: "missing_refresh_token" },
      { status: 409 }
    )
  }

  const expiresAt = new Date(data.token_expires_at).getTime()
  if (
    Number.isFinite(expiresAt) &&
    expiresAt - REFRESH_WITHIN_MS > Date.now()
  ) {
    return NextResponse.json({ ok: true, refreshed: false, reason: "not_due" })
  }

  try {
    const fresh = await refreshAccessToken(config, data.refresh_token)
    const refreshToken = fresh.refresh_token ?? data.refresh_token
    const { error: updateError } = await admin
      .from("app_integrations")
      .update({
        access_token: fresh.access_token,
        refresh_token: refreshToken,
        token_expires_at: new Date(
          Date.now() + fresh.expires_in * 1000
        ).toISOString(),
        last_refreshed_at: new Date().toISOString(),
      })
      .eq("provider", X_PROVIDER)

    if (updateError) {
      console.error("[cron refresh-x] update failed", updateError)
      return NextResponse.json(
        { ok: false, error: updateError.message },
        { status: 500 }
      )
    }
    return NextResponse.json({ ok: true, refreshed: true })
  } catch (err) {
    console.error("[cron refresh-x] refresh failed", err)
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    )
  }
}
