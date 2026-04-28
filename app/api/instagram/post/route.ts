import "server-only"

import { randomUUID } from "node:crypto"

import { NextResponse } from "next/server"

import {
  createImageContainer,
  getMediaDetails,
  publishContainer,
} from "@/lib/instagram/client"
import {
  INSTAGRAM_PROVIDER,
  isInstagramConfigured,
} from "@/lib/instagram/config"
import { requireInstagramAdminAccess } from "@/lib/instagram/auth"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BUCKET = "instagram-uploads"
const CAPTION_MAX = 2200
// Instagram caps images at 8MB, but Vercel serverless route handlers cap
// the request body around 4.5MB. We enforce 4MB here so the route never
// fails at the platform layer; if we ever need 8MB images we'd refactor
// to a presigned browser upload to Supabase Storage and skip Vercel.
const FILE_MAX_BYTES = 4 * 1024 * 1024
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"])
const PUBLISH_SCOPE = "instagram_business_content_publish"

type ApiError = { ok: false; error: string }
type ApiSuccess = {
  ok: true
  permalink: string
  mediaId: string
}

function jsonError(status: number, error: string) {
  return NextResponse.json<ApiError>({ ok: false, error }, { status })
}

export async function POST(request: Request) {
  if (!isInstagramConfigured()) {
    return jsonError(501, "Instagram is not configured")
  }

  const access = await requireInstagramAdminAccess()
  if (!access.ok) return jsonError(403, access.error)

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return jsonError(400, "Expected multipart/form-data body")
  }

  const file = formData.get("image")
  const caption = (formData.get("caption") ?? "").toString().trim()

  if (!(file instanceof File)) {
    return jsonError(400, "Missing image file")
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return jsonError(
      400,
      `Unsupported image type: ${file.type || "unknown"}. Use JPEG, PNG, or WebP.`,
    )
  }
  if (file.size === 0) {
    return jsonError(400, "Image is empty")
  }
  if (file.size > FILE_MAX_BYTES) {
    return jsonError(
      400,
      `Image is ${(file.size / 1024 / 1024).toFixed(1)}MB; max is 4MB.`,
    )
  }
  if (caption.length > CAPTION_MAX) {
    return jsonError(
      400,
      `Caption is ${caption.length} chars; max ${CAPTION_MAX}.`,
    )
  }

  const admin = createAdminClient()

  const { data: integration } = await admin
    .from("app_integrations")
    .select("access_token, scopes")
    .eq("provider", INSTAGRAM_PROVIDER)
    .maybeSingle()
  if (!integration?.access_token) {
    return jsonError(409, "Instagram is not connected")
  }
  if (!integration.scopes.includes(PUBLISH_SCOPE)) {
    return jsonError(
      403,
      "Connected token does not have publish scope. Reconnect with content publishing enabled.",
    )
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"
  const path = `${randomUUID()}.${ext}`

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    })
  if (uploadError) {
    console.error("[instagram post] upload failed", uploadError)
    return jsonError(500, `Upload failed: ${uploadError.message}`)
  }

  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path)
  const imageUrl = pub.publicUrl

  let containerId: string
  try {
    const container = await createImageContainer(integration.access_token, {
      imageUrl,
      caption: caption || undefined,
    })
    containerId = container.id
  } catch (err) {
    console.error("[instagram post] container create failed", err)
    void admin.storage.from(BUCKET).remove([path])
    return jsonError(
      502,
      err instanceof Error ? err.message : "Container creation failed",
    )
  }

  let mediaId: string
  try {
    const published = await publishContainer(
      integration.access_token,
      containerId,
    )
    mediaId = published.id
  } catch (err) {
    console.error("[instagram post] publish failed", err)
    void admin.storage.from(BUCKET).remove([path])
    return jsonError(
      502,
      err instanceof Error ? err.message : "Publish failed",
    )
  }

  let permalink = ""
  try {
    const details = await getMediaDetails(integration.access_token, mediaId)
    permalink = details.permalink
  } catch (err) {
    console.error("[instagram post] permalink fetch failed", err)
  }

  // Instagram has its own copy now. Clean up the public-bucket original.
  void admin.storage.from(BUCKET).remove([path])

  return NextResponse.json<ApiSuccess>({ ok: true, permalink, mediaId })
}
