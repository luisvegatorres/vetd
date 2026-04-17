export const site = {
  name: "Innovate App Studios",
  tagline: "Digital products that grow businesses.",
  description:
    "Websites, mobile apps, web apps, AI integrations, and growth systems built to perform and designed to convert.",
  email: "hello@innovateappstudios.com",
  location: "Global · Remote-first",
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
  { href: "/contact", label: "Contact" },
] as const

export type Product = {
  id:
    | "marketing-website"
    | "mobile-app"
    | "web-app"
    | "growth-system"
    | "ai-integration"
  name: string
  tagline: string
  description: string
  startingAt?: string
  timeline: string
  pricingTiers?: string[]
  includes?: string[]
  tools?: { name: string; slug: string }[]
}

export const products: Product[] = [
  {
    id: "marketing-website",
    name: "Business Website",
    tagline: "Get found. Look credible. Convert visitors.",
    description:
      "A fast, mobile-first website built with SEO from day one. Designed to turn traffic into leads, calls, and sales. Includes hosting, domain, WhatsApp or contact integration, and on-page SEO.",
    startingAt: "$97/mo (Growth System) or one-time project pricing",
    timeline: "5–7 days",
    includes: [
      "Custom design & copy",
      "On-page SEO & analytics",
      "Hosting, domain, SSL",
      "WhatsApp & contact integration",
    ],
    tools: [
      { name: "Next.js", slug: "nextdotjs" },
      { name: "Tailwind CSS", slug: "tailwindcss" },
      { name: "Vercel", slug: "vercel" },
    ],
  },
  {
    id: "mobile-app",
    name: "Mobile App",
    tagline: "Your product in every pocket.",
    description:
      "Native iOS and Android apps built in Flutter. We take you from idea to App Store — architecture, design, development, and launch. Built for performance and scale.",
    startingAt: "Custom quote",
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
    name: "Web App & Portal",
    tagline: "Tools that run your business.",
    description:
      "Custom web applications — booking systems, client portals, admin dashboards, internal tools. Built with Next.js and Supabase. Designed to replace spreadsheets and manual processes.",
    startingAt: "Custom quote",
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
    id: "growth-system",
    name: "Growth System",
    tagline: "Show up on Google. Stay there.",
    description:
      "A monthly product that combines a high-performance website with ongoing SEO management. Includes Google Business optimization, monthly reports, review automation, and content updates.",
    timeline: "Ongoing monthly management",
    pricingTiers: [
      "Presence: $97/mo",
      "Growth: $247/mo",
      "No contract. Cancel anytime.",
    ],
    includes: [
      "Marketing website + hosting",
      "Google Business optimization",
      "Monthly SEO & content updates",
      "Review automation & reports",
    ],
    tools: [
      { name: "Google", slug: "google" },
      { name: "Next.js", slug: "nextdotjs" },
      { name: "Vercel", slug: "vercel" },
    ],
  },
  {
    id: "ai-integration",
    name: "AI Integration",
    tagline: "Make your product smarter.",
    description:
      "We add AI-powered features to any website, app, or tool — intelligent chatbots, personalized recommendations, content automation, and more. Powered by the latest models from Anthropic, OpenAI, and Google.",
    startingAt: "Custom quote",
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
    kicker: "Deliverable · 01",
    title: "Discovery call",
    bullets: [
      "Goals & constraints",
      "Success criteria",
      "Rough scope & timeline",
    ],
    meta: "20 min · Free · No pitch",
  },
  "02": {
    kicker: "Deliverable · 02",
    title: "Written proposal",
    bullets: [
      "Detailed scope",
      "Fixed timeline",
      "Fixed price, no hourly",
    ],
    meta: "Sign → kickoff",
  },
  "03": {
    kicker: "Deliverable · 03",
    title: "Design + build",
    bullets: [
      "Wireframes & flows",
      "Visual design",
      "Production build",
    ],
    meta: "Sprints · Weekly reviews",
  },
  "04": {
    kicker: "Deliverable · 04",
    title: "Live deployment",
    bullets: [
      "Domain & hosting",
      "QA & final testing",
      "Full handoff",
    ],
    meta: "Code · Accounts · Data — yours",
  },
  "05": {
    kicker: "Deliverable · 05",
    title: "Ongoing care",
    bullets: [
      "Monthly maintenance",
      "SEO management",
      "On-demand fixes",
    ],
    meta: "Monthly · No contract",
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
