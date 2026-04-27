import "server-only"

import { ThinkingLevel } from "@google/genai"

import { generateText, type GenerateTextResult } from "@/lib/gemini/generate"

export type TranslateField = "title" | "excerpt" | "body"

const NO_EM_DASH_RULE =
  "Do not use em dashes (—). Use commas, periods, or parentheses instead."

const FIELD_HINTS: Record<TranslateField, string> = {
  title: "It is a blog post title. Keep it short. Title case is fine.",
  excerpt:
    "It is a meta description / excerpt. Keep it under ~155 characters when possible.",
  body: "It is the markdown body of a blog post. Preserve markdown structure exactly: headings, lists, code blocks, links, emphasis. Do not translate code inside code blocks or URLs.",
}

/**
 * Per-field EN to ES translator. No auth check — callers (cron / server
 * actions) decide whether the caller is allowed to invoke Gemini. Used by
 * both the daily auto-generation pipeline and the admin "Translate EN to
 * ES" button so the prompts stay identical.
 */
export async function translateFieldEnToEs(
  field: TranslateField,
  sourceText: string,
): Promise<GenerateTextResult> {
  const trimmed = sourceText.trim()
  if (!trimmed) return { ok: false, error: "Nothing to translate" }

  return generateText({
    prompt: `Translate the following English text to natural, fluent Spanish (Latin American). ${FIELD_HINTS[field]}\n\nSOURCE:\n${trimmed}`,
    systemInstruction: `You are a professional English to Spanish translator for a digital agency. Output only the translation, no commentary. Never prefix the translation with a horizontal rule (---) or any separator. ${NO_EM_DASH_RULE}`,
    temperature: 0.2,
    // Translation is near-deterministic on flash-lite. LOW gives a small
    // amount of reasoning headroom over MINIMAL (helps preserve markdown
    // structure on long bodies) while staying cheap and fast. Temperature
    // 0.2 keeps the output stable.
    thinkingLevel: ThinkingLevel.LOW,
  })
}
