import "server-only"

import { DEFAULT_GEMINI_MODEL } from "@/lib/gemini/client"
import { generateText } from "@/lib/gemini/generate"

const NO_EM_DASH_RULE =
  "Do not use em dashes. Use periods, commas, or parentheses instead."

const VOICE_RULE =
  "Voice: confident, plain-spoken, useful. Short sentences. No filler. No marketing fluff."

// Instagram is the client-acquisition channel for three specific verticals:
// restaurants, cafes, Airbnb / short-term rental hosts. The pattern is
// pain-led: name a gap their business has, name what it costs them, then
// imply or state the fix. The X/Twitter channel (future) will carry the
// dev-process and technical content. Keep that split in mind.
//
// The `image_prompt` field is now a brief for the human creator, not for
// an image model. Gemini still produces it because the visual direction
// (composition, mood, on-image headline) is the same advice either way.
const POST_SYSTEM_INSTRUCTION = `You generate Instagram post drafts for Vetd, a digital agency that builds custom websites, mobile apps, web apps, and AI integrations for small businesses.

CURRENT TARGET VERTICALS (each post must address exactly ONE):
- Restaurant owners
- Cafe / coffee shop owners
- Airbnb and short-term rental hosts

The audience is the OWNER or OPERATOR of one of these businesses, not a developer or marketer. Write for the buyer.

Output ONLY a JSON object on a single line with this exact shape, no markdown fence, no commentary:
{"topic": "<5 to 8 word summary>", "caption": "<caption text>", "image_prompt": "<image brief for the human creator>"}

CORE PATTERN — every caption follows this three-beat structure:
1. ADDRESS them directly by vertical. Examples: "Airbnb hosts:", "Restaurant owners:", "Cafe owners:".
2. NAME a concrete gap they currently have AND the cost of that gap. The cost should be tangible: lost bookings, lost orders, lost repeat customers, platform fees eaten, no-shows, invisibility on Google, dead-end Instagram traffic, missed slow hours.
3. STATE the fix in one short sentence and a delivery promise (days, not months).

Pain angles to draw from, rotate freely:
- Airbnb / STR hosts:
  • Paying 14 to 17 percent in Airbnb fees on every booking that could have been direct
  • No website, so guests vet you only on the listing platforms (where competitors win on price)
  • No SEO presence for "<city> + <neighborhood> + stay" searches
  • No automated guest comms (check-in info, local guides, upsells)
  • Repeat guests have no way to rebook with you directly
- Restaurants:
  • No online ordering, only the phone or DoorDash (which takes 30 percent)
  • A static menu PDF instead of a real site, so Google shows nothing rich
  • No reservation system, just DMs to the host stand
  • No way to capture diners' emails after they leave, so no return visits
  • Instagram traffic dead-ends because there is no website to send them to
- Cafes:
  • No loyalty program, so 80 percent of foot traffic never returns within 30 days
  • Paper punch cards that get lost
  • No online ordering for the morning rush, so commuters skip you
  • No mobile-friendly site, so Google maps is the entire brand experience
  • No SMS or app to push slow-hour deals when you need them

Caption rules:
- 80 to 220 characters total including hashtags. Short beats thorough.
- ${VOICE_RULE}
- ${NO_EM_DASH_RULE}
- Quantify the cost where you can ("17 percent fee", "30 percent commission", "8 in 10 first-timers never return"). Round numbers are fine; do not invent specific case-study stats.
- 3 to 5 hashtags at the end, lowercase, no spaces inside.
- Hashtags MUST be vertical-specific. Good examples by vertical:
  • Airbnb: #airbnbhost, #airbnbhosts, #shorttermrental, #strhost, #vacationrental, #vrbo, #superhost
  • Restaurant: #restaurantowner, #restaurantmarketing, #restaurantbusiness, #localrestaurant, #restaurantowners
  • Cafe: #cafeowner, #cafebusiness, #coffeeshopowner, #independentcafe, #specialtycoffee
- BAD (never use): #coding, #javascript, #nextjs, #webdevelopment, #developer, #softwareengineering, #techstack, #digitalagency, #growthtips (too generic), #leadgen.

Image brief rules (this guides a human creating the image, not an AI):
- The image shows the SOLUTION (polished website / app / dashboard) so the scroller sees the upgrade visually, while the caption articulates the pain. Pain in words, gain in pixels.
- Composition: portrait 4:5, clean light or dark gradient background, with a centered photorealistic product mockup tied to the vertical:
  • For an Airbnb-host post: a modern direct-booking website mockup on a laptop or browser frame, with a hero photo of a tasteful interior. Or a guest-comms dashboard.
  • For a restaurant post: a restaurant website with online ordering, a phone showing a clean ordering flow, or a reservation widget.
  • For a cafe post: a phone showing a loyalty app, a mobile ordering screen, or a clean cafe website with hours/menu.
- INCLUDE one short bold headline as actual text inside the image, 2 to 5 words max, sans-serif, large weight, high contrast, placed above or beside the mockup. The headline names the OUTCOME, not the pain. Examples by vertical: "Direct bookings", "Skip the platform fee", "Order online", "Reserve in seconds", "Loyalty that sticks", "Built in 10 days".
- State the headline text VERBATIM in the brief using the format: text reads exactly: "<headline>".
- Mood: confident, premium, modern. Like a SaaS or design agency hero, not abstract gradient art.
- Color palette: clean light gradient (sky blue to white, warm cream to white) OR dark mode (deep black to charcoal). Occasional accent of electric blue or coral.
- AVOID: photorealistic people as the subject, busy compositions, abstract gradients without a product, hand-drawn / illustrated / cartoon / retro / grunge / stock-photo aesthetics.`

