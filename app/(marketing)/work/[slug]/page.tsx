import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { BrandIcon, type BrandName } from "@/components/brand/brand-icons"
import { Section } from "@/components/layout/section"
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Metric = { label: string; value: string }
type TechItem = { name: BrandName; role: string }
type Beat = { title: string; body: string }
type Figure = { caption: string; initials?: string }

type CaseStudy = {
  slug: string
  title: string
  category: "Websites" | "Mobile Apps" | "SaaS Products"
  tagline: string
  year: string
  duration: string
  role: string
  liveUrl?: string
  overview: string
  leadFigure: Figure
  problem: Beat[]
  problemIntro: string
  pullQuote: string
  solution: Beat[]
  solutionIntro: string
  midFigure: Figure
  stack: TechItem[]
  features: string[]
  metrics: Metric[]
}

const caseStudies: Record<string, CaseStudy> = {
  "innovate-app-studios": {
    slug: "innovate-app-studios",
    title: "Innovate App Studios CRM",
    category: "SaaS Products",
    tagline:
      "Process notes on building a typed, server-first CRM end-to-end.",
    year: "2026",
    duration: "Ongoing",
    role: "Design, build, ship",
    overview:
      "We built the studio on Next.js 16, server-first by default, typed end-to-end from the Postgres schema to the UI. This is a walkthrough of the stack, the decisions that shaped the codebase, and the process we used to get from empty repo to running system — without stacking services we didn't understand.",
    leadFigure: {
      caption:
        "Route groups — marketing site and protected app, one codebase, one deployment.",
      initials: "RG",
    },
    problemIntro:
      "Four constraints shaped every technical decision. We wrote them down before the repo existed and pulled them back out whenever a choice got noisy.",
    problem: [
      {
        title: "End-to-end type safety, no manual sync",
        body: "If the database schema changes, TypeScript should complain before the browser does. That ruled out any layer that accepts untyped payloads and any client that hand-writes types for server responses. The schema is the contract.",
      },
      {
        title: "Server-first by default",
        body: "Most pages shouldn't ship JavaScript for content that doesn't need it. React Server Components had to be the default rendering mode, not an opt-in optimization we'd sprinkle in later. Client components exist where interaction actually lives.",
      },
      {
        title: "One codebase, one deployment",
        body: "Public marketing site and protected app live side-by-side. Route groups handle the split; a single build pipeline ships both. No microservices, no split repos, no shared packages to keep in lockstep — until something earns the split.",
      },
      {
        title: "Maintainable by one developer",
        body: "Every abstraction had to pull its weight. No state management library until server actions hit a wall. No ORM when generated types already covered it. No framework we didn't already know well enough to debug at 2am.",
      },
    ],
    pullQuote:
      "If the schema changes, TypeScript complains before the browser does.",
    solutionIntro:
      "Five decisions that shaped the codebase — each one a place where we picked the boring, well-typed option and moved on.",
    solution: [
      {
        title: "Next.js 16 App Router, RSC-first",
        body: "Server Components render by default; client components are the opt-in. Pages read from the database in their own body via async functions — no data-fetching library, no hydration dance for static content. Mutations go through server actions, which revalidate by tag or path and let affected routes re-render themselves.",
      },
      {
        title: "Three Supabase clients, different doors",
        body: "A browser client for client components, a server client bound to next/headers cookies for RSC and server actions, a middleware client for request-scoped cookie refresh, and a service-role admin client marked 'server-only' so it can't be imported from a client file. Each has a single purpose; picking the wrong one is a type error, not a runtime bug.",
      },
      {
        title: "Generated types, never hand-written",
        body: "Supabase's CLI generates TypeScript from the live schema into lib/supabase/types.ts. Every query, every mutation, every component imports from that file — a column rename breaks the build across every consumer at once. No drift, no stale fixtures, no guess-and-check.",
      },
      {
        title: "shadcn + Tailwind v4 as the only UI layer",
        body: "We vendor shadcn components into the repo and edit them directly. Tailwind v4 tokens live in CSS variables (OKLCH) so the design system is themable without rebuilds. No CSS-in-JS, no component library dependency, no runtime style resolution — one PR changes the primary color across the entire app.",
      },
      {
        title: "Vercel Fluid Compute over serverless",
        body: "Fluid Compute keeps warm instances across requests, so middleware auth and server-rendered pages don't pay cold-start costs the way classic serverless would. Fresh Supabase clients per request (no module-level singletons) means concurrent request isolation still holds up.",
      },
    ],
    midFigure: {
      caption:
        "Type pipeline — Postgres migrations → Supabase CLI → generated TS → imported everywhere.",
      initials: "TS",
    },
    stack: [
      { name: "Next.js", role: "App Router, server actions, middleware auth" },
      { name: "React", role: "RSC-first, Suspense, streaming" },
      { name: "TypeScript", role: "Strict mode, generated Supabase types" },
      { name: "Tailwind CSS", role: "OKLCH tokens, dark-canonical theming" },
      { name: "shadcn/ui", role: "Vendored primitives, edited in-repo" },
      { name: "Supabase", role: "Postgres, Auth, RLS, SSR cookie plumbing" },
      { name: "Stripe", role: "Hosted Checkout + idempotent webhooks" },
      { name: "Cal.com", role: "HMAC-signed booking webhooks" },
      { name: "Vercel", role: "Fluid Compute, edge hosting, image optimization" },
    ],
    features: [
      "Proxy middleware that refreshes Supabase sessions on every request",
      "Three single-purpose Supabase clients (browser, server, admin) with 'server-only' guards",
      "Generated Postgres types imported across every query and form",
      "Server actions for every mutation, revalidated by tag or path",
      "Shared shadcn + Tailwind design system across marketing and app",
      "Route groups splitting public marketing and protected CRM, one build",
      "React 19 streaming with Suspense boundaries on the slow data paths",
      "Dark-canonical OKLCH tokens in CSS variables, themable without rebuilds",
    ],
    metrics: [
      { label: "Core tables", value: "10" },
      { label: "Migrations shipped", value: "35+" },
      { label: "Runtime deps", value: "< 40" },
      { label: "Monthly tooling", value: "$0" },
    ],
  },
}

