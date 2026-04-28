import "server-only"

import { createClient } from "@/lib/supabase/server"

export type RequireInstagramAdminResult =
  | { ok: true; userId: string }
  | { ok: false; error: string }

export async function requireInstagramAdminAccess(): Promise<RequireInstagramAdminResult> {
  const supabase = await createClient()

  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) {
    return { ok: false, error: "Not authenticated" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle()

  if (profile?.role !== "admin") {
    return {
      ok: false,
      error: "Only admins can manage the Instagram connection",
    }
  }

  return { ok: true, userId: auth.user.id }
}
