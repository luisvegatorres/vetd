import "server-only"

import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

import { runDailyGeneration } from "@/lib/blog/auto-generate"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Vercel Cron entry point for daily blog generation. Schedule lives in
 * vercel.json; the same path also accepts manual invocations from the
 * admin "Generate now" button.
 *
 * Auth mirrors the sync-google cron: we verify `Authorization: Bearer
 * ${CRON_SECRET}`. Vercel Cron sends this automatically when CRON_SECRET is
 * set on the project. A missing/mismatched secret returns 401 so random
 * probes can't hammer the Gemini endpoint and burn quota.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET ?? null
  if (cronSecret) {
    const header = request.headers.get("authorization") ?? ""
    const expected = `Bearer ${cronSecret}`
    if (header !== expected) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      )
    }
  }

  const result = await runDailyGeneration()
  if (!result.ok) {
    console.error("[cron blog] generation failed", result.error)
    return NextResponse.json(result, { status: 500 })
  }

  // The admin list and (when auto-publish is on) the public index need a
  // fresh render so the new draft appears immediately.
  revalidatePath("/admin/blog")
  if (result.mode === "scheduled") {
    revalidatePath("/blog")
    revalidatePath("/[locale]/blog", "page")
    revalidatePath("/sitemap.xml")
  }

  return NextResponse.json(result)
}