export function generateStaticParams() {
  return Object.keys(caseStudies).map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const study = caseStudies[slug]
  if (!study) return {}
  return {
    title: `${study.title} — Innovate App Studios`,
    description: study.tagline,
  }
}

function FigureBlock({ figure }: { figure: Figure }) {
  return (
    <figure className="space-y-3">
      <div className="relative aspect-[16/9] overflow-hidden border border-border bg-muted">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
            backgroundSize: "2rem 2rem",
          }}
        />
        {figure.initials ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-heading text-6xl leading-none text-muted-foreground/40 uppercase sm:text-7xl">
              {figure.initials}
            </span>
          </div>
        ) : null}
      </div>
      <figcaption className="text-sm leading-relaxed text-muted-foreground italic">
        {figure.caption}
      </figcaption>
    </figure>
  )
}

function ChapterAside({
  number,
  title,
  caption,
}: {
  number: string
  title: string
  caption?: string
}) {
  return (
    <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
      <p className="font-heading text-xs text-muted-foreground uppercase tracking-wide">
        {number}
      </p>
      <h2 className="font-heading text-2xl leading-snug text-foreground uppercase sm:text-3xl">
        {title}
      </h2>
      {caption ? (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {caption}
        </p>
      ) : null}
      <div className="h-px w-12 bg-foreground/30" />
    </div>
  )
}

function Chapter({
  number,
  title,
  caption,
  children,
}: {
  number: string
  title: string
  caption?: string
  children: React.ReactNode
}) {
  return (
    <Section size="md" className="border-b-0">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)] lg:gap-20">
        <Reveal y={18}>
          <ChapterAside number={number} title={title} caption={caption} />
        </Reveal>
        <div className="space-y-12">{children}</div>
      </div>
    </Section>
  )
}

