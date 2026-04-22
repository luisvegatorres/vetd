export const site = {
  name: "Innovate App Studios",
  tagline: "Digital products that grow businesses.",
  description:
    "Websites, mobile apps, SaaS products, and AI integrations built to perform and designed to convert.",
  email: "hello@innovateappstudios.com",
  location: "Global ▪ Remote-first",
  responseTime: "Within 24 hours — usually same day.",
  discoveryCallHref: process.env.NEXT_PUBLIC_CALENDLY_URL || "/contact",
  calLink: process.env.NEXT_PUBLIC_CAL_LINK || "",
  whatsappDisplay:
    process.env.NEXT_PUBLIC_WHATSAPP_DISPLAY ||
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
    "[your number]",
} as const

export const nav = [
  { href: "/#home", label: "Home" },
  { href: "/#products", label: "Products" },
  { href: "/#process", label: "Process" },
  { href: "/#work", label: "Work" },
  { href: "/#about", label: "About" },
  { href: "/financing", label: "Financing" },
  { href: "/contact", label: "Contact" },
] as const

export type Product = {
  id:
    | "marketing-website"
    | "mobile-app"
    | "web-app"
    | "ai-integration"
  name: string
  tagline: string
  description: string
  timeline: string
  pricingTiers?: string[]
  includes?: string[]
  tools?: { name: string; slug: string }[]
  financingEligible?: boolean
}

export const financing = {
  minAmount: 5000,
  months: 12,
  depositRate: 30,
  financingFeeRate: 0,
  headlineShort: "0% ▪ Spread the 70% balance over 12 months",
  eligibilityNote: "Projects $5K+",
} as const

export type WebsitePlanId = "presence" | "growth" | "custom"

export type WebsitePlan = {
  id: WebsitePlanId
  label: string
  monthlyRate: number | null
  blurb: string
}

export const websitePlans: WebsitePlan[] = [
  {
    id: "presence",
    label: "Presence",
    monthlyRate: 97,
    blurb: "Website, hosting, basic SEO",
  },
  {
    id: "growth",
    label: "Growth",
    monthlyRate: 247,
    blurb: "Full SEO, content, reviews, monthly reports",
  },
  {
    id: "custom",
    label: "Custom",
    monthlyRate: null,
    blurb: "Bespoke monthly retainer",
  },
] as const

export type BillablePlanId = Exclude<WebsitePlanId, "custom">

// Commission is a flat 10% of whatever the client actually pays — on both
// project value and every recurring subscription invoice. No per-plan tiers.
export const COMMISSION_RATE = 0.1

export type SubscriptionPlanConfig = {
  id: BillablePlanId
  label: string
  monthlyRate: number
  stripePriceId: string | undefined
}

export const subscriptionPlans: Record<BillablePlanId, SubscriptionPlanConfig> = {
  presence: {
    id: "presence",
    label: "Presence",
    monthlyRate: 97,
    stripePriceId: process.env.STRIPE_PRICE_ID_PRESENCE,
  },
  growth: {
    id: "growth",
    label: "Growth",
    monthlyRate: 247,
    stripePriceId: process.env.STRIPE_PRICE_ID_GROWTH,
  },
} as const

export function findPlanByStripePriceId(
  priceId: string,
): SubscriptionPlanConfig | undefined {
  return Object.values(subscriptionPlans).find(
    (plan) => plan.stripePriceId === priceId,
  )
}

export function findPlanByMonthlyRate(
  rate: number,
): SubscriptionPlanConfig | undefined {
  return Object.values(subscriptionPlans).find(
    (plan) => plan.monthlyRate === rate,
  )
}

