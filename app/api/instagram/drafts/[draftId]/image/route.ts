import "server-only"

import { randomUUID } from "node:crypto"

import { NextResponse } from "next/server"

import { requireInstagramAdminAccess } from "@/lib/instagram/auth"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BUCKET = "instagram-uploads"
// Vercel route handlers cap request bodies around 4.5MB; 4MB leaves headroom
// and matches the manual composer at /api/instagram/post.
const FILE_MAX_BYTES = 4 * 1024 * 1024
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"])

type ApiError = { ok: false; error: string }
type ApiSuccess = { ok: true; imagePath: string; imageUrl: string }

function jsonError(status: number, error: string) {
  return NextResponse.json<ApiError>({ ok: false, error }, { status })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ draftId: string }> },
) {
  const access = await requireInstagramAdminAccess()
  if (!access.ok) return jsonError(403, access.error)

  const { draftId } = await params

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return jsonError(400, "Expected multipart/form-data body")
  }

  const file = formData.get("image")
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

  const admin = createAdminClient()

  const { data: draft, error: fetchError } = await admin
    .from("instagram_drafts")
    .select("id, image_path, status")
    .eq("id", draftId)
    .maybeSingle()
  if (fetchError || !draft) {
    return jsonError(404, fetchError?.message ?? "Draft not found")
  }
  if (draft.status !== "draft") {
    return jsonError(409, "Draft is not editable in its current status")
  }

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg"
  const path = `drafts/${randomUUID()}.${ext}`

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    })
  if (uploadError) {
    return jsonError(500, `Upload failed: ${uploadError.message}`)
  }

  const { error: updateError } = await admin
    .from("instagram_drafts")
    .update({ image_path: path })
    .eq("id", draftId)
  if (updateError) {
    void admin.storage.from(BUCKET).remove([path])
    return jsonError(500, updateError.message)
  }

  // Best-effort cleanup of any previous image. Failures are non-fatal —
  // the bucket isn't space-constrained at this scale.
  if (draft.image_path) {
    void admin.storage.from(BUCKET).remove([draft.image_path])
  }

  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json<ApiSuccess>({
    ok: true,
    imagePath: path,
    imageUrl: pub.publicUrl,
  })
}
