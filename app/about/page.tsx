import type { Metadata } from "next"
import Link from "next/link"

import { Section } from "@/components/section"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const differentiators = [
  {
    title: "We&apos;re a product studio, not an agency",
    copy: "We don&apos;t sell hours. We sell finished products with clear scopes and fixed prices.",
  },
  {
    title: "We move fast",
    copy: "A marketing website in 7 days. An MVP in weeks. Speed is a feature.",
  },
  {
    title: "We use the right tools",
    copy: "Next.js, Flutter, Supabase, shadcn, and the best AI models available. We build on solid foundations.",
  },
  {
    title: "You own everything",
    copy: "Code, domain, accounts. No lock-in. No dependency on us to keep the lights on.",
  },
  {
    title: "We work globally",
    copy: "Clients across industries, time zones, and markets. Remote-first from day one.",
  },
] as const

const techStack = [
  "Websites: Next.js, shadcn/ui, Tailwind, Vercel",
  "Mobile: Flutter, Dart",
  "Backend: Supabase, PostgreSQL, Edge Functions",
  "AI: Anthropic Claude, OpenAI, Google Gemini",
  "Design: Figma, Framer",
] as const

export const metadata: Metadata = {
  title: "About",
  description:
    "A small digital product studio that builds websites, apps, and systems for businesses that want to grow.",
}

export default function AboutPage() {
  return (
    <>
      <Section size="md">
        <div className="max-w-3xl space-y-6">
          <Badge
            variant="outline"
            className="rounded-none border-primary/50 bg-transparent px-3 py-1 text-[10px] tracking-[0.22em] text-primary uppercase"
          >
            About us
          </Badge>
          <h1 className="font-heading text-5xl leading-[0.95] tracking-tight text-foreground uppercase sm:text-6xl">
            A digital product studio built to move fast.
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            We&apos;re a small, focused team that builds websites, apps, and
            systems for businesses that want to grow. No bloat. No bureaucracy.
            Just great work, shipped on time.
          </p>
        </div>
      </Section>

      <Section eyebrow="Why we exist">
        <div className="max-w-4xl space-y-6">
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            Most businesses know they need a better digital presence. The
            problem is finding a partner who can actually deliver — without the
            agency overhead, the long timelines, or the vague promises.
            That&apos;s the gap we fill. We build digital products that work, at
            a pace that makes sense for your business.
          </p>
        </div>
      </Section>

      <Section eyebrow="Our edge">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {differentiators.map((item) => (
            <Card
              key={item.title}
              className="gap-3 rounded-none bg-card ring-1 ring-border"
            >
              <CardHeader>
                <CardTitle className="font-heading text-xl tracking-[0.04em] uppercase">
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.copy}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section eyebrow="What we build with">
        <div className="grid gap-4 md:grid-cols-2">
          {techStack.map((item) => (
            <div
              key={item}
              className="border-t border-border bg-card p-6 text-sm leading-relaxed text-muted-foreground ring-1 ring-border"
            >
              {item}
            </div>
          ))}
        </div>
      </Section>

      <Section size="lg" className="border-b-0 bg-card/40">
        <div className="mx-auto max-w-3xl space-y-8 text-center">
          <h2 className="font-heading text-4xl leading-none tracking-tight text-foreground uppercase sm:text-5xl">
            Want to work with us?
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            We take on a limited number of projects at a time. Let&apos;s talk
            about yours.
          </p>
          <div className="flex justify-center">
            <Link
              href="/contact"
              className="inline-flex h-14 items-center justify-center bg-primary px-8 text-base font-medium tracking-[0.14em] text-primary-foreground uppercase transition-colors hover:bg-primary/85"
            >
              Start a project
            </Link>
          </div>
        </div>
      </Section>
    </>
  )
}
