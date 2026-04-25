import "server-only"

import { createClient } from "@/lib/supabase/server"

export type GeminiRole = "admin" | "editor"

export type RequireGeminiAccessResult =
  | { ok: true; userId: string; role: GeminiRole }
  | { ok: false; error: string }

export async function requireGeminiAccess(): Promise<RequireGeminiAccessResult> {
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

  const role = profile?.role
  if (role !== "admin" && role !== "editor") {
    return {
      ok: false,
      error: "Only admins or editors can use AI generation",
    }
  }

  return { ok: true, userId: auth.user.id, role }
}
