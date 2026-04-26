// Browser-safe rendering helpers for personal (rep-sent) emails. The same
// shape used by the server action that actually sends the email — kept here
// so the live-preview component in the outreach template editor can show
// reps the exact HTML the recipient will see.
//
// templates.ts mirrors `escapeHtml`, `paragraphs`, and `wrapPersonalEmail`
// for its own use; that module is `"server-only"` because of next-intl, so
// we can't import from it on the client. The duplication here is tiny and
// these are pure string utilities — drift risk is low.

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function paragraphs(parts: string[]): string {
  return parts
    .map(
      (p) =>
        `<p style="margin:0 0 14px;">${escapeHtml(p).replace(/\n/g, "<br />")}</p>`
    )
    .join("")
}

const PERSONAL_EMAIL_STYLE =
  "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:15px;line-height:1.55;color:#1f1f1f;"

const PERSONAL_DARK_MODE_STYLES = `
  @media (prefers-color-scheme: dark) {
    .vetd-personal { color:#e5e5e5 !important; }
    .vetd-personal a { color:#8ab4f8 !important; }
  }
`

export function wrapPersonalEmail(bodyInner: string): string {
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
    `<div class="vetd-personal" style="${PERSONAL_EMAIL_STYLE}max-width:560px;padding:16px 20px;">` +
    bodyInner +
    `</div>` +
    `</body>` +
    `</html>`
  )
}

// Same paragraph-split + linkify pass the server uses in
// app/(protected)/leads/outreach-actions.ts → renderHtmlBody. Whenever the
// link text appears inside a paragraph we wrap it in <a href={referenceUrl}>;
// the comparison runs against the *escaped* form so apostrophes / ampersands
// in the link text still match after escaping.
export function renderOutreachBodyHtml(
  body: string,
  referenceUrl: string,
  linkText: string
): string {
  const parts = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)

  if (!referenceUrl || !linkText) return paragraphs(parts)

  const safeUrl = escapeHtml(referenceUrl)
  const safeLabel = escapeHtml(linkText)
  const linkHtml = `<a href="${safeUrl}">${safeLabel}</a>`
  const escapedLinkText = escapeHtml(linkText)

  return parts
    .map((p) => {
      const escaped = escapeHtml(p)
        .replaceAll(escapedLinkText, linkHtml)
        .replace(/\n/g, "<br />")
      return `<p style="margin:0 0 14px;">${escaped}</p>`
    })
    .join("")
}

// Signature block uses a subtle top divider so it reads as separate from the
// body without competing with it. Mirrors renderSignatureHtml in
// lib/email/signature.ts.
export function renderSignatureHtml(signature: string): string {
  const lines = signature.split("\n").map((line) => escapeHtml(line))
  const inner = lines.join("<br />")
  return (
    `<div style="margin:24px 0 0;padding-top:12px;border-top:1px solid #e5e5e5;color:#6b6b6b;font-size:13px;line-height:1.5;">` +
    inner +
    `</div>`
  )
}
