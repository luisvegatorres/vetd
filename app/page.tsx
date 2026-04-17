import Link from "next/link"
import { ArrowRight, Quote } from "lucide-react"

import { CraftLogoCloud } from "@/components/craft-logo-cloud"
import { HomeHero } from "@/components/home-hero"
import { ProcessHorizontalChapters } from "@/components/process-horizontal-chapters"
import { ProductsScrollAccordion } from "@/components/products-scroll-accordion"
import { Section } from "@/components/section"
import { WorkGrid } from "@/components/work-grid"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Reveal, RevealGroup, RevealItem } from "@/components/reveal"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { processSteps, products } from "@/lib/site"

const values = [
  {
    title: "We ship products, not hours",
    copy: "Fixed scopes, fixed prices, finished work. No open-ended retainers, no billable-hour games.",
  },
  {
    title: "Speed is a feature",
    copy: "A marketing site in 7 days. An MVP in weeks. Momentum compounds — slow projects rarely recover.",
  },
  {
    title: "We pick tools that win",
    copy: "Next.js, Flutter, Supabase, shadcn, Claude. Proven stacks only. No framework-of-the-month experiments on your budget.",
  },
  {
    title: "You own everything",
    copy: "Code, domain, accounts, content. No lock-in, no dependencies on us to keep the lights on.",
  },
  {
    title: "Remote by default",
    copy: "Clients across industries, time zones, and markets — held to the same standard of craft and communication.",
  },
] as const

