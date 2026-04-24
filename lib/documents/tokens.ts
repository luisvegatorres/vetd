// Deterministic token resolver. Given a context object of
// { client, project, subscription, company, today, ... } and a string like
// "Proposal for {{client.business}} — {{project.title}}", returns the string
// with tokens replaced by the corresponding values.
//
// Intentionally not AI: merge fields must be exact. AI-generated narrative
// sections are a separate concern (see lib/documents/ai-blocks.ts if added).

import { DocumentBody, type DocumentBlock } from "./blocks"

export type TokenContext = Record<string, unknown>

const TOKEN_RE = /\{\{\s*([a-z0-9_.]+)\s*\}\}/gi

function lookup(context: TokenContext, path: string): string {
  const parts = path.split(".")
  let cursor: unknown = context
  for (const key of parts) {
    if (cursor == null || typeof cursor !== "object") return ""
    cursor = (cursor as Record<string, unknown>)[key]
  }
  if (cursor == null) return ""
  if (typeof cursor === "string") return cursor
  if (typeof cursor === "number" || typeof cursor === "boolean") {
    return String(cursor)
  }
  return ""
}

export function resolveString(input: string, context: TokenContext): string {
  return input.replace(TOKEN_RE, (_match, path: string) =>
    lookup(context, path.toLowerCase()),
  )
}

export function resolveBody(
  body: DocumentBody,
  context: TokenContext,
): DocumentBody {
  return body.map((block) => resolveBlock(block, context))
}

function resolveBlock(
  block: DocumentBlock,
  context: TokenContext,
): DocumentBlock {
  switch (block.type) {
    case "heading":
    case "paragraph":
      return { ...block, text: resolveString(block.text, context) }
    case "bullets":
      return {
        ...block,
        items: block.items.map((i) => resolveString(i, context)),
      }
    case "kv":
      return {
        ...block,
        items: block.items.map((kv) => ({
          label: resolveString(kv.label, context),
          value: resolveString(kv.value, context),
        })),
      }
    case "signature":
      return { ...block, label: resolveString(block.label, context) }
    case "divider":
    case "spacer":
      return block
  }
}
