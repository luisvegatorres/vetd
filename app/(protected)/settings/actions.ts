"use server"

import { revalidatePath } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import {
  DEFAULT_WORKING_HOURS,
  parseWorkingHours,
  type WorkingHours,
} from "@/lib/working-hours"

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

export type WorkingHoursResult =
  | { ok: true; workingHours: WorkingHours }
  | { ok: false; error: string }

export async function getMyWorkingHoursAction(): Promise<WorkingHoursResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  const { data, error } = await supabase
    .from("profiles")
    .select("working_hours")
    .eq("id", auth.user.id)
    .maybeSingle()
  if (error) return { ok: false, error: error.message }

  const workingHours = parseWorkingHours(data?.working_hours)
  return { ok: true, workingHours }
}

export async function updateMyWorkingHoursAction(
  input: unknown,
): Promise<{ ok: true; workingHours: WorkingHours } | { ok: false; error: string }> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  const parsed = parseWorkingHours(input ?? DEFAULT_WORKING_HOURS)

  const { error } = await supabase
    .from("profiles")
    .update({ working_hours: parsed })
    .eq("id", auth.user.id)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/settings")
  return { ok: true, workingHours: parsed }
}
