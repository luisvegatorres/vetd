import Link from "next/link"
import {
  ArrowRight,
  Bot,
  Globe2,
  LayoutDashboard,
  Quote,
  Smartphone,
  TrendingUp,
} from "lucide-react"

import { HomeHero } from "@/components/home-hero"
import { Section } from "@/components/section"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { processSteps, products } from "@/lib/site"

const productIcons = {
  "marketing-website": Globe2,
  "mobile-app": Smartphone,
  "web-app": LayoutDashboard,
  "growth-system": TrendingUp,
  "ai-integration": Bot,
} as const

const workPreview = [
  {
    type: "Marketing Website",
    summary:
      "Conversion-first sites for businesses that need credibility and lead flow.",
  },
  {
    type: "Web App",
    summary: "Custom portals and internal tools that replace manual workflows.",
  },
  {
    type: "Growth System",
    summary:
      "Monthly website and SEO management built for compounding visibility.",
  },
] as const

const homeFaq = [
  {
    q: "Do you work with clients outside Puerto Rico?",
    a: "Yes. We work with clients worldwide. All communication is remote-friendly via email, WhatsApp, or video call.",
  },
  {
    q: "How long does a project take?",
    a: "A marketing website takes 5–10 days. A mobile app or web app typically takes 4–12 weeks depending on scope.",
  },
  {
    q: "What do I own after the project?",
    a: "Everything. Code, domain, accounts, content. It's yours from day one.",
  },
  {
    q: "Do you offer monthly plans?",
    a: "Yes. Our Growth System is a monthly product. We also offer retainer support for any product we build.",
  },
  {
    q: "How do I get started?",
    a: "Fill out the project inquiry form or book a discovery call. We'll respond within 24 hours.",
  },
] as const

export default function HomePage() {
  return (
    <>
      <HomeHero />

      <Section eyebrow="What we build">
        <div className="mb-12 max-w-3xl space-y-6">
          <h2 className="font-heading text-4xl leading-none tracking-tight text-foreground uppercase sm:text-5xl">
            Everything your business needs to compete online.
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
            We don&apos;t do one thing. We build the right product for where
            your business is going.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
          {products.map((product) => {
            const Icon = productIcons[product.id]

            return (
              <Card
                key={product.id}
                className="gap-3 rounded-none bg-card ring-1 ring-border transition-colors hover:ring-primary"
              >
                <CardHeader className="space-y-4">
                  <Icon className="size-7 text-primary" />
                  <CardTitle className="font-heading text-xl tracking-[0.04em] uppercase">
                    {product.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {product.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </Section>

      <Section eyebrow="Selected work">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2 className="font-heading text-4xl leading-none tracking-tight text-foreground uppercase sm:text-5xl">
            Products we&apos;ve shipped.
          </h2>
          <Link
            href="/work"
            className="inline-flex items-center gap-2 text-xs tracking-[0.2em] text-muted-foreground uppercase hover:text-foreground"
          >
            View all work
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {workPreview.map((item, index) => (
            <Card
              key={item.type}
              className="gap-4 rounded-none bg-card ring-1 ring-border"
            >
              <CardHeader className="space-y-3">
                <p className="text-[10px] tracking-[0.22em] text-primary uppercase">
                  0{index + 1}
                </p>
                <CardTitle className="font-heading text-xl tracking-[0.04em] uppercase">
                  {item.type}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.summary}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section eyebrow="How we work">
        <div className="mb-12 max-w-3xl space-y-6">
          <h2 className="font-heading text-4xl leading-none tracking-tight text-foreground uppercase sm:text-5xl">
            Simple process. No surprises.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
          {processSteps.map((step) => (
            <div
              key={step.number}
              className="space-y-4 border-t-2 border-primary bg-card p-6 ring-1 ring-border"
            >
              <p className="font-heading text-4xl text-primary">
                {step.number}
              </p>
              <h3 className="font-heading text-lg tracking-[0.04em] text-foreground uppercase">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {step.copy}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="What clients say">
        <Card className="gap-4 rounded-none bg-card p-10 ring-1 ring-border">
          <Quote className="size-10 text-primary/50" />
          <CardContent className="space-y-4 px-0">
            <p className="font-heading text-2xl leading-tight tracking-tight text-foreground uppercase sm:text-3xl">
              Client testimonials will live here.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              We&apos;re keeping this section ready for real client feedback as
              new launches go live and performance data comes in.
            </p>
          </CardContent>
        </Card>
      </Section>

      <Section eyebrow="FAQ">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          <h2 className="font-heading text-4xl leading-none tracking-tight text-foreground uppercase sm:text-5xl">
            Common questions.
          </h2>
          <Accordion>
            {homeFaq.map((item) => (
              <AccordionItem key={item.q} value={item.q}>
                <AccordionTrigger className="text-left text-base tracking-[0.04em] uppercase">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      <Section size="lg" className="border-b-0 bg-card/40">
        <div className="mx-auto max-w-3xl space-y-8 text-center">
          <h2 className="font-heading text-4xl leading-none tracking-tight text-foreground uppercase sm:text-5xl">
            Ready to build something?
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            Tell us about your project. No commitment, no pressure.
          </p>
          <div className="flex justify-center">
            <Link
              href="/contact"
              className="inline-flex h-14 items-center justify-center gap-2 bg-primary px-8 text-base font-medium tracking-[0.14em] text-primary-foreground uppercase transition-colors hover:bg-primary/85"
            >
              Start a project
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </Section>
    </>
  )
}
