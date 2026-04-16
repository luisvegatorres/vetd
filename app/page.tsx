import Link from "next/link"
import { ArrowRight, Quote } from "lucide-react"

import { HomeHero } from "@/components/home-hero"
import { ProcessTimeline } from "@/components/process-timeline"
import { ProductsHoverList } from "@/components/products-hover-list"
import { Section } from "@/components/section"
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
        <RevealGroup
          className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-12"
          delayChildren={0.08}
          stagger={0.08}
        >
          <RevealItem y={18}>
            <h2 className="max-w-3xl font-heading text-4xl leading-[1.05] tracking-tight text-foreground uppercase sm:text-5xl">
              Everything your business needs to compete online.
            </h2>
          </RevealItem>
          <RevealItem y={18} x={20}>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-xs tracking-[0.18em] text-muted-foreground uppercase hover:text-foreground"
            >
              View all products
              <ArrowRight className="size-3.5" />
            </Link>
          </RevealItem>
        </RevealGroup>

        <ProductsHoverList products={products} />
      </Section>

      <Section eyebrow="How we work">
        <Reveal className="mb-12 max-w-3xl space-y-6" y={18}>
          <h2 className="font-heading text-4xl leading-[1.05] tracking-tight text-foreground uppercase sm:text-5xl">
            Simple process. No surprises.
          </h2>
        </Reveal>

        <ProcessTimeline steps={processSteps} />
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
