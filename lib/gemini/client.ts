import "server-only"

import { GoogleGenAI } from "@google/genai"

const apiKey = process.env.GEMINI_API_KEY

if (!apiKey) {
  throw new Error(
    "GEMINI_API_KEY is missing. Set it in .env.local (dev) or Vercel env (prod).",
  )
}

export const gemini = new GoogleGenAI({ apiKey })

export const DEFAULT_GEMINI_MODEL = "gemini-3.1-flash-lite-preview"
