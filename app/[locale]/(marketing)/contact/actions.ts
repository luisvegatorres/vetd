"use server"

import { getLocale } from "next-intl/server"

import { LEADS_INBOX } from "@/lib/email/addresses"
import { sendEmail } from "@/lib/email/client"
import {
  contactLeadAutoReply,
  contactLeadNotification,
} from "@/lib/email/templates"
import { createClient } from "@/lib/supabase/server"

export type SubmitContactResult = { ok: true } | { ok: false; error: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function titleCase(v: string) {
  return v.replace(/\b(\p{Ll})/gu, (c) => c.toUpperCase())
}

export async function submitContactForm(
  formData: FormData
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
  const company = rawBusiness ? titleCase(rawBusiness) : null
  const projectType = str("projectType")
  const budget = str("budgetRange")
  const notes = str("projectDetails")

  const supabase = await createClient()
  const { error } = await supabase.from("clients").insert({
    name,
    email,
    phone: phoneDigits,
    company,
    intent: projectType,
    budget,
    notes,
    source: "contact_form",
    status: "lead",
    assigned_to: null,
  })

  if (error) return { ok: false, error: error.message }

  const locale = await getLocale()
  const [notification, autoReply] = await Promise.all([
    contactLeadNotification({
      name,
      email,
      phone: phoneDigits,
      company,
      projectType,
      budget,
      notes,
      locale,
    }),
    contactLeadAutoReply({ name, locale }),
  ])

  const results = await Promise.allSettled([
    sendEmail({ to: LEADS_INBOX, replyTo: email, ...notification }),
    sendEmail({ to: email, ...autoReply }),
  ])

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("contact-form email dispatch failed", result.reason)
    } else if (!result.value.ok) {
      console.error("contact-form email dispatch failed", result.value.error)
    }
  }

  return { ok: true }
}
