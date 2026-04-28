import "server-only"

import { NextResponse } from "next/server"

import { requireXAdminAccess } from "@/lib/x/auth"
import { createPost, uploadImage } from "@/lib/x/client"
import { X_PROVIDER, isXConfigured } from "@/lib/x/config"
import { getValidXAccessToken } from "@/lib/x/tokens"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const TEXT_MAX = 280
const FILE_MAX_BYTES = 4 * 1024 * 1024
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"])
const REQUIRED_SCOPES = ["tweet.write", "media.write"]

type ApiError = { ok: false; error: string }
type ApiSuccess = { ok: true; postId: string; postUrl: string; text: string }

function jsonError(status: number, error: string) {
  return NextResponse.json<ApiError>({ ok: false, error }, { status })
}

export async function POST(request: Request) {
  if (!isXConfigured()) {
    return jsonError(501, "X is not configured")
  }

  const access = await requireXAdminAccess()
  if (!access.ok) return jsonError(403, access.error)

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return jsonError(400, "Expected multipart/form-data body")
  }

  const text = (formData.get("text") ?? "").toString().trim()
  const file = formData.get("image")

  if (!text) return jsonError(400, "Post text is required")
  if ([...text].length > TEXT_MAX) {
    return jsonError(400, `Post text exceeds ${TEXT_MAX} characters`)
  }

  const admin = createAdminClient()
  const { data: integration } = await admin
    .from("app_integrations")
    .select("username, scopes")
    .eq("provider", X_PROVIDER)
    .maybeSingle()
  if (!integration) return jsonError(409, "X is not connected")

  const missingScopes = REQUIRED_SCOPES.filter(
    (scope) => !integration.scopes.includes(scope)
  )
  if (missingScopes.length) {
    return jsonError(
      403,
      `Connected token is missing required scope: ${missingScopes.join(", ")}`
    )
  }

  const token = await getValidXAccessToken()
  if (!token.ok) return jsonError(409, token.error)

  const mediaIds: string[] = []
  if (file instanceof File && file.size > 0) {
    if (!ALLOWED_MIME.has(file.type)) {
      return jsonError(
        400,
        `Unsupported image type: ${file.type || "unknown"}. Use JPEG, PNG, or WebP.`
      )
    }
    if (file.size > FILE_MAX_BYTES) {
      return jsonError(
        400,
        `Image is ${(file.size / 1024 / 1024).toFixed(1)}MB; max is 4MB.`
      )
    }

    try {
      const media = await uploadImage(token.accessToken, file)
      mediaIds.push(media.id)
    } catch (err) {
      console.error("[x post] media upload failed", err)
      return jsonError(
        502,
        err instanceof Error ? err.message : "Media upload failed"
      )
    }
  }

  try {
    const post = await createPost(token.accessToken, {
      text,
      mediaIds: mediaIds.length ? mediaIds : undefined,
    })
    const postUrl = integration.username
      ? `https://x.com/${integration.username}/status/${post.id}`
      : `https://x.com/i/web/status/${post.id}`
    return NextResponse.json<ApiSuccess>({
      ok: true,
      postId: post.id,
      postUrl,
      text: post.text,
    })
  } catch (err) {
    console.error("[x post] create failed", err)
    return jsonError(
      502,
      err instanceof Error ? err.message : "Post creation failed"
    )
  }
}