export const products: Product[] = [
  {
    id: "marketing-website",
    name: "Website",
    tagline: "Get found. Look credible. Convert visitors.",
    description:
      "A fast, mobile-first website built with SEO from day one. Designed to turn traffic into leads, calls, and sales. Available as a one-time build or monthly — monthly includes ongoing SEO, Google Business, reports, and content updates.",
    timeline: "5–7 days",
    pricingTiers: [
      "Presence: $97/mo — website, hosting, basic SEO",
      "Growth: $247/mo — full SEO, content, reviews, monthly reports",
      "One-time project: custom quote",
      "No contract. Cancel anytime.",
    ],
    includes: [
      "Custom design & copy",
      "Hosting, domain, SSL",
      "On-page SEO & analytics",
      "WhatsApp & contact integration",
    ],
    tools: [
      { name: "Next.js", slug: "nextdotjs" },
      { name: "Tailwind CSS", slug: "tailwindcss" },
      { name: "Vercel", slug: "vercel" },
      { name: "Google", slug: "google" },
    ],
  },
  {
    id: "mobile-app",
    name: "Mobile App",
    tagline: "Your product in every pocket.",
    financingEligible: true,
    description:
      "Native iOS and Android apps built in Flutter. We take you from idea to App Store — architecture, design, development, and launch. Built for performance and scale.",
    timeline: "4–12 weeks",
    includes: [
      "iOS & Android from one codebase",
      "Product & UX design",
      "Backend & authentication",
      "App Store & Play Store launch",
    ],
    tools: [
      { name: "Flutter", slug: "flutter" },
      { name: "Firebase", slug: "firebase" },
      { name: "Apple", slug: "apple" },
      { name: "Google Play", slug: "googleplay" },
    ],
  },
  {
    id: "web-app",
    name: "SaaS Product",
    tagline: "Software your customers pay for.",
    financingEligible: true,
    description:
      "Custom SaaS products — booking platforms, client portals, admin dashboards, and subscription-ready apps. Built with Next.js and Supabase. Designed to ship fast and scale.",
    timeline: "3–8 weeks",
    includes: [
      "Role-based auth & permissions",
      "Database & admin dashboard",
      "Integrations & automations",
      "Analytics & reporting",
    ],
    tools: [
      { name: "Next.js", slug: "nextdotjs" },
      { name: "Supabase", slug: "supabase" },
      { name: "PostgreSQL", slug: "postgresql" },
    ],
  },
  {
    id: "ai-integration",
    name: "AI Integration",
    tagline: "Make your product smarter.",
    financingEligible: true,
    description:
      "We add AI-powered features to any website, app, or tool — intelligent chatbots, personalized recommendations, content automation, and more. Powered by the latest models from Anthropic, OpenAI, and Google.",
    timeline: "Depends on scope",
    includes: [
      "Chatbots & assistants",
      "Personalized recommendations",
      "Content & workflow automation",
      "Claude, GPT, and Gemini support",
    ],
    tools: [
      { name: "Anthropic", slug: "anthropic" },
      { name: "OpenAI", slug: "openai" },
      { name: "Google", slug: "google" },
    ],
  },
] as const

export type ProcessStep = {
  number: string
  title: string
  copy: string
}

export type ProcessArtifact = {
  kicker: string
  title: string
  bullets: readonly string[]
  meta: string
}

export const processArtifacts: Record<string, ProcessArtifact> = {
  "01": {
    kicker: "Deliverable ▪ 01",
    title: "Discovery call",
    bullets: [
      "Goals & constraints",
      "Success criteria",
      "Rough scope & timeline",
    ],
    meta: "20 min ▪ Free ▪ No pitch",
  },
  "02": {
    kicker: "Deliverable ▪ 02",
    title: "Written proposal",
    bullets: [
      "Detailed scope",
      "Fixed timeline",
      "Fixed price, no hourly",
    ],
    meta: "Sign → kickoff",
  },
  "03": {
    kicker: "Deliverable ▪ 03",
    title: "Design + build",
    bullets: [
      "Wireframes & flows",
      "Visual design",
      "Production build",
    ],
    meta: "Sprints ▪ Weekly reviews",
  },
  "04": {
    kicker: "Deliverable ▪ 04",
    title: "Live deployment",
    bullets: [
      "Domain & hosting",
      "QA & final testing",
      "Full handoff",
    ],
    meta: "Code ▪ Accounts ▪ Data — yours",
  },
  "05": {
    kicker: "Deliverable ▪ 05",
    title: "Ongoing care",
    bullets: [
      "Monthly maintenance",
      "SEO management",
      "On-demand fixes",
    ],
    meta: "Monthly ▪ No contract",
  },
} as const

export const processSteps: ProcessStep[] = [
  {
    number: "01",
    title: "Discovery",
    copy: "We learn your business, your goals, and what success looks like. This starts with a free 20-minute call — no pitch, no pressure.",
  },
  {
    number: "02",
    title: "Proposal",
    copy: "You get a clear written scope, timeline, and price. No hourly billing, no hidden costs, and nothing starts until you approve it.",
  },
  {
    number: "03",
    title: "Design & Build",
    copy: "We design and develop your product in focused sprints with regular check-ins. Feedback is part of the process, not an afterthought.",
  },
  {
    number: "04",
    title: "Launch",
    copy: "We deploy, test, and handle final QA. When we hand it off, you own the code, domain, accounts, and data.",
  },
  {
    number: "05",
    title: "Support",
    copy: "Need ongoing help? We offer monthly support, SEO management, and product maintenance. Or reach out whenever you need us.",
  },
] as const
