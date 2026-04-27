"use server"

import { translateFieldEnToEs } from "@/lib/blog/translate"
import { generateText } from "@/lib/gemini/generate"
import { requireGeminiAccess } from "@/lib/gemini/auth"

export type AiResult = { ok: true; text: string } | { ok: false; error: string }
export type AiTagsResult =
  | { ok: true; tags: string[] }
  | { ok: false; error: string }

type TargetLocale = "en" | "es"

// Every Gemini system prompt explicitly bans em dashes — without it the model
// inserts them constantly, and Vetd's house style forbids them in marketing
// copy (per CLAUDE.md user memory).
const NO_EM_DASH_RULE =
  "Do not use em dashes (—). Use commas, periods, or parentheses instead."

const VOICE_RULE =
  "Voice: confident, plain-spoken, useful. Short sentences. No filler. No marketing fluff."

function localeName(locale: TargetLocale): string {
  return locale === "es" ? "Spanish" : "English"
}

async function requireBlogAdminAccess(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const access = await requireGeminiAccess()
  if (!access.ok) return access
  if (access.role !== "admin") {
    return { ok: false, error: "Only admins can use blog AI generation" }
  }
  return { ok: true }
}

/**
 * Generates a markdown outline (H2/H3 with one-line bullets under each) from
 * a topic. Output is meant to be pasted into the body editor as a starting
 * structure the author then fleshes out.
 */
export async function aiGenerateOutline(
  topic: string,
  locale: TargetLocale,
): Promise<AiResult> {
  const access = await requireBlogAdminAccess()
  if (!access.ok) return access

  const trimmed = topic.trim()
  if (!trimmed) return { ok: false, error: "Topic is required" }

  return generateText({
    prompt: `Topic: ${trimmed}\n\nWrite a markdown outline for a blog post on this topic. Use ## for major sections (4 to 6 of them) and - for one-line bullets under each section (2 to 4 bullets). No introduction, no conclusion section, just the outline. Output only markdown, no commentary.`,
    systemInstruction: `You write SEO-focused blog post outlines for a digital agency that builds websites, mobile apps, SaaS products, and AI integrations for small businesses. Write everything in ${localeName(locale)}. ${VOICE_RULE} ${NO_EM_DASH_RULE}`,
    temperature: 0.6,
  })
}

/**
 * Distills a body into a meta description (~155 chars) suitable for the
 * `excerpt` field. Used as the OG description and the search-result snippet.
 */
export async function aiSuggestExcerpt(
  body: string,
  locale: TargetLocale,
): Promise<AiResult> {
  const access = await requireBlogAdminAccess()
  if (!access.ok) return access

  const trimmed = body.trim()
  if (!trimmed) return { ok: false, error: "Body is empty" }

  return generateText({
    prompt: `Write a single meta description for this blog post. Maximum 155 characters. Plain prose, no quotes, no markdown.\n\nPost body:\n${trimmed.slice(0, 6000)}`,
    systemInstruction: `You write SEO meta descriptions for a digital agency blog. Write in ${localeName(locale)}. ${VOICE_RULE} ${NO_EM_DASH_RULE}`,
    temperature: 0.4,
  })
}

/**
 * Translates a single field (title / excerpt / body) from English to Spanish.
 * One call per field keeps prompts focused and lets the editor stream them
 * into the ES tab independently.
 */
export async function aiTranslate(
  field: "title" | "excerpt" | "body",
  sourceText: string,
): Promise<AiResult> {
  const access = await requireBlogAdminAccess()
  if (!access.ok) return access
  return translateFieldEnToEs(field, sourceText)
}

/**
 * Suggests 3 to 5 tags from the body. Returns parsed array, lowercased and
 * trimmed. Defensive parser tolerates the model returning JSON in a code
 * fence, JSON inline, or a comma-separated list.
 */
export async function aiSuggestTags(body: string): Promise<AiTagsResult> {
  const access = await requireBlogAdminAccess()
  if (!access.ok) return access

  const trimmed = body.trim()
  if (!trimmed) return { ok: false, error: "Body is empty" }

  const result = await generateText({
    prompt: `Suggest 3 to 5 SEO tags for this blog post. Return ONLY a JSON array of lowercase strings, no commentary, no code fence. Example: ["seo", "small business", "mobile app"]\n\nPost body:\n${trimmed.slice(0, 6000)}`,
    systemInstruction: `You suggest SEO tags for a digital agency blog. Tags are short (1 to 3 words), lowercase, descriptive. ${NO_EM_DASH_RULE}`,
    temperature: 0.3,
  })
  if (!result.ok) return result

  const tags = parseTagList(result.text)
  if (tags.length === 0) {
    return { ok: false, error: "Couldn't parse tags from AI response" }
  }
  return { ok: true, tags }
}

function parseTagList(raw: string): string[] {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim()

  // Try strict JSON first.
  try {
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) {
      return normalize(parsed.map(String))
    }
  } catch {
    // Fall through to comma split.
  }

  // Fallback: split on commas (handles "tag1, tag2, tag3").
  return normalize(cleaned.split(/[,\n]/))
}

function normalize(pieces: string[]): string[] {
  const seen = new Set<string>()
  for (const piece of pieces) {
    const tag = piece
      .trim()
      .toLowerCase()
      .replace(/^["'`]+|["'`]+$/g, "")
      .replace(/^[-*]\s+/, "")
      .trim()
    if (tag.length > 0 && tag.length <= 30) seen.add(tag)
  }
  return Array.from(seen).slice(0, 6)
}
