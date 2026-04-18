import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { AboutValuesGrid } from "@/components/home/about-values-grid"
import { CraftLogoCloud } from "@/components/home/craft-logo-cloud"
import { HomeHero } from "@/components/home/home-hero"
import { ProcessHorizontalChapters } from "@/components/home/process-horizontal-chapters"
import { ProductsScrollAccordion } from "@/components/home/products-scroll-accordion"
import { WorkGrid } from "@/components/home/work-grid"
import { Section } from "@/components/layout/section"
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { processSteps, products } from "@/lib/site"

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

      <Section size="sm">
        <Reveal y={18}>
          <CraftLogoCloud />
        </Reveal>
      </Section>

      <div id="products" className={sectionAnchor}>
        <ProductsScrollAccordion
          products={products}
          header={
            <div className="px-6 pt-16 sm:px-10 sm:pt-24 lg:px-20">
              <p className="mb-6 text-xs font-medium tracking-section text-muted-foreground uppercase">
                001 — What we build
              </p>
              <div className="max-w-3xl space-y-4">
                <h2 className="leading-section font-heading text-4xl tracking-tight text-foreground capitalize sm:text-5xl">
                  The complete toolkit, under one studio.
                </h2>
                <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Pick what fits. We handle the rest.
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

      <Section
        id="about"
        size="sm"
        eyebrow="003 — About us"
        className={cn(sectionAnchor, "border-b-0")}
      >
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

        <AboutValuesGrid />
      </Section>

      <Section id="work" size="sm" eyebrow="004 — Our work" className={sectionAnchor}>
        <RevealGroup
          className="mb-20 max-w-3xl space-y-4"
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

      <Section size="sm" eyebrow="005 — FAQ">
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
