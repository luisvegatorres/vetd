// Single source of truth for the template block grammar and merge-field
// catalog. Consumed by the Insert popover (for clickable snippets) and by
// the CodeMirror autocomplete in the body editor (for live completions).

export type BlockOption = {
  key: string
  label: string
  description: string
  /** Pretty-printed JSON snippet dropped at the caret by Insert. */
  snippet: string
}

export const BLOCKS: BlockOption[] = [
  {
    key: "heading",
    label: "Heading",
    description: "Section title (level 1, 2, or 3)",
    snippet: `{
  "type": "heading",
  "level": 2,
  "text": "Section title"
}`,
  },
  {
    key: "paragraph",
    label: "Paragraph",
    description: "Block of body copy",
    snippet: `{
  "type": "paragraph",
  "text": "…"
}`,
  },
  {
    key: "bullets",
    label: "Bullets",
    description: "Bulleted list",
    snippet: `{
  "type": "bullets",
  "items": ["First", "Second"]
}`,
  },
  {
    key: "kv",
    label: "Key-value",
    description: "Label / value rows (pricing, terms)",
    snippet: `{
  "type": "kv",
  "items": [
    { "label": "Project total", "value": "{{project.value}}" }
  ]
}`,
  },
  {
    key: "divider",
    label: "Divider",
    description: "Horizontal rule",
    snippet: `{ "type": "divider" }`,
  },
  {
    key: "spacer",
    label: "Spacer",
    description: "Vertical spacing: sm, md, or lg",
    snippet: `{
  "type": "spacer",
  "size": "md"
}`,
  },
  {
    key: "signature",
    label: "Signature",
    description: "Signature line with caption",
    snippet: `{
  "type": "signature",
  "label": "{{client.business}} — {{client.name}}"
}`,
  },
]

/** Names accepted by the `type` field on a block. */
export const BLOCK_TYPES = BLOCKS.map((b) => b.key)

/** Accepted values for the `size` field on a spacer block. */
export const SPACER_SIZES = ["sm", "md", "lg"] as const

/** Accepted values for the `level` field on a heading block. */
export const HEADING_LEVELS = [1, 2, 3] as const

export type TokenGroup = {
  label: string
  tokens: { name: string; description: string }[]
}

export const TOKEN_GROUPS: TokenGroup[] = [
  {
    label: "Client",
    tokens: [
      { name: "client.name", description: "Primary contact name" },
      { name: "client.business", description: "Company / business name" },
      { name: "client.email", description: "Contact email" },
      { name: "client.phone", description: "Contact phone" },
      { name: "client.address", description: "Street address" },
      { name: "client.location", description: "City, region" },
      { name: "client.industry", description: "Client industry" },
    ],
  },
  {
    label: "Project",
    tokens: [
      { name: "project.title", description: "Project title" },
      { name: "project.description", description: "Scope summary" },
      { name: "project.value", description: "Total value (formatted $)" },
      { name: "project.deposit_amount", description: "Deposit (formatted $)" },
      { name: "project.deposit_rate", description: "Deposit % (e.g. 30)" },
      { name: "project.currency", description: "ISO currency code" },
      { name: "project.start_date", description: "Start date" },
      { name: "project.deadline", description: "Deadline" },
      { name: "project.product_type", description: "Product type slug" },
      { name: "project.financing", description: "Yes / No" },
    ],
  },
  {
    label: "Subscription",
    tokens: [
      { name: "subscription.plan", description: "Plan name" },
      { name: "subscription.product", description: "Product / offering" },
      {
        name: "subscription.monthly_rate",
        description: "Monthly rate (formatted $)",
      },
      { name: "subscription.started_at", description: "Start date" },
    ],
  },
  {
    label: "Company",
    tokens: [
      { name: "company.name", description: "Agency name" },
      { name: "company.tagline", description: "Agency tagline" },
      { name: "company.email", description: "Agency email" },
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

/** Flattened { name, description, group } list, easier for CodeMirror completions. */
export const ALL_TOKENS = TOKEN_GROUPS.flatMap((g) =>
  g.tokens.map((tok) => ({ ...tok, group: g.label })),
)
