/**
 * Targeting matrix for the daily AI-generated blog post pipeline.
 *
 * Every post is anchored on the intersection of:
 *   - one of Vetd's target verticals (the industries we sell to), and
 *   - one of the four tech focus areas we actually build (websites, SaaS,
 *     mobile apps, AI tools).
 *
 * The cron picks today's pair via deterministic day-of-year rotation through
 * the 5 × 4 = 20 combinations, so the editorial mix stays balanced across a
 * three-week cycle without any database lookup. Generation is grounded on
 * recent news (last 90 days) about the intersection so the content stays
 * timely instead of drifting into evergreen filler.
 */

export type Vertical = {
  id: string
  label: string
  /** Examples surfaced to Gemini so the post doesn't read as generic. */
  examples: readonly string[]
  /** Pain points to weave into the post when relevant. */
  pains: readonly string[]
}

export type TechFocus = {
  id: string
  label: string
  /** Plain-English description Gemini can reference. */
  description: string
}

export const VERTICALS: readonly Vertical[] = [
  {
    id: "restaurants",
    label: "Restaurants",
    examples: [
      "single-location restaurants",
      "small chains",
      "quick service",
      "fine dining",
      "ghost kitchens",
    ],
    pains: [
      "thin margins",
      "third-party delivery commissions eating profit",
      "online reservations and waitlist friction",
      "menu and inventory updates",
      "online review reputation",
    ],
  },
  {
    id: "hospitality",
    label: "Hospitality",
    examples: [
      "boutique hotels",
      "bed and breakfasts",
      "vacation rentals",
      "small inns",
      "resorts",
    ],
    pains: [
      "OTA commissions versus direct bookings",
      "guest communication at scale",
      "housekeeping and ops scheduling",
      "review management on TripAdvisor and Google",
      "seasonal demand swings",
    ],
  },
  {
    id: "cafes",
    label: "Cafes and coffee shops",
    examples: [
      "specialty coffee shops",
      "neighborhood cafes",
      "bakery and cafe combos",
      "drive-thru coffee",
      "mobile coffee carts",
    ],
    pains: [
      "morning rush throughput",
      "loyalty and repeat-visit retention",
      "social media presence on a tight budget",
      "online ordering and pickup",
      "staff turnover",
    ],
  },
  {
    id: "transportation",
    label: "Transportation",
    examples: [
      "limo and chauffeur services",
      "small taxi fleets",
      "non-emergency medical transport",
      "local delivery couriers",
      "shuttle and tour operators",
    ],
    pains: [
      "dispatch and routing efficiency",
      "online booking and quoting",
      "driver management and compliance",
      "fleet maintenance scheduling",
      "competing with ride-share apps",
    ],
  },
  {
    id: "home-services",
    label: "Home services",
    examples: [
      "HVAC contractors",
      "plumbers",
      "residential cleaners",
      "landscaping crews",
      "electricians",
      "pest control",
    ],
    pains: [
      "lead capture and response time",
      "scheduling and dispatch",
      "estimate-to-job conversion",
      "review velocity for local SEO",
      "recurring service contracts",
    ],
  },
] as const

export const TECH_FOCUS: readonly TechFocus[] = [
  {
    id: "websites",
    label: "Websites",
    description:
      "fast, mobile-first marketing sites built to rank in local search and convert visitors into bookings, calls, or quote requests",
  },
  {
    id: "saas",
    label: "SaaS platforms",
    description:
      "custom internal tools, client portals, booking systems, and admin dashboards built with Next.js and Supabase",
  },
  {
    id: "mobile-apps",
    label: "Mobile apps",
    description:
      "native iOS and Android apps built in Flutter, from product design through App Store and Play Store launch",
  },
  {
    id: "ai-tools",
    label: "AI tools and integrations",
    description:
      "AI-powered features bolted onto existing sites, apps, and workflows, including chat, recommendations, lead enrichment, and content automation",
  },
] as const

export type Angle = {
  vertical: Vertical
  tech: TechFocus
}

const ANGLE_COUNT = VERTICALS.length * TECH_FOCUS.length

/**
 * Deterministic rotation through every (vertical, tech) pair. With 5 × 4 = 20
 * combinations, the cycle resets every 20 days. Anchoring to UTC year start
 * keeps the rotation predictable and identical across environments.
 */
export function angleForDate(date: Date = new Date()): Angle {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1)
  const day = Math.floor((date.getTime() - start) / 86_400_000)
  const idx = ((day % ANGLE_COUNT) + ANGLE_COUNT) % ANGLE_COUNT
  const vertical = VERTICALS[idx % VERTICALS.length]!
  const tech = TECH_FOCUS[Math.floor(idx / VERTICALS.length) % TECH_FOCUS.length]!
  return { vertical, tech }
}

/**
 * Resolve an angle from optional vertical / tech ids. Missing pieces fall
 * back to today's rotation so the admin "Generate now" UI can lock just one
 * dimension (e.g. force vertical=restaurants, let tech rotate).
 */
export function resolveAngle({
  verticalId,
  techId,
  date,
}: {
  verticalId?: string
  techId?: string
  date?: Date
} = {}): Angle {
  const today = angleForDate(date)
  const vertical = verticalId
    ? (VERTICALS.find((v) => v.id === verticalId) ?? today.vertical)
    : today.vertical
  const tech = techId
    ? (TECH_FOCUS.find((t) => t.id === techId) ?? today.tech)
    : today.tech
  return { vertical, tech }
}

export function verticalById(id: string): Vertical | undefined {
  return VERTICALS.find((v) => v.id === id)
}

export function techById(id: string): TechFocus | undefined {
  return TECH_FOCUS.find((t) => t.id === id)
}

export function angleId(angle: Angle): string {
  return `${angle.vertical.id}__${angle.tech.id}`
}
