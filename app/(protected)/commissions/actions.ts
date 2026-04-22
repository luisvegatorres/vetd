"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

export type MarkLedgerResult =
  | { ok: true }
  | { ok: false; error: string }

type LedgerSource = "subscription" | "project"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function tableFor(source: LedgerSource) {
  return source === "project"
    ? "project_commission_ledger"
    : "subscription_commission_ledger"
}

export async function markCommissionPaid(
  ledgerId: string,
  source: LedgerSource = "subscription",
): Promise<MarkLedgerResult> {
  if (!UUID_RE.test(ledgerId)) return { ok: false, error: "Invalid id" }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single()
  if (profile?.role !== "admin") {
    return { ok: false, error: "Admin only" }
  }

  const { error } = await supabase
    .from(tableFor(source))
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", ledgerId)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/commissions")
  return { ok: true }
}

export async function voidCommission(
  ledgerId: string,
  notes: string | null,
  source: LedgerSource = "subscription",
): Promise<MarkLedgerResult> {
  if (!UUID_RE.test(ledgerId)) return { ok: false, error: "Invalid id" }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single()
  if (profile?.role !== "admin") {
    return { ok: false, error: "Admin only" }
  }

  const { error } = await supabase
    .from(tableFor(source))
    .update({ status: "voided", notes })
    .eq("id", ledgerId)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/commissions")
  return { ok: true }
}
