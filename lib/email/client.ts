import "server-only"

import nodemailer, { type Transporter } from "nodemailer"

import { EMAIL_FROM, EMAIL_REPLY_TO } from "./addresses"

export type SendEmailArgs = {
  to: string | string[]
  subject: string
  html: string
  text: string
  from?: string
  replyTo?: string
}

export type SendEmailResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string }

let cachedTransport: Transporter | null = null

function getTransport(): Transporter {
  if (cachedTransport) return cachedTransport

  const host = process.env.GMAIL_SMTP_HOST
  const port = Number(process.env.GMAIL_SMTP_PORT ?? 587)
  const user = process.env.GMAIL_SMTP_USER
  const pass = process.env.GMAIL_SMTP_PASSWORD

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP is not configured: set GMAIL_SMTP_HOST, GMAIL_SMTP_USER, and GMAIL_SMTP_PASSWORD."
    )
  }

  cachedTransport = nodemailer.createTransport({
    host,
    port,
    secure: false,
    requireTLS: true,
    auth: { user, pass },
  })

  return cachedTransport
}

export async function sendEmail(args: SendEmailArgs): Promise<SendEmailResult> {
  try {
    const info = await getTransport().sendMail({
      from: args.from ?? EMAIL_FROM,
      replyTo: args.replyTo ?? EMAIL_REPLY_TO,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
    })
    return { ok: true, messageId: info.messageId }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, error: message }
  }
}