const commitments = [
  "Fixed prices. You know the cost before we start.",
  "Weekly demos. You see working product, not slide decks.",
  "Full ownership from day one. Code, accounts, and content are yours.",
  "No lock-in. Cancel anytime. No exit fees, no hostage data.",
  "Straight answers. If something can't be done, we tell you early.",
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

const sectionAnchor = "scroll-mt-20"

export default function HomePage() {
  return (
    <>
      <HomeHero />

      <div id="products" className={sectionAnchor}>
        <ProductsScrollAccordion
          products={products}
          header={
            <div className="px-6 py-16 sm:px-10 sm:py-24 lg:px-20">
              <p className="mb-6 text-xs font-medium tracking-section text-muted-foreground uppercase">
                001 — What we build
              </p>
              <div className="max-w-3xl space-y-4">
                <h2 className="leading-section font-heading text-4xl tracking-tight text-foreground capitalize sm:text-5xl">
                  Everything your business needs to compete online.
                </h2>
                <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                  From a $97/mo website to a full mobile app — we build what
                  your business actually needs.
                </p>
              </div>
            </div>
          }
        />
      </div>

      <div id="process" className={sectionAnchor}>
        <ProcessHorizontalChapters
          steps={processSteps}
          heading={{
            eyebrow: "002 — How we work",
            title: "Simple process. No surprises.",
            subtitle:
              "You always know what's happening, what's next, and what it costs.",
          }}
        />
      </div>

      <Section id="work" eyebrow="003 — Our work" className={sectionAnchor}>
        <RevealGroup
          className="mb-10 max-w-3xl space-y-4"
          delayChildren={0.08}
          stagger={0.08}
        >
          <RevealItem y={18}>
            <h2 className="leading-section font-heading text-4xl tracking-tight text-foreground capitalize sm:text-5xl">
              Products we&apos;ve built and shipped.
            </h2>
          </RevealItem>
        </RevealGroup>

        <WorkGrid />
      </Section>

      <Section id="about" eyebrow="004 — About us" className={sectionAnchor}>
        <div className="mb-20 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <RevealGroup
            className="space-y-5"
            delayChildren={0.08}
            stagger={0.08}
          >
            <RevealItem y={20}>
              <h2 className="leading-section font-heading text-4xl tracking-tight text-foreground capitalize sm:text-5xl">
                A studio run like a product — not an agency.
              </h2>
            </RevealItem>
          </RevealGroup>

          <RevealGroup
            className="space-y-5 self-end text-base leading-relaxed text-muted-foreground sm:text-lg"
            delayChildren={0.16}
            stagger={0.08}
          >
            <RevealItem y={22}>
              <p>
                Innovate App Studios is a small, focused team building
                websites, apps, and systems for businesses that want to grow.
                No bloat. No bureaucracy. Just finished work, shipped on time.
              </p>
            </RevealItem>
            <RevealItem y={22}>
              <p>
                We price by scope, not by the hour. We build on tools that
                win. And when the project ends, you own every line of it.
              </p>
            </RevealItem>
          </RevealGroup>
        </div>

        <div className="mb-20">
          <Reveal
            className="mb-6 -mx-6 flex items-end justify-between border-b border-border/60 px-6 pb-6 sm:-mx-10 sm:px-10 lg:-mx-20 lg:px-20"
            y={18}
          >
            <h3 className="font-heading text-2xl tracking-wider capitalize sm:text-3xl">
              What we stand for
            </h3>
            <span className="hidden text-xs tracking-section text-muted-foreground uppercase sm:inline">
              Our values
            </span>
          </Reveal>

          <RevealGroup
            className="divide-y divide-border/60"
            delayChildren={0.12}
            stagger={0.07}
          >
            {values.map((item, index) => (
              <RevealItem
                key={item.title}
                y={22}
                className="grid gap-3 py-8 md:grid-cols-[5rem_1fr_1.6fr] md:items-baseline md:gap-10"
              >
                <span className="font-heading text-4xl leading-none tabular-nums tracking-tight text-foreground sm:text-5xl">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h4 className="font-heading text-xl leading-subheading tracking-wider text-foreground capitalize sm:text-2xl">
                  {item.title}
                </h4>
                <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                  {item.copy}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>

        <Reveal className="mb-20" y={22}>
          <Card className="gap-0 rounded-none bg-card p-10 ring-1 ring-border sm:p-14">
            <CardContent className="grid gap-10 px-0 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
              <div className="space-y-4">
                <p className="text-xs font-medium tracking-section text-muted-foreground uppercase">
                  Our commitment
                </p>
                <h3 className="leading-section font-heading text-3xl tracking-tight text-foreground capitalize sm:text-4xl">
                  Promises we put in writing.
                </h3>
                <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                  Every engagement ships with the same guarantees — no
                  matter the scope or the price.
                </p>
              </div>
              <ul className="space-y-5">
                {commitments.map((commitment) => (
                  <li
                    key={commitment}
                    className="flex gap-4 border-b border-border/60 pb-5 text-sm leading-relaxed text-foreground last:border-b-0 last:pb-0 sm:text-base"
                  >
                    <span
                      className="mt-2 size-2 shrink-0 bg-foreground"
                      aria-hidden
                    />
                    <span>{commitment}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </Reveal>

        <div>
          <Reveal
            className="mb-10 -mx-6 flex items-end justify-between border-b border-border/60 px-6 pb-6 sm:-mx-10 sm:px-10 lg:-mx-20 lg:px-20"
            y={18}
          >
            <h3 className="font-heading text-2xl tracking-wider capitalize sm:text-3xl">
              Our craft
            </h3>
            <span className="hidden text-xs tracking-section text-muted-foreground uppercase sm:inline">
              The tools we use
            </span>
          </Reveal>

          <Reveal y={18}>
            <CraftLogoCloud />
          </Reveal>
        </div>
      </Section>

      <Section eyebrow="005 — What clients say">
        <Reveal y={22}>
          <Card className="gap-4 rounded-none bg-card p-10 ring-1 ring-border">
            <Quote className="size-10 text-muted-foreground/50" />
            <CardContent className="space-y-4 px-0">
              <p className="font-heading text-2xl leading-tight tracking-tight text-foreground capitalize sm:text-3xl">
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

      <Section eyebrow="006 — FAQ">
        <div className="faq-split-grid grid gap-12">
          <Reveal y={18}>
            <h2 className="leading-section font-heading text-4xl tracking-tight text-foreground capitalize sm:text-5xl">
              Common questions.
            </h2>
          </Reveal>
          <Reveal y={24} x={20}>
            <Accordion>
              {homeFaq.map((item) => (
                <AccordionItem key={item.q} value={item.q}>
                  <AccordionTrigger className="text-left text-base tracking-wider uppercase">
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
            <h2 className="leading-section font-heading text-4xl tracking-tight text-foreground capitalize sm:text-5xl">
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
                  "tracking-wider uppercase"
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
