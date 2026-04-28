"use server"

import { revalidatePath } from "next/cache"

import { requireXAdminAccess } from "@/lib/x/auth"
import { createPost } from "@/lib/x/client"
import { X_PROVIDER, isXConfigured } from "@/lib/x/config"
import {
  generateXPost,
  regenerateXText as regenerateXTextLib,
} from "@/lib/x/draft-generator"
import { getValidXAccessToken } from "@/lib/x/tokens"
import { createAdminClient } from "@/lib/supabase/admin"

const TEXT_MAX = 280
const REQUIRED_SCOPES = ["tweet.write"]

export type XDraftActionResult =
  | { ok: true; draftId?: string }
  | { ok: false; error: string }

export type GenerateXDraftInput = { hint?: string }

export async function generateXDraft(
  input?: GenerateXDraftInput,
): Promise<XDraftActionResult> {
  if (!isXConfigured()) {
    return { ok: false, error: "X is not configured" }
  }
  const access = await requireXAdminAccess()
  if (!access.ok) return { ok: false, error: access.error }

  const ideaResult = await generateXPost(input?.hint)
  if (!ideaResult.ok) return { ok: false, error: ideaResult.error }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("x_drafts")
    .insert({
      topic: ideaResult.post.topic,
      text: ideaResult.post.text,
      generated_by: access.userId,
    })
    .select("id")
    .single()
  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to insert draft" }
  }

  revalidatePath("/admin/integrations/x/drafts")
  return { ok: true, draftId: data.id }
}

export async function updateXDraftText(
  draftId: string,
  text: string,
): Promise<XDraftActionResult> {
  const access = await requireXAdminAccess()
  if (!access.ok) return { ok: false, error: access.error }

  const trimmed = text.trim()
  if ([...trimmed].length > TEXT_MAX) {
    return { ok: false, error: `Post exceeds ${TEXT_MAX} characters` }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from("x_drafts")
    .update({ text: trimmed })
    .eq("id", draftId)
    .eq("status", "draft")
  if (error) return { ok: false, error: error.message }

  revalidatePath("/admin/integrations/x/drafts")
  return { ok: true, draftId }
}

export async function regenerateXDraftText(
  draftId: string,
  hint?: string,
): Promise<XDraftActionResult> {
  const access = await requireXAdminAccess()
  if (!access.ok) return { ok: false, error: access.error }

  const admin = createAdminClient()
  const { data: draft, error: fetchError } = await admin
    .from("x_drafts")
    .select("topic, text, status")
    .eq("id", draftId)
    .maybeSingle()
  if (fetchError || !draft) {
    return { ok: false, error: fetchError?.message ?? "Draft not found" }
  }
  if (draft.status !== "draft") {
    return { ok: false, error: "Draft is not editable in its current status" }
  }

  const result = await regenerateXTextLib({
    topic: draft.topic ?? "",
    previous: draft.text,
    hint,
  })
  if (!result.ok) return { ok: false, error: result.error }

  const { error: updateError } = await admin
    .from("x_drafts")
    .update({ text: result.text })
    .eq("id", draftId)
  if (updateError) return { ok: false, error: updateError.message }

  revalidatePath("/admin/integrations/x/drafts")
  return { ok: true, draftId }
}

export async function discardXDraft(
  draftId: string,
): Promise<XDraftActionResult> {
  const access = await requireXAdminAccess()
  if (!access.ok) return { ok: false, error: access.error }

  const admin = createAdminClient()
  const { data: draft } = await admin
    .from("x_drafts")
    .select("status")
    .eq("id", draftId)
    .maybeSingle()
  if (!draft) return { ok: false, error: "Draft not found" }
  if (draft.status === "published") {
    return { ok: false, error: "Already published" }
  }

  const { error } = await admin.from("x_drafts").delete().eq("id", draftId)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/admin/integrations/x/drafts")
  return { ok: true, draftId }
}

export async function publishXDraft(
  draftId: string,
): Promise<XDraftActionResult> {
  if (!isXConfigured()) {
    return { ok: false, error: "X is not configured" }
  }
  const access = await requireXAdminAccess()
  if (!access.ok) return { ok: false, error: access.error }

  const admin = createAdminClient()
  const { data: draft } = await admin
    .from("x_drafts")
    .select("id, text, status")
    .eq("id", draftId)
    .maybeSingle()
  if (!draft) return { ok: false, error: "Draft not found" }
  if (draft.status !== "draft") {
    return { ok: false, error: "Draft has already been processed" }
  }
  if (!draft.text.trim()) {
    return { ok: false, error: "Draft text is empty" }
  }

  const { data: integration } = await admin
    .from("app_integrations")
    .select("username, scopes")
    .eq("provider", X_PROVIDER)
    .maybeSingle()
  if (!integration) return { ok: false, error: "X is not connected" }

  const missingScopes = REQUIRED_SCOPES.filter(
    (scope) => !integration.scopes.includes(scope),
  )
  if (missingScopes.length) {
    return {
      ok: false,
      error: `Token is missing scope: ${missingScopes.join(", ")}`,
    }
  }

  const token = await getValidXAccessToken()
  if (!token.ok) return { ok: false, error: token.error }

  let postId: string
  try {
    const post = await createPost(token.accessToken, { text: draft.text })
    postId = post.id
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Post creation failed",
    }
  }

  const postUrl = integration.username
    ? `https://x.com/${integration.username}/status/${postId}`
    : `https://x.com/i/web/status/${postId}`

  await admin
    .from("x_drafts")
    .update({
      status: "published",
      published_post_id: postId,
      published_url: postUrl,
      published_at: new Date().toISOString(),
    })
    .eq("id", draftId)

  revalidatePath("/admin/integrations/x/drafts")
  return { ok: true, draftId }
}
