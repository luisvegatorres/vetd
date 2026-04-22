// Structured content model for document templates.
// A template's `body` column is an array of these blocks. The render pipeline
// (lib/documents/pdf.tsx) maps each block type to a @react-pdf/renderer
// primitive, and token strings like {{client.name}} are resolved against the
// context data before rendering.

export type HeadingBlock = {
  type: "heading"
  level: 1 | 2 | 3
  text: string
}

export type ParagraphBlock = {
  type: "paragraph"
  text: string
}

export type BulletsBlock = {
  type: "bullets"
  items: string[]
}

export type KeyValueBlock = {
  type: "kv"
  items: { label: string; value: string }[]
}

export type DividerBlock = {
  type: "divider"
}

export type SpacerBlock = {
  type: "spacer"
  size?: "sm" | "md" | "lg"
}

export type SignatureBlock = {
  type: "signature"
  label: string
}

export type DocumentBlock =
  | HeadingBlock
  | ParagraphBlock
  | BulletsBlock
  | KeyValueBlock
  | DividerBlock
  | SpacerBlock
  | SignatureBlock

export type DocumentBody = DocumentBlock[]

export function isDocumentBody(value: unknown): value is DocumentBody {
  return Array.isArray(value) && value.every(isDocumentBlock)
}

function isDocumentBlock(value: unknown): value is DocumentBlock {
  if (!value || typeof value !== "object") return false
  const type = (value as { type?: string }).type
  return (
    type === "heading" ||
    type === "paragraph" ||
    type === "bullets" ||
    type === "kv" ||
    type === "divider" ||
    type === "spacer" ||
    type === "signature"
  )
}

/**
 * Walk every string field in a body and collect unique `{{...}}` tokens,
 * so the admin UI can surface the variables a template declares without
 * a separate declaration step.
 */
export function extractTokens(body: DocumentBody): string[] {
  const tokens = new Set<string>()
  const re = /\{\{\s*([a-z0-9_.]+)\s*\}\}/gi

  const collect = (s: string) => {
    for (const m of s.matchAll(re)) tokens.add(m[1])
  }

  for (const block of body) {
    switch (block.type) {
      case "heading":
      case "paragraph":
        collect(block.text)
        break
      case "bullets":
        block.items.forEach(collect)
        break
      case "kv":
        block.items.forEach((kv) => {
          collect(kv.label)
          collect(kv.value)
        })
        break
      case "signature":
        collect(block.label)
        break
    }
  }

  return Array.from(tokens).sort()
}
