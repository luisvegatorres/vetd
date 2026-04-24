import "server-only"

import { getTranslations } from "next-intl/server"

import { site } from "@/lib/site"

export type RenderedEmail = {
  subject: string
  html: string
  text: string
}

export type ContactLeadNotificationArgs = {
  name: string
  email: string
  phone: string
  company: string | null
  projectType: string | null
  budget: string | null
  notes: string | null
  locale: string
}

export type ContactLeadAutoReplyArgs = {
  name: string
  locale: string
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function formatPhoneForDisplay(digits: string) {
  if (digits.length !== 10) return digits
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

// Light mode (default, widest email-client compatibility) lives in inline
// styles on each element. Dark mode is layered on top via a <style> block with
// @media (prefers-color-scheme: dark) and class hooks. Clients that honor the
// media query flip to dark; everything else stays light.
const SHELL_STYLE =
  "background:#f5f5f5;color:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;padding:40px 24px;line-height:1.55;"

const CARD_STYLE =
  "background:#ffffff;border:1px solid #e5e5e5;padding:32px;max-width:560px;margin:0 auto;"

const HEADING_STYLE =
  "margin:0 0 16px;font-size:14px;letter-spacing:0.18em;text-transform:uppercase;color:#0a0a0a;"

const LABEL_STYLE =
  "font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#6b6b6b;margin:0 0 4px;"

const VALUE_STYLE = "font-size:15px;color:#0a0a0a;margin:0 0 20px;"

const BODY_STYLE = "font-size:15px;color:#333333;margin:0 0 16px;"

const DARK_MODE_STYLES = `
  @media (prefers-color-scheme: dark) {
    .vetd-shell { background:#000000 !important; color:#ffffff !important; }
    .vetd-card { background:#0a0a0a !important; border-color:#1f1f1f !important; }
    .vetd-heading { color:#ffffff !important; }
    .vetd-label { color:#8a8a8a !important; }
    .vetd-value { color:#ffffff !important; }
    .vetd-body { color:#d4d4d4 !important; }
  }
`

function wrapHtmlDocument(bodyInner: string): string {
  return (
    `<!doctype html>` +
    `<html lang="en">` +
    `<head>` +
    `<meta charset="utf-8" />` +
    `<meta name="viewport" content="width=device-width,initial-scale=1" />` +
    `<meta name="color-scheme" content="light dark" />` +
    `<meta name="supported-color-schemes" content="light dark" />` +
    `<style>${DARK_MODE_STYLES}</style>` +
    `</head>` +
    `<body style="margin:0;padding:0;">` +
    bodyInner +
    `</body>` +
    `</html>`
  )
}

export async function contactLeadNotification(
  args: ContactLeadNotificationArgs,
): Promise<RenderedEmail> {
  const t = await getTranslations({
    locale: args.locale,
    namespace: "contact.notifications",
  })
  const tFields = await getTranslations({
    locale: args.locale,
    namespace: "contact.notifications.leadFields",
  })

  const notProvided = tFields("notProvided")
  const phoneDisplay = formatPhoneForDisplay(args.phone)

  const rows: Array<[string, string]> = [
    [tFields("name"), args.name],
    [tFields("email"), args.email],
    [tFields("phone"), phoneDisplay],
    [tFields("company"), args.company ?? notProvided],
    [tFields("projectType"), args.projectType ?? notProvided],
    [tFields("budget"), args.budget ?? notProvided],
    [tFields("details"), args.notes ?? notProvided],
  ]

  const subject = t("leadSubject", { name: args.name })

  const htmlRows = rows
    .map(
      ([label, value]) =>
        `<p class="vetd-label" style="${LABEL_STYLE}">${escapeHtml(label)}</p>` +
        `<p class="vetd-value" style="${VALUE_STYLE}">${escapeHtml(value)}</p>`,
    )
    .join("")

  const inner =
    `<div class="vetd-shell" style="${SHELL_STYLE}">` +
    `<div class="vetd-card" style="${CARD_STYLE}">` +
    `<p class="vetd-heading" style="${HEADING_STYLE}">Vetd — ${escapeHtml(subject)}</p>` +
    `<p class="vetd-body" style="${BODY_STYLE}">${escapeHtml(t("leadIntro"))}</p>` +
    htmlRows +
    `</div>` +
    `</div>`

  const html = wrapHtmlDocument(inner)

  const text =
    `${t("leadIntro")}\n\n` +
    rows.map(([label, value]) => `${label}: ${value}`).join("\n")

  return { subject, html, text }
}

export async function contactLeadAutoReply(
  args: ContactLeadAutoReplyArgs,
): Promise<RenderedEmail> {
  const t = await getTranslations({
    locale: args.locale,
    namespace: "contact.notifications",
  })

  const subject = t("autoReplySubject")
  const greeting = t("autoReplyGreeting", { name: args.name })
  const body = t("autoReplyBody")
  const bookCta = t("autoReplyBookCta", { url: site.discoveryCallHref })
  const signoff = t("autoReplySignoff")

  const inner =
    `<div class="vetd-shell" style="${SHELL_STYLE}">` +
    `<div class="vetd-card" style="${CARD_STYLE}">` +
    `<p class="vetd-heading" style="${HEADING_STYLE}">Vetd</p>` +
    `<p class="vetd-body" style="${BODY_STYLE}">${escapeHtml(greeting)}</p>` +
    `<p class="vetd-body" style="${BODY_STYLE}">${escapeHtml(body)}</p>` +
    `<p class="vetd-body" style="${BODY_STYLE}">${escapeHtml(bookCta)}</p>` +
    `<p class="vetd-body" style="${BODY_STYLE}">${escapeHtml(signoff)}</p>` +
    `</div>` +
    `</div>`

  const html = wrapHtmlDocument(inner)

  const text = `${greeting}\n\n${body}\n\n${bookCta}\n\n${signoff}`

  return { subject, html, text }
}

// Transactional emails sent from a rep's Gmail (proposal/contract/deposit
// link) intentionally avoid the branded-template look used for marketing
// auto-replies. They should read like a personal note a rep typed — Gmail
// renders the attachment or button on its own, so we skip logos, card
// borders, and labels. System fonts inherit from the client.
const PERSONAL_EMAIL_STYLE =
  "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:15px;line-height:1.55;color:#1f1f1f;"

const PERSONAL_DARK_MODE_STYLES = `
  @media (prefers-color-scheme: dark) {
    .vetd-personal { color:#e5e5e5 !important; }
    .vetd-personal a { color:#8ab4f8 !important; }
  }
`

const PAY_BUTTON_STYLE =
  "display:inline-block;background:#0a0a0a;color:#ffffff !important;text-decoration:none;padding:12px 22px;font-size:15px;font-weight:500;"

function wrapPersonalEmail(bodyInner: string): string {
  return (
    `<!doctype html>` +
    `<html lang="en">` +
    `<head>` +
    `<meta charset="utf-8" />` +
    `<meta name="viewport" content="width=device-width,initial-scale=1" />` +
    `<meta name="color-scheme" content="light dark" />` +
    `<meta name="supported-color-schemes" content="light dark" />` +
    `<style>${PERSONAL_DARK_MODE_STYLES}</style>` +
    `</head>` +
    `<body style="margin:0;padding:0;">` +
    `<div class="vetd-personal" style="${PERSONAL_EMAIL_STYLE}max-width:560px;padding:8px 4px;">` +
    bodyInner +
    `</div>` +
    `</body>` +
    `</html>`
  )
}

function paragraphs(parts: string[]): string {
  return parts
    .map(
      (p) =>
        `<p style="margin:0 0 14px;">${escapeHtml(p).replace(/\n/g, "<br />")}</p>`,
    )
    .join("")
}

export type DocumentEmailKind =
  | "proposal"
  | "contract"
  | "sow"
  | "nda"
  | "invoice_terms"

type DocumentBodyCopy = {
  subject: (ctx: { projectTitle: string | null; clientName: string }) => string
  defaultBody: (ctx: {
    firstName: string
    projectTitle: string | null
  }) => string[]
}

const DOCUMENT_BODY_COPY: Record<DocumentEmailKind, DocumentBodyCopy> = {
  proposal: {
    subject: ({ projectTitle, clientName }) =>
      projectTitle
        ? `Proposal — ${projectTitle}`
        : `Proposal for ${clientName}`,
    defaultBody: ({ projectTitle }) => [
      `Attached is the proposal we put together${projectTitle ? ` for ${projectTitle}` : ""}. It covers the scope, timeline, and pricing.`,
      `Take your time reviewing — happy to jump on a call to walk through anything that's unclear. Once you're good on the direction, I'll send over a services agreement to lock it in.`,
    ],
  },
  contract: {
    subject: ({ projectTitle, clientName }) =>
      projectTitle
        ? `Services agreement — ${projectTitle}`
        : `Services agreement for ${clientName}`,
    defaultBody: ({ projectTitle }) => [
      `Attached is the services agreement for our work${projectTitle ? ` on ${projectTitle}` : ""}. Have a read through when you get a moment.`,
      `If any of the terms look off or you have questions, just reply and I'll make adjustments. Once you're comfortable, sign and send it back and I'll follow up with the deposit link to kick things off.`,
    ],
  },
  sow: {
    subject: ({ projectTitle, clientName }) =>
      projectTitle
        ? `Statement of work — ${projectTitle}`
        : `Statement of work for ${clientName}`,
    defaultBody: ({ projectTitle }) => [
      `Attached is the statement of work${projectTitle ? ` for ${projectTitle}` : ""} — scope, deliverables, and milestones.`,
      `Let me know if anything needs tweaking. Otherwise sign it back when you're ready and we'll proceed.`,
    ],
  },
  nda: {
    subject: ({ clientName }) => `NDA for ${clientName}`,
    defaultBody: () => [
      `Attached is the NDA covering the conversations we've been having. It's a standard mutual agreement — nothing unusual in there.`,
      `Sign it back whenever you're ready so we can get into the details.`,
    ],
  },
  invoice_terms: {
    subject: ({ projectTitle, clientName }) =>
      projectTitle
        ? `Invoice terms — ${projectTitle}`
        : `Invoice terms for ${clientName}`,
    defaultBody: ({ projectTitle }) => [
      `Attached are the invoice terms${projectTitle ? ` for ${projectTitle}` : ""}. Let me know if you need any changes.`,
    ],
  },
}

export type DocumentEmailArgs = {
  kind: DocumentEmailKind
  documentTitle: string
  clientName: string
  repName: string
  /** Project this doc is tied to, used in the subject and body. */
  projectTitle: string | null
  /** Optional personal note from the rep — replaces the default body copy. */
  message?: string | null
}

export async function documentEmail(
  args: DocumentEmailArgs,
): Promise<RenderedEmail> {
  const copy = DOCUMENT_BODY_COPY[args.kind]
  const firstName = args.clientName.split(/\s+/)[0] || args.clientName
  const subject = copy.subject({
    projectTitle: args.projectTitle,
    clientName: args.clientName,
  })
  const greeting = `Hi ${firstName},`
  const bodyParagraphs = args.message?.trim()
    ? [args.message.trim()]
    : copy.defaultBody({ firstName, projectTitle: args.projectTitle })
  const signoff = args.repName

  const html = wrapPersonalEmail(
    paragraphs([greeting, ...bodyParagraphs]) +
      `<p style="margin:24px 0 0;">Thanks,<br />${escapeHtml(signoff)}</p>`,
  )

  const text = [
    greeting,
    "",
    ...bodyParagraphs,
    "",
    "Thanks,",
    signoff,
  ].join("\n")

  return { subject, html, text }
}

export type DepositLinkEmailArgs = {
  projectTitle: string
  clientName: string
  repName: string
  amountFormatted: string
  url: string
  message?: string | null
}

export async function depositLinkEmail(
  args: DepositLinkEmailArgs,
): Promise<RenderedEmail> {
  const firstName = args.clientName.split(/\s+/)[0] || args.clientName
  const subject = `Deposit for ${args.projectTitle}`
  const greeting = `Hi ${firstName},`
  const defaultIntro = `Here's the secure link to pay the ${args.amountFormatted} deposit for ${args.projectTitle}. Once it clears we'll kick off.`
  const defaultFollowup = `Takes a couple minutes via Stripe. Let me know if you hit any issues.`
  const bodyParagraphs = args.message?.trim()
    ? [args.message.trim()]
    : [defaultIntro, defaultFollowup]

  const url = escapeHtml(args.url)
  const html = wrapPersonalEmail(
    paragraphs([greeting, ...bodyParagraphs]) +
      `<p style="margin:0 0 14px;">` +
      `<a href="${url}" style="${PAY_BUTTON_STYLE}">Pay ${escapeHtml(args.amountFormatted)} deposit</a>` +
      `</p>` +
      `<p style="margin:0 0 20px;font-size:13px;color:#666666;">` +
      `Or paste this into your browser: <a href="${url}">${url}</a>` +
      `</p>` +
      `<p style="margin:24px 0 0;">Thanks,<br />${escapeHtml(args.repName)}</p>`,
  )

  const text = [
    greeting,
    "",
    ...bodyParagraphs,
    "",
    `Pay deposit: ${args.url}`,
    "",
    "Thanks,",
    args.repName,
  ].join("\n")

  return { subject, html, text }
}

// TODO: depositReceipt, projectStatusUpdate, commissionStatement — add when needed.
