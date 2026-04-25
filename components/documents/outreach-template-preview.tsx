"use client"

import { useMemo } from "react"

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
    const previewHtml = fullHtml.replace(
      "</head>",
      "<style>.vetd-personal{max-width:100%!important;padding:8px 0!important;}</style></head>"
    )
    return { resolvedSubject: finalSubject, html: previewHtml }
  }, [subject, body, referenceUrl, linkText])

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
        <div className="min-h-0 flex-1 bg-white">
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
