"use server"

import { createClient } from "@/lib/supabase/server"

export type SubmitContactResult =
  | { ok: true }
  | { ok: false; error: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function titleCase(v: string) {
  return v.replace(/\b(\p{Ll})/gu, (c) => c.toUpperCase())
}

export async function submitContactForm(
  formData: FormData,
): Promise<SubmitContactResult> {
  const name = titleCase(String(formData.get("name") ?? "").trim())
  if (!name) return { ok: false, error: "Name is required" }

  const email = String(formData.get("email") ?? "").trim()
  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, error: "Enter a valid email address" }
  }

  const phoneDigits = String(formData.get("phone") ?? "").replace(/\D/g, "")
  if (phoneDigits.length !== 10) {
    return { ok: false, error: "Enter a valid 10-digit phone number" }
  }

  const str = (key: string) => {
    const v = String(formData.get(key) ?? "").trim()
    return v.length > 0 ? v : null
  }

  const rawBusiness = str("business")

  const supabase = await createClient()
  const { error } = await supabase.from("clients").insert({
    name,
    email,
    phone: phoneDigits,
    company: rawBusiness ? titleCase(rawBusiness) : null,
    intent: str("projectType"),
    budget: str("budgetRange"),
    notes: str("projectDetails"),
    source: "contact_form",
    status: "lead",
    assigned_to: null,
  })

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
