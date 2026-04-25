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
