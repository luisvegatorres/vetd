import "server-only"

import MailComposer from "nodemailer/lib/mail-composer"

import { createAdminClient } from "@/lib/supabase/admin"
import { getAccessTokenForRep, hasGmailSendScope } from "@/lib/google/tokens"

export type GmailAttachment = {
  filename: string
  content: Buffer
  mimeType: string
}

export type SendGmailArgs = {
  repId: string
  to: string
  subject: string
  html: string
  text: string
  fromEmail: string
  fromName?: string | null
  replyTo?: string
  attachments?: GmailAttachment[]
}

export type SendGmailResult =
  | { ok: true; messageId: string; threadId: string }
  | { ok: false; error: string; code?: "scope_missing" | "auth_expired" }

function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

async function composeRawMime(args: SendGmailArgs): Promise<string> {
  const composer = new MailComposer({
    from: args.fromName
      ? `${args.fromName} <${args.fromEmail}>`
      : args.fromEmail,
    to: args.to,
    replyTo: args.replyTo,
    subject: args.subject,
    html: args.html,
    text: args.text,
    attachments: args.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.mimeType,
    })),
  })
  const mime = await composer.compile().build()
  return base64UrlEncode(mime)
}

/**
 * Send an email as the given rep via the Gmail API. The rep must have
 * connected Google with the gmail.send scope (added in lib/google/config.ts);
 * on missing scope or invalid credentials, returns { ok: false, code } so the
 * caller can surface a "Reconnect Google" prompt. No SMTP fallback: sending
 * as no-reply@ would lose the "replies go to the rep" property that motivated
 * this whole flow.
 */
export async function sendGmailAsRep(
  args: SendGmailArgs,
): Promise<SendGmailResult> {
  const admin = createAdminClient()

  if (!(await hasGmailSendScope(admin, args.repId))) {
    return {
      ok: false,
      error:
        "Google sending isn't enabled for your account yet. Reconnect Google from Settings to grant send access.",
      code: "scope_missing",
    }
  }

  let accessToken: string
  try {
    accessToken = await getAccessTokenForRep(admin, args.repId)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: message, code: "auth_expired" }
  }

  let raw: string
  try {
    raw = await composeRawMime(args)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Failed to compose message: ${message}` }
  }

  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    },
  )

  if (!response.ok) {
    const body = await response.text()
    if (response.status === 401 || response.status === 403) {
      return {
        ok: false,
        error:
          "Google rejected the send (auth or scope issue). Reconnect Google from Settings.",
        code: "scope_missing",
      }
    }
    return {
      ok: false,
      error: `Gmail API error ${response.status}: ${body.slice(0, 500)}`,
    }
  }

  const data = (await response.json()) as {
    id?: string
    threadId?: string
  }
  if (!data.id || !data.threadId) {
    return { ok: false, error: "Gmail returned an incomplete response" }
  }
  return { ok: true, messageId: data.id, threadId: data.threadId }
}