export type GeneratedPostShape = {
  topic: string
  caption: string
  image_prompt: string
}

export type CaptionGenerationResult =
  | { ok: true; post: GeneratedPostShape }
  | { ok: false; error: string }

function tryParsePost(raw: string): GeneratedPostShape | null {
  // Gemini occasionally wraps JSON in a code fence even when told not to.
  // Strip common fence patterns before parsing.
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim()
  try {
    const parsed = JSON.parse(cleaned) as Partial<GeneratedPostShape>
    if (
      typeof parsed.topic === "string" &&
      typeof parsed.caption === "string" &&
      typeof parsed.image_prompt === "string"
    ) {
      return {
        topic: parsed.topic,
        caption: parsed.caption,
        image_prompt: parsed.image_prompt,
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Asks Gemini for a fresh post idea and returns the parsed JSON. The
 * caller decides what to do with caption/image_prompt next.
 */
export async function generatePostIdea(
  hint?: string,
): Promise<CaptionGenerationResult> {
  const userPrompt = hint?.trim()
    ? `Generate one Instagram draft on this theme: ${hint.trim()}`
    : "Generate one Instagram draft. Pick a focus angle different from a typical post."

  const result = await generateText({
    prompt: userPrompt,
    systemInstruction: POST_SYSTEM_INSTRUCTION,
    temperature: 0.9,
    config: { responseMimeType: "application/json" },
  })
  if (!result.ok) return { ok: false, error: result.error }

  const parsed = tryParsePost(result.text)
  if (!parsed) {
    return {
      ok: false,
      error: `Model returned malformed JSON: ${result.text.slice(0, 200)}`,
    }
  }
  return { ok: true, post: parsed }
}

/**
 * Asks Gemini to rewrite a caption, keeping the same image_prompt context.
 * Returns just the caption text.
 */
export async function regenerateCaption(input: {
  topic: string
  imagePrompt: string
  previous: string
  hint?: string
}): Promise<{ ok: true; caption: string } | { ok: false; error: string }> {
  const result = await generateText({
    prompt: `Rewrite this Instagram caption with a different angle while keeping it tied to the same visual and the same target vertical (restaurant owner, cafe owner, or Airbnb host).

Topic: ${input.topic}
Image idea: ${input.imagePrompt}
Previous caption: ${input.previous}
${input.hint?.trim() ? `Direction: ${input.hint.trim()}` : ""}

Output ONLY the new caption text. Follow the three-beat pattern: 1) address the vertical directly ("Airbnb hosts:" / "Restaurant owners:" / "Cafe owners:"), 2) name a concrete gap and what it costs them (lost bookings, platform fees, lost repeat customers), 3) state the fix in one short sentence with a delivery promise. 80 to 220 characters total. ${VOICE_RULE} ${NO_EM_DASH_RULE} 3 to 5 vertical-specific hashtags (e.g. #airbnbhost, #restaurantowner, #cafeowner). Do NOT use developer tags or generic ones like #growthtips or #leadgen.`,
    systemInstruction: POST_SYSTEM_INSTRUCTION,
    temperature: 0.9,
    model: DEFAULT_GEMINI_MODEL,
  })
  if (!result.ok) return { ok: false, error: result.error }
  return { ok: true, caption: result.text.trim() }
}
