"use server"

import { revalidatePath } from "next/cache"

import {
  createImageContainer,
  getMediaDetails,
  publishContainer,
} from "@/lib/instagram/client"
import {
  INSTAGRAM_PROVIDER,
  isInstagramConfigured,
} from "@/lib/instagram/config"
import {
  generatePostIdea,
  regenerateCaption as regenerateCaptionLib,
} from "@/lib/instagram/draft-generator"
import { requireInstagramAdminAccess } from "@/lib/instagram/auth"
import { createAdminClient } from "@/lib/supabase/admin"

const BUCKET = "instagram-uploads"
const PUBLISH_SCOPE = "instagram_business_content_publish"

export type DraftActionResult =
  | { ok: true; draftId?: string }
  | { ok: false; error: string }

export type GenerateDraftInput = { hint?: string }

/**
 * Generates a brand-new draft: caption + image_prompt via Gemini. The
 * image is left null; the admin attaches their own via
 * /api/instagram/drafts/[id]/image before publishing.
 */
export async function generateDraft(
  input?: GenerateDraftInput,
): Promise<DraftActionResult> {
  if (!isInstagramConfigured()) {
    return { ok: false, error: "Instagram is not configured" }
  }
  const access = await requireInstagramAdminAccess()
  if (!access.ok) return { ok: false, error: access.error }

  const ideaResult = await generatePostIdea(input?.hint)
  if (!ideaResult.ok) return { ok: false, error: ideaResult.error }
  const idea = ideaResult.post

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("instagram_drafts")
    .insert({
      topic: idea.topic,
      caption: idea.caption,
      image_prompt: idea.image_prompt,
      image_path: null,
      generated_by: access.userId,
    })
    .select("id")
    .single()
  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Failed to insert draft",
    }
  }

  revalidatePath("/admin/integrations/drafts")
  return { ok: true, draftId: data.id }
}

export async function updateDraftCaption(
  draftId: string,
  caption: string,
): Promise<DraftActionResult> {
  const access = await requireInstagramAdminAccess()
  if (!access.ok) return { ok: false, error: access.error }

  const trimmed = caption.trim()
  if (trimmed.length > 2200) {
    return { ok: false, error: "Caption exceeds 2200 chars" }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from("instagram_drafts")
    .update({ caption: trimmed })
    .eq("id", draftId)
    .eq("status", "draft")
  if (error) return { ok: false, error: error.message }

  revalidatePath("/admin/integrations/drafts")
  return { ok: true, draftId }
}

export async function regenerateDraftCaption(
  draftId: string,
  hint?: string,
): Promise<DraftActionResult> {
  const access = await requireInstagramAdminAccess()
  if (!access.ok) return { ok: false, error: access.error }

  const admin = createAdminClient()
  const { data: draft, error: fetchError } = await admin
    .from("instagram_drafts")
    .select("topic, image_prompt, caption, status")
    .eq("id", draftId)
    .maybeSingle()
  if (fetchError || !draft) {
    return { ok: false, error: fetchError?.message ?? "Draft not found" }
  }
  if (draft.status !== "draft") {
    return { ok: false, error: "Draft is not editable in its current status" }
  }

  const result = await regenerateCaptionLib({
    topic: draft.topic ?? "",
    imagePrompt: draft.image_prompt ?? "",
    previous: draft.caption,
    hint,
  })
  if (!result.ok) return { ok: false, error: result.error }

  const { error: updateError } = await admin
    .from("instagram_drafts")
    .update({ caption: result.caption })
    .eq("id", draftId)
  if (updateError) return { ok: false, error: updateError.message }

  revalidatePath("/admin/integrations/drafts")
  return { ok: true, draftId }
}

export async function discardDraft(
  draftId: string,
): Promise<DraftActionResult> {
  const access = await requireInstagramAdminAccess()
  if (!access.ok) return { ok: false, error: access.error }

  const admin = createAdminClient()
  const { data: draft } = await admin
    .from("instagram_drafts")
    .select("image_path, status")
    .eq("id", draftId)
    .maybeSingle()
  if (!draft) return { ok: false, error: "Draft not found" }
  if (draft.status === "published") {
    return { ok: false, error: "Already published; delete instead" }
  }

  if (draft.image_path) {
    void admin.storage.from(BUCKET).remove([draft.image_path])
  }
  const { error } = await admin
    .from("instagram_drafts")
    .delete()
    .eq("id", draftId)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/admin/integrations/drafts")
  return { ok: true, draftId }
}

/**
 * Publishes a draft to Instagram. Reuses the same container -> publish
 * flow as the manual composer. On success, marks the row as published,
 * stores the permalink, and removes the storage file (Instagram already
 * cached its own copy at container creation time).
 */
export async function publishDraft(
  draftId: string,
): Promise<DraftActionResult> {
  if (!isInstagramConfigured()) {
    return { ok: false, error: "Instagram is not configured" }
  }
  const access = await requireInstagramAdminAccess()
  if (!access.ok) return { ok: false, error: access.error }

  const admin = createAdminClient()
  const { data: draft } = await admin
    .from("instagram_drafts")
    .select("id, caption, image_path, status")
    .eq("id", draftId)
    .maybeSingle()
  if (!draft) return { ok: false, error: "Draft not found" }
  if (draft.status !== "draft") {
    return { ok: false, error: "Draft has already been processed" }
  }
  if (!draft.image_path) {
    return { ok: false, error: "Draft has no image" }
  }

  const { data: integration } = await admin
    .from("app_integrations")
    .select("access_token, scopes")
    .eq("provider", INSTAGRAM_PROVIDER)
    .maybeSingle()
  if (!integration?.access_token) {
    return { ok: false, error: "Instagram is not connected" }
  }
  if (!integration.scopes.includes(PUBLISH_SCOPE)) {
    return {
      ok: false,
      error: "Connected token does not have publish scope",
    }
  }

  const { data: pub } = admin.storage
    .from(BUCKET)
    .getPublicUrl(draft.image_path)
  const imageUrl = pub.publicUrl

  let containerId: string
  try {
    const container = await createImageContainer(integration.access_token, {
      imageUrl,
      caption: draft.caption || undefined,
    })
    containerId = container.id
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Container failed",
    }
  }

  let mediaId: string
  try {
    const published = await publishContainer(
      integration.access_token,
      containerId,
    )
    mediaId = published.id
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Publish failed",
    }
  }

  let permalink = ""
  try {
    const details = await getMediaDetails(integration.access_token, mediaId)
    permalink = details.permalink
  } catch {
    // Permalink lookup is best-effort; the post is already live.
  }

  await admin
    .from("instagram_drafts")
    .update({
      status: "published",
      published_media_id: mediaId,
      published_permalink: permalink,
      published_at: new Date().toISOString(),
    })
    .eq("id", draftId)

  // Instagram has its own copy now. Drop the bucket original.
  void admin.storage.from(BUCKET).remove([draft.image_path])

  revalidatePath("/admin/integrations/drafts")
  return { ok: true, draftId }
}