function BeatBlock({ index, beat }: { index: number; beat: Beat }) {
  return (
    <div className="space-y-3">
      <p className="font-heading text-xs text-muted-foreground uppercase">
        {String(index + 1).padStart(2, "0")}
      </p>
      <h3 className="font-heading text-xl leading-snug text-foreground uppercase sm:text-2xl">
        {beat.title}
      </h3>
      <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
        {beat.body}
      </p>
    </div>
  )
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const study = caseStudies[slug]
  if (!study) notFound()

  return (
    <>
      <Section size="sm" className="scroll-mt-20 border-b-0 pb-0">
        <Reveal y={12}>
          <Link
            href="/#work"
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back to work
          </Link>
        </Reveal>
      </Section>

      <Section size="md" className="border-b-0">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)] lg:gap-20">
          <Reveal y={18} className="space-y-3">
            <p className="font-heading text-xs text-muted-foreground uppercase tracking-wide">
              Case study
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A process-and-decisions walkthrough of the CRM we run the studio
              on.
            </p>
          </Reveal>
          <RevealGroup
            className="space-y-10"
            delayChildren={0.08}
            stagger={0.08}
          >
            <RevealItem y={24} className="space-y-8">
              <h1 className="leading-hero font-heading text-5xl text-foreground capitalize sm:text-6xl md:text-7xl">
                {study.title}
              </h1>
              <p className="max-w-3xl text-xl leading-relaxed text-muted-foreground sm:text-2xl">
                {study.tagline}
              </p>
            </RevealItem>
          </RevealGroup>
        </div>

        <Reveal y={18} className="mt-16">
          <dl className="grid grid-cols-2 gap-8 border-t border-border pt-8 sm:grid-cols-4">
            {(
              [
                ["Year", study.year],
                ["Duration", study.duration],
                ["Role", study.role],
                ["Category", study.category],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="space-y-2">
                <dt className="text-xs font-medium text-muted-foreground uppercase">
                  {label}
                </dt>
                <dd className="font-heading text-base text-foreground uppercase">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </Section>

      <Section size="sm" className="border-b-0">
        <Reveal y={24}>
          <FigureBlock figure={study.leadFigure} />
        </Reveal>
      </Section>

      <Chapter number="001" title="Overview" caption="How we approached it.">
        <Reveal y={18}>
          <p className="text-lg leading-relaxed text-foreground sm:text-xl">
            {study.overview}
          </p>
        </Reveal>
      </Chapter>

      <Chapter
        number="002"
        title="Constraints"
        caption="The four rules we wrote down before the repo existed."
      >
        <Reveal y={18}>
          <p className="text-lg leading-relaxed text-foreground sm:text-xl">
            {study.problemIntro}
          </p>
        </Reveal>
        <RevealGroup
          className="grid gap-10 sm:grid-cols-2"
          delayChildren={0.08}
          stagger={0.06}
        >
          {study.problem.map((beat, idx) => (
            <RevealItem key={beat.title} y={18}>
              <BeatBlock index={idx} beat={beat} />
            </RevealItem>
          ))}
        </RevealGroup>
      </Chapter>

      <Section size="md" className="border-b-0">
        <Reveal y={18}>
          <blockquote className="border-l border-foreground/30 pl-6 sm:pl-10">
            <p className="font-heading text-2xl leading-snug text-foreground capitalize sm:text-3xl md:text-4xl">
              &ldquo;{study.pullQuote}&rdquo;
            </p>
          </blockquote>
        </Reveal>
      </Section>

      <Chapter
        number="003"
        title="Decisions"
        caption="Five places where we picked the boring, well-typed option and moved on."
      >
        <Reveal y={18}>
          <p className="text-lg leading-relaxed text-foreground sm:text-xl">
            {study.solutionIntro}
          </p>
        </Reveal>
        <RevealGroup
          className="grid gap-10 sm:grid-cols-2"
          delayChildren={0.08}
          stagger={0.06}
        >
          {study.solution.map((beat, idx) => (
            <RevealItem key={beat.title} y={18}>
              <BeatBlock index={idx} beat={beat} />
            </RevealItem>
          ))}
        </RevealGroup>
      </Chapter>

      <Section size="sm" className="border-b-0">
        <Reveal y={24}>
          <FigureBlock figure={study.midFigure} />
        </Reveal>
      </Section>

      <Chapter
        number="004"
        title="The stack"
        caption="Companies, frameworks, and services behind the build."
      >
        <RevealGroup
          className="grid gap-0 border-t border-l border-border sm:grid-cols-2 lg:grid-cols-3"
          delayChildren={0.06}
          stagger={0.05}
        >
          {study.stack.map((tech) => (
            <RevealItem key={tech.name} y={18}>
              <div className="h-full space-y-4 border-r border-b border-border bg-card px-6 py-8">
                <div className="flex size-8 items-center justify-center text-foreground">
                  <BrandIcon name={tech.name} />
                </div>
                <div className="space-y-2">
                  <p className="font-heading text-lg text-foreground uppercase">
                    {tech.name}
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {tech.role}
                  </p>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Chapter>

      <Chapter
        number="005"
        title="What we wrote"
        caption="The engineering artifacts that came out of the build."
      >
        <RevealGroup
          className="divide-y divide-border border-t border-b border-border"
          delayChildren={0.06}
          stagger={0.04}
        >
          {study.features.map((feature, idx) => (
            <RevealItem key={feature} y={12}>
              <div className="flex items-start gap-6 py-4">
                <span className="font-heading text-xs text-muted-foreground uppercase">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <p className="text-base leading-relaxed text-foreground sm:text-lg">
                  {feature}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Chapter>

      <Chapter
        number="006"
        title="By the numbers"
        caption="A quick snapshot of the codebase shape."
      >
        <RevealGroup
          className="grid gap-0 border-t border-l border-border sm:grid-cols-2 lg:grid-cols-4"
          delayChildren={0.08}
          stagger={0.06}
        >
          {study.metrics.map((metric) => (
            <RevealItem key={metric.label} y={18}>
              <div className="space-y-3 border-r border-b border-border bg-card px-6 py-10">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  {metric.label}
                </p>
                <p className="font-heading text-4xl text-foreground uppercase sm:text-5xl">
                  {metric.value}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Chapter>

      <Section size="lg" className="border-b-0 bg-card/40">
        <RevealGroup
          className="mx-auto max-w-3xl space-y-8 text-center"
          delayChildren={0.1}
          stagger={0.08}
        >
          <RevealItem y={18}>
            <h2 className="leading-section font-heading text-4xl text-foreground capitalize sm:text-5xl">
              Have a project like this?
            </h2>
          </RevealItem>
          <RevealItem y={18}>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              Book a 20-minute discovery call. You&apos;ll leave with a concrete
              scope, a timeline, and a price.
            </p>
          </RevealItem>
          <RevealItem
            y={18}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              href="/contact"
              className={cn(
                buttonVariants({ variant: "default" }),
                "inline-flex items-center gap-2"
              )}
            >
              Start a project
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/#work"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "inline-flex items-center gap-2"
              )}
            >
              See more work
            </Link>
          </RevealItem>
        </RevealGroup>
      </Section>
    </>
  )
}
