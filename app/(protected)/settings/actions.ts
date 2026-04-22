"use server"

import { revalidatePath } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export type DisconnectResult = { ok: true } | { ok: false; error: string }

export async function disconnectGoogleIntegration(): Promise<DisconnectResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  // Delete happens via the admin client because the table's RLS locks out
  // direct writes from authenticated users.
  const admin = createAdminClient()
  const { error } = await admin
    .from("rep_integrations")
    .delete()
    .eq("rep_id", auth.user.id)
    .eq("provider", "google")
  if (error) return { ok: false, error: error.message }

  revalidatePath("/settings")
  return { ok: true }
}
