"use server"

import { revalidatePath } from "next/cache"

import {
  escapeHtml,
  paragraphs,
  wrapPersonalEmail,
} from "@/lib/email/templates"
import { sendGmailAsRep } from "@/lib/google/gmail-send"
import { logActivity, sourceRefFor } from "@/lib/interactions/log-activity"
import {
  buildOutreachContext,
  resolveOutreach,
} from "@/lib/outreach/tokens"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type SendOutreachInput = {
  leadId: string
  templateId: string
  subject: string
  body: string
  referenceUrl: string | null
  linkText: string | null
}

export type SendOutreachResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string; code?: "scope_missing" | "auth_expired" }

function renderHtmlBody(
  body: string,
  referenceUrl: string,
  linkText: string,
): string {
  const parts = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)

  let bodyHtml: string
  if (!referenceUrl || !linkText) {
    bodyHtml = paragraphs(parts)
  } else {
    const safeUrl = escapeHtml(referenceUrl)
    const safeLabel = escapeHtml(linkText)
    const linkHtml = `<a href="${safeUrl}">${safeLabel}</a>`

    // Escape each paragraph then swap the link-text token for a real <a>.
    // We compare against the escaped form so any apostrophes / ampersands
    // in the link text still match after escaping.
    const escapedLinkText = escapeHtml(linkText)
    bodyHtml = parts
      .map((p) => {
        const escaped = escapeHtml(p)
          .replaceAll(escapedLinkText, linkHtml)
          .replace(/\n/g, "<br />")
        return `<p style="margin:0 0 14px;">${escaped}</p>`
      })
      .join("")
  }

  return wrapPersonalEmail(bodyHtml)
}

function renderTextBody(
  body: string,
  referenceUrl: string,
  linkText: string,
): string {
  // Plain-text recipients can't click an anchor, so inline the URL after
  // the link text: "Click here (https://example.com)".
  if (!referenceUrl || !linkText) return body
  return body.replaceAll(linkText, `${linkText} (${referenceUrl})`)
}

export async function sendOutreachEmail(
  input: SendOutreachInput,
): Promise<SendOutreachResult> {
  if (!UUID_RE.test(input.leadId)) {
    return { ok: false, error: "Invalid lead id" }
  }
  if (!UUID_RE.test(input.templateId)) {
    return { ok: false, error: "Invalid template id" }
  }

  const subject = input.subject.trim()
  const body = input.body.trim()
  if (!subject) return { ok: false, error: "Subject is required" }
  if (!body) return { ok: false, error: "Body is required" }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  const repId = auth.user.id

  const [leadRes, templateRes] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, company, email, assigned_to")
      .eq("id", input.leadId)
      .maybeSingle(),
    supabase
      .from("outreach_templates")
      .select("id, label, reference_label")
      .eq("id", input.templateId)
      .maybeSingle(),
  ])

  if (leadRes.error || !leadRes.data) {
    return { ok: false, error: "Lead not found" }
  }
  if (templateRes.error || !templateRes.data) {
    return { ok: false, error: "Template not found" }
  }
  const lead = leadRes.data
  const template = templateRes.data

  if (!lead.email) {
    return { ok: false, error: "Lead has no email address" }
  }

  // Resolve rep identity. The Gmail API ignores any From address other than
  // the authenticated mailbox, so we always send as `google_email`.
  const admin = createAdminClient()
  const [profileRes, integrationRes] = await Promise.all([
    admin
      .from("profiles")
      .select("full_name, role, title")
      .eq("id", repId)
      .maybeSingle(),
    admin
      .from("rep_integrations")
      .select("google_email")
      .eq("rep_id", repId)
      .eq("provider", "google")
      .maybeSingle(),
  ])

  const fromEmail = integrationRes.data?.google_email
  if (!fromEmail) {
    return {
      ok: false,
      error:
        "Connect Google from Settings before sending outreach (we send as you, from your Gmail).",
      code: "scope_missing",
    }
  }
  const fromName =
    profileRes.data?.full_name ?? auth.user.email ?? "Your Vetd rep"

  // Auto-claim unassigned leads when a rep contacts them, mirroring how
  // createLead self-claims for sales reps. Avoids contacted leads sitting
  // unassigned and racing other reps.
  if (
    !lead.assigned_to &&
    (profileRes.data?.role === "sales_rep" ||
      profileRes.data?.role === "admin" ||
      profileRes.data?.role === "editor")
  ) {
    await supabase
      .from("clients")
      .update({ assigned_to: repId })
      .eq("id", lead.id)
  }

  const referenceUrl = input.referenceUrl?.trim() || ""
  const linkText =
    input.linkText?.trim() ||
    template.reference_label?.trim() ||
    "Click here"

  // Defense pass: if any unsubstituted tokens made it through (e.g. direct
  // API call bypassing the dialog), resolve them here using the same shared
  // resolver the dialog uses.
  const ctx = buildOutreachContext({
    leadName: lead.name,
    leadCompany: lead.company,
    leadEmail: lead.email,
    linkText,
    rep: {
      name: profileRes.data?.full_name ?? null,
      email: fromEmail,
      title: profileRes.data?.title ?? null,
    },
  })
  const finalSubject = resolveOutreach(subject, ctx)
  const finalBodyText = resolveOutreach(body, ctx)

  const html = renderHtmlBody(finalBodyText, referenceUrl, linkText)
  const text = renderTextBody(finalBodyText, referenceUrl, linkText)

  const sendResult = await sendGmailAsRep({
    repId,
    to: lead.email,
    fromEmail,
    fromName,
    subject: finalSubject,
    html,
    text,
  })

  if (!sendResult.ok) {
    return {
      ok: false,
      error: sendResult.error,
      ...(sendResult.code ? { code: sendResult.code } : {}),
    }
  }

  await logActivity({
    supabase,
    clientId: lead.id,
    loggedBy: repId,
    type: "email",
    title: `Outreach: ${template.label}`,
    content: `Sent to ${lead.email} from ${fromEmail}\nSubject: ${finalSubject}`,
    sourceRef: sourceRefFor("outreach-email", lead.id, sendResult.messageId),
  })

  revalidatePath("/leads")

  return { ok: true, messageId: sendResult.messageId }
}
