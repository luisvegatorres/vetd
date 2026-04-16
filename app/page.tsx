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
import { Reveal, RevealGroup, RevealItem } from "@/components/reveal"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { processSteps, products } from "@/lib/site"

const productIcons = {
  "marketing-website": Globe2,
  "mobile-app": Smartphone,
  "web-app": LayoutDashboard,
  "growth-system": TrendingUp,
  "ai-integration": Bot,
} as const

const productBento: Record<string, string> = {
  "marketing-website": "sm:col-span-2",
  "mobile-app": "",
  "web-app": "",
  "growth-system": "sm:col-span-2",
  "ai-integration": "sm:col-span-2",
}

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
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr] lg:gap-16">
          <RevealGroup className="space-y-6 lg:sticky lg:top-28 lg:self-start" delayChildren={0.08}>
            <RevealItem y={18}>
              <h2 className="font-heading text-4xl leading-[1.05] tracking-tight text-foreground uppercase sm:text-5xl">
                Everything your business needs to compete online.
              </h2>
            </RevealItem>
            <RevealItem y={22}>
              <p className="text-base leading-relaxed text-muted-foreground">
                We don&apos;t do one thing. We build the right product for where
                your business is going.
              </p>
            </RevealItem>
          </RevealGroup>

          <RevealGroup
            className="grid grid-cols-1 gap-4 sm:grid-cols-4"
            delayChildren={0.12}
            stagger={0.07}
          >
            {products.map((product) => {
              const Icon = productIcons[product.id]

              return (
                <RevealItem
                  key={product.id}
                  y={18}
                  className={cn("h-full", productBento[product.id])}
                >
                  <Card className="h-full gap-3 rounded-none bg-card ring-1 ring-border transition-all duration-300 ease-out hover:scale-[1.03] hover:ring-foreground/20">
                    <CardHeader className="space-y-4">
                      <Icon className="size-7 text-foreground" />
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
                </RevealItem>
              )
            })}
          </RevealGroup>
        </div>
      </Section>

      <Section eyebrow="Selected work">
        <RevealGroup
          className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
          delayChildren={0.08}
          stagger={0.08}
        >
          <RevealItem y={18}>
            <h2 className="font-heading text-4xl leading-[1.05] tracking-tight text-foreground uppercase sm:text-5xl">
              Products we&apos;ve shipped.
            </h2>
          </RevealItem>
          <RevealItem y={18} x={20}>
            <Link
              href="/work"
              className="inline-flex items-center gap-2 text-xs tracking-[0.18em] text-muted-foreground uppercase hover:text-foreground"
            >
              View all work
              <ArrowRight className="size-3.5" />
            </Link>
          </RevealItem>
        </RevealGroup>

        <RevealGroup
          className="grid gap-6 md:grid-cols-3"
          delayChildren={0.12}
          stagger={0.08}
        >
          {workPreview.map((item, index) => (
            <RevealItem key={item.type} y={18}>
              <Card className="gap-4 rounded-none bg-card ring-1 ring-border">
                <CardHeader className="space-y-3">
                  <p className="text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
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
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      <Section eyebrow="How we work">
        <Reveal className="mb-12 max-w-3xl space-y-6" y={18}>
          <h2 className="font-heading text-4xl leading-[1.05] tracking-tight text-foreground uppercase sm:text-5xl">
            Simple process. No surprises.
          </h2>
        </Reveal>

        <RevealGroup
          className="grid gap-6 md:grid-cols-2 xl:grid-cols-5"
          delayChildren={0.12}
          stagger={0.07}
        >
          {processSteps.map((step) => (
            <RevealItem key={step.number} y={18}>
              <div className="space-y-4 border-t border-border/60 pt-6">
                <p className="font-heading text-4xl text-foreground">
                  {step.number}
                </p>
                <h3 className="font-heading text-xl tracking-[0.04em] text-foreground uppercase">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.copy}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      <Section eyebrow="What clients say">
        <Reveal y={22}>
          <Card className="gap-4 rounded-none bg-card p-10 ring-1 ring-border">
            <Quote className="size-10 text-muted-foreground/50" />
            <CardContent className="space-y-4 px-0">
              <p className="font-heading text-2xl leading-tight tracking-tight text-foreground uppercase sm:text-3xl">
                Client testimonials will live here.
              </p>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                We&apos;re keeping this section ready for real client feedback
                as new launches go live and performance data comes in.
              </p>
            </CardContent>
          </Card>
        </Reveal>
      </Section>

      <Section eyebrow="FAQ">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          <Reveal y={18}>
            <h2 className="font-heading text-4xl leading-[1.05] tracking-tight text-foreground uppercase sm:text-5xl">
              Common questions.
            </h2>
          </Reveal>
          <Reveal y={24} x={20}>
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
          </Reveal>
        </div>
      </Section>

      <Section size="lg" className="border-b-0 bg-card/40">
        <RevealGroup
          className="mx-auto max-w-3xl space-y-8 text-center"
          delayChildren={0.1}
          stagger={0.08}
        >
          <RevealItem y={18}>
            <h2 className="font-heading text-4xl leading-[1.05] tracking-tight text-foreground uppercase sm:text-5xl">
              Ready to build something?
            </h2>
          </RevealItem>
          <RevealItem y={22}>
            <p className="text-base leading-relaxed text-muted-foreground">
              Tell us about your project. No commitment, no pressure.
            </p>
          </RevealItem>
          <RevealItem y={26}>
            <div className="flex justify-center">
              <Link
                href="/contact"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "rounded-none tracking-[0.14em] uppercase"
                )}
              >
                Start a project
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </RevealItem>
        </RevealGroup>
      </Section>
    </>
  )
}
