// Outreach email tokens. Same `{{...}}` grammar as the document templates
// (see lib/documents/tokens.ts) so reps don't have to learn two systems, but
// scoped to the data we actually have at outreach time: a cold lead, the
// agency, today's date, and the per-send link text.
//
// The legacy single-brace tokens ({leadFirstName} / {businessName} /
// {referenceLink} / {referenceUrl}) seeded by migrations 0038 and 0039 keep
// working via a fallback substitution pass — existing templates do not need
// to be migrated by hand.

import { resolveString, type TokenContext } from "@/lib/documents/tokens"
import { site } from "@/lib/site"

export type OutreachTokenGroup = {
  label: string
  tokens: { name: string; description: string }[]
}

export const OUTREACH_TOKEN_GROUPS: OutreachTokenGroup[] = [
  {
    label: "Lead",
    tokens: [
      { name: "client.name_first", description: "First name" },
      { name: "client.name", description: "Full name" },
      { name: "client.business", description: "Business / company name" },
      { name: "client.email", description: "Email" },
    ],
  },
  {
    label: "Sender",
    tokens: [
      { name: "rep.name", description: "Your full name" },
      { name: "rep.name_first", description: "Your first name" },
      {
        name: "rep.title",
        description: "Your title / position (set in Settings)",
      },
      { name: "rep.email", description: "Your sending email address" },
    ],
  },
  {
    label: "Company",
    tokens: [
      { name: "company.name", description: "Your agency name" },
      { name: "company.tagline", description: "Your agency tagline" },
      { name: "company.email", description: "Your agency email" },
    ],
  },
  {
    label: "Reference",
    tokens: [
      {
        name: "outreach.link_text",
        description: "Friendly link text (rendered as a clickable link)",
      },
    ],
  },
  {
    label: "Date",
    tokens: [
      { name: "today", description: "Today's date (ISO)" },
      { name: "today_long", description: "Today's date (long form)" },
    ],
  },
]

export type OutreachRepInput = {
  name: string | null
  email: string | null
  title: string | null
}

export type OutreachContextInput = {
  leadName: string
  leadCompany: string | null
  leadEmail: string | null
  linkText: string
  rep?: OutreachRepInput | null
}

export function buildOutreachContext({
  leadName,
  leadCompany,
  leadEmail,
  linkText,
  rep,
}: OutreachContextInput): TokenContext {
  const today = new Date()
  const repName = rep?.name?.trim() ?? ""
  return {
    client: {
      name: leadName,
      name_first: leadName.split(/\s+/)[0] || leadName,
      business: leadCompany || leadName,
      email: leadEmail ?? "",
    },
    rep: {
      name: repName,
      name_first: repName ? (repName.split(/\s+/)[0] ?? repName) : "",
      email: rep?.email ?? "",
      title: rep?.title ?? "",
    },
    company: {
      name: site.name,
      tagline: site.tagline,
      email: site.email,
    },
    outreach: {
      link_text: linkText,
    },
    today: today.toISOString().slice(0, 10),
    today_long: today.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  }
}

export function resolveOutreach(text: string, context: TokenContext): string {
  const withDouble = resolveString(text, context)
  const firstName = readPath(context, ["client", "name_first"])
  const business = readPath(context, ["client", "business"])
  const linkText = readPath(context, ["outreach", "link_text"])
  return withDouble
    .replaceAll("{leadFirstName}", firstName)
    .replaceAll("{businessName}", business)
    .replaceAll("{referenceLink}", linkText)
    .replaceAll("{referenceUrl}", linkText)
}

function readPath(context: TokenContext, parts: string[]): string {
  let cursor: unknown = context
  for (const key of parts) {
    if (cursor == null || typeof cursor !== "object") return ""
    cursor = (cursor as Record<string, unknown>)[key]
  }
  return typeof cursor === "string" ? cursor : ""
}
