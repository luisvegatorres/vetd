"use server"

import { revalidatePath } from "next/cache"

import { requireInstagramAdminAccess } from "@/lib/instagram/auth"
import { INSTAGRAM_PROVIDER } from "@/lib/instagram/config"
import { createAdminClient } from "@/lib/supabase/admin"

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
