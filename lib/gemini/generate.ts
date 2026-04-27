import "server-only"

import {
  ThinkingLevel,
  type ContentListUnion,
  type GenerateContentConfig,
} from "@google/genai"

import { DEFAULT_GEMINI_MODEL, gemini } from "./client"

export type GenerateTextArgs = {
  prompt?: string
  contents?: ContentListUnion
  systemInstruction?: string
  model?: string
  temperature?: number
  thinkingLevel?: ThinkingLevel
  config?: GenerateContentConfig
}

export type GenerateTextResult =
  | { ok: true; text: string }
  | { ok: false; error: string }

function buildParams(args: GenerateTextArgs) {
  const contents: ContentListUnion =
    args.contents ?? args.prompt ?? ""

  if (!args.contents && !args.prompt) {
    throw new Error("generate: provide either `prompt` or `contents`.")
  }

  const config: GenerateContentConfig = {
    thinkingConfig: {
      thinkingLevel: args.thinkingLevel ?? ThinkingLevel.MEDIUM,
    },
    ...(args.systemInstruction
      ? { systemInstruction: args.systemInstruction }
      : {}),
    ...(args.temperature !== undefined
      ? { temperature: args.temperature }
      : {}),
    ...args.config,
  }

  return {
    model: args.model ?? DEFAULT_GEMINI_MODEL,
    contents,
    config,
  }
}

export async function generateText(
  args: GenerateTextArgs,
): Promise<GenerateTextResult> {
  try {
    const response = await gemini.models.generateContent(buildParams(args))
    const text = response.text ?? ""
    return { ok: true, text }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, error: message }
  }
}

export async function* generateTextStream(
  args: GenerateTextArgs,
): AsyncIterable<string> {
  const stream = await gemini.models.generateContentStream(buildParams(args))
  for await (const chunk of stream) {
    if (chunk.text) yield chunk.text
  }
}

export type GroundingSource = {
  uri: string
  title: string | null
}

export type GenerateGroundedResult =
  | { ok: true; text: string; sources: GroundingSource[] }
  | { ok: false; error: string }

/**
 * Variant of `generateText` that enables Google Search grounding so the
 * model can retrieve and cite recent web content. Used by the daily blog
 * generator to anchor posts on real news from the last 90 days. The
 * `groundingMetadata` returned by Gemini is normalized into a small
 * `sources` array of `{ uri, title }` so callers can persist citations
 * without leaking the SDK's nested response shape.
 */
export async function generateGroundedText(
  args: GenerateTextArgs,
): Promise<GenerateGroundedResult> {
  // Merge our grounding tool into any caller-supplied tools array so
  // additional tools (when we add them later) compose cleanly.
  const callerTools = args.config?.tools ?? []
  const merged: GenerateTextArgs = {
    ...args,
    config: {
      ...(args.config ?? {}),
      tools: [...callerTools, { googleSearch: {} }],
    },
  }

  try {
    const response = await gemini.models.generateContent(buildParams(merged))
    const text = response.text ?? ""

    // The grounding metadata path is buried in the candidate. Different
    // Gemini versions stagger fields slightly, so we walk defensively and
    // dedupe by URI before returning.
    const seen = new Map<string, GroundingSource>()
    const candidates = response.candidates ?? []
    for (const cand of candidates) {
      const chunks = cand.groundingMetadata?.groundingChunks ?? []
      for (const chunk of chunks) {
        const web = chunk.web
        if (!web?.uri) continue
        if (!seen.has(web.uri)) {
          seen.set(web.uri, { uri: web.uri, title: web.title ?? null })
        }
      }
    }

    return { ok: true, text, sources: Array.from(seen.values()) }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, error: message }
  }
}
