"use server"

import { revalidatePath } from "next/cache"

import { getProfile, listMedia } from "@/lib/instagram/client"
import { requireInstagramAdminAccess } from "@/lib/instagram/auth"
import { INSTAGRAM_PROVIDER } from "@/lib/instagram/config"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireXAdminAccess } from "@/lib/x/auth"
import { getProfile as getXProfile } from "@/lib/x/client"
import { X_PROVIDER } from "@/lib/x/config"
import { getValidXAccessToken } from "@/lib/x/tokens"

export type DisconnectResult = { ok: true } | { ok: false; error: string }

export async function disconnectInstagramIntegration(): Promise<DisconnectResult> {
  const access = await requireInstagramAdminAccess()
  if (!access.ok) return { ok: false, error: access.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from("app_integrations")
    .delete()
    .eq("provider", INSTAGRAM_PROVIDER)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/admin/integrations")
  return { ok: true }
}

export type InstagramTestResult =
  | {
      ok: true
      profile: {
        id: string
        username: string
        accountType?: string
        mediaCount?: number
      }
      recentMedia: Array<{
        id: string
        caption: string | null
        mediaType: string
        permalink: string | null
        timestamp: string | null
      }>
    }
  | { ok: false; error: string }

export async function testInstagramConnection(): Promise<InstagramTestResult> {
  const access = await requireInstagramAdminAccess()
  if (!access.ok) return { ok: false, error: access.error }

  const admin = createAdminClient()
  const { data } = await admin
    .from("app_integrations")
    .select("access_token")
    .eq("provider", INSTAGRAM_PROVIDER)
    .maybeSingle()
  if (!data?.access_token) {
    return { ok: false, error: "No Instagram connection on file" }
  }

  try {
    const profile = await getProfile(data.access_token)
    const media = await listMedia(data.access_token, 5)
    return {
      ok: true,
      profile: {
        id: profile.id,
        username: profile.username,
        accountType: profile.account_type,
        mediaCount: profile.media_count,
      },
      recentMedia: media.map((m) => ({
        id: m.id,
        caption: m.caption ?? null,
        mediaType: m.media_type,
        permalink: m.permalink ?? null,
        timestamp: m.timestamp ?? null,
      })),
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

export async function disconnectXIntegration(): Promise<DisconnectResult> {
  const access = await requireXAdminAccess()
  if (!access.ok) return { ok: false, error: access.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from("app_integrations")
    .delete()
    .eq("provider", X_PROVIDER)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/admin/integrations")
  return { ok: true }
}

export type XTestResult =
  | {
      ok: true
      profile: {
        id: string
        name: string
        username: string
        profileImageUrl?: string
      }
    }
  | { ok: false; error: string }

export async function testXConnection(): Promise<XTestResult> {
  const access = await requireXAdminAccess()
  if (!access.ok) return { ok: false, error: access.error }

  const token = await getValidXAccessToken()
  if (!token.ok) return { ok: false, error: token.error }

  try {
    const profile = await getXProfile(token.accessToken)
    return {
      ok: true,
      profile: {
        id: profile.id,
        name: profile.name,
        username: profile.username,
        profileImageUrl: profile.profile_image_url,
      },
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
