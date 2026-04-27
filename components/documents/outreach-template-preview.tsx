"use client"

import { useMemo } from "react"

import { useTheme } from "next-themes"

import {
  renderOutreachBodyHtml,
  wrapPersonalEmail,
} from "@/lib/email/personal-render"
import { buildOutreachContext, resolveOutreach } from "@/lib/outreach/tokens"

const SAMPLE_LEAD = {
  name: "Maria Estrella",
  company: "Villa Estrella PR",
  email: "maria@villaestrella.pr",
}

const SAMPLE_REP = {
  name: "Alex Rivera",
  email: "alex@vetd.agency",
  title: "Founder",
}

const DEFAULT_LINK_TEXT = "Click here"

type Props = {
  subject: string
  body: string
  referenceUrl: string
  referenceLabel: string
}

export function OutreachTemplatePreview({
  subject,
  body,
  referenceUrl,
  referenceLabel,
}: Props) {
  const linkText = referenceLabel.trim() || DEFAULT_LINK_TEXT

  const { resolvedTheme } = useTheme()
  // resolvedTheme is undefined on SSR and the first client render. Treating
  // anything-but-"light" as dark matches the app's defaultTheme="dark" so the
  // iframe srcDoc paints dark first and only flips on hydration if the user
  // actually has light enabled.
  const isDark = resolvedTheme !== "light"

  const { resolvedSubject, html } = useMemo(() => {
    const ctx = buildOutreachContext({
      leadName: SAMPLE_LEAD.name,
      leadCompany: SAMPLE_LEAD.company,
      leadEmail: SAMPLE_LEAD.email,
      linkText,
      rep: SAMPLE_REP,
    })
    const finalSubject = resolveOutreach(subject, ctx)
    const finalBody = resolveOutreach(body, ctx)
    const bodyHtml = renderOutreachBodyHtml(
      finalBody,
      referenceUrl.trim(),
      linkText
    )
    const fullHtml = wrapPersonalEmail(bodyHtml)
    // The shipped email uses padding:16px 20px and a 560px max-width so it
    // breathes inside Gmail / Mail.app. In the narrow preview iframe those
    // gutters look outsized, so we override with a tighter pad here only.
    // We also pin the iframe's color scheme to the app theme. The email's
    // built-in prefers-color-scheme rule follows the OS, not the app, so
    // without this the body can render light-on-light or dark-on-dark.
    // Background tracks --background from app/globals.css so the preview
    // sits flush with the surrounding page (oklch(0.145 0 0) in dark,
    // oklch(1 0 0) in light). Iframes can't read parent CSS vars, so we
    // inline the literals.
    const overrideCss = isDark
      ? ".vetd-personal{max-width:100%!important;padding:8px 0!important;background:oklch(0.145 0 0)!important;color:#e5e5e5!important;}" +
        ".vetd-personal a{color:#8ab4f8!important;}" +
        "html,body{background:oklch(0.145 0 0)!important;}"
      : ".vetd-personal{max-width:100%!important;padding:8px 0!important;background:oklch(1 0 0)!important;color:#1f1f1f!important;}" +
        "html,body{background:oklch(1 0 0)!important;}"
    const previewHtml = fullHtml.replace(
      "</head>",
      `<style>${overrideCss}</style></head>`
    )
    return { resolvedSubject: finalSubject, html: previewHtml }
  }, [subject, body, referenceUrl, linkText, isDark])

  return (
    <div className="flex h-full flex-col gap-4 border border-border/60 p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-overline font-medium text-muted-foreground uppercase">
          Live preview
        </p>
        <span className="text-xs text-muted-foreground">Sample lead</span>
      </div>

      <div className="space-y-1">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          To
        </p>
        <p className="text-sm">
          {SAMPLE_LEAD.name}{" "}
          <span className="text-muted-foreground">
            &lt;{SAMPLE_LEAD.email}&gt;
          </span>
        </p>
      </div>

      <div className="space-y-1">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          Subject
        </p>
        <p className="text-sm font-medium">
          {resolvedSubject || (
            <span className="text-muted-foreground">(empty)</span>
          )}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          Body
        </p>
        <div className="min-h-0 flex-1 bg-background">
          <iframe
            title="Outreach email preview"
            srcDoc={html}
            sandbox=""
            className="block h-full w-full"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Tokens render against a sample lead.
      </p>
    </div>
  )
}
