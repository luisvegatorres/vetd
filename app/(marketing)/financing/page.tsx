import type { Metadata } from "next"
import { ArrowRight } from "lucide-react"

import { BookCallButton } from "@/components/actions/book-call-button"
import { Section } from "@/components/layout/section"
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { financing } from "@/lib/site"

export const metadata: Metadata = {
  title: "Financing",
  description:
    "Build now, pay over 12 months. In-house financing on projects $5K+. 30% deposit, monthly payments, no credit checks.",
}

const howItWorks = [
  {
    number: "01",
    title: "Scope the project",
    copy: "Free discovery call. We agree on scope, timeline, and price before anything moves.",
  },
  {
    number: "02",
    title: "30% deposit kicks off",
    copy: "Every project starts with a 30% deposit. One invoice, one payment — build begins the same week.",
  },
  {
    number: "03",
    title: "Choose how to pay the 70%",
    copy: "Either the full balance on delivery, or 12 equal monthly payments at 0%. Decide at signing.",
  },
  {
    number: "04",
    title: "Deliver, launch, own",
    copy: "You use it from day one. Source code and full account handover when the balance is settled.",
  },
] as const

const trustPoints = [
  {
    title: "0% interest",
    copy: "Same total either way. Split the 70% over 12 months or pay it on delivery — never a cent more.",
  },
  {
    title: "No credit checks",
    copy: "We work off trust and a contract, not a loan application. No pulls, no scoring.",
  },
  {
    title: "No contract surprises",
    copy: "One clear agreement. Late-payment terms and default terms written in plain English.",
  },
] as const

const pricingPaths = [
  {
    tag: "Path A",
    title: "Balance on delivery",
    price: "30% deposit ▪ 70% when it ships",
    copy: "Classic two-payment structure. Pay the balance the week we deliver.",
  },
  {
    tag: "Path B",
    title: "Balance over 12 months",
    price: "30% deposit ▪ 0% interest ▪ 12 equal payments",
    copy: "Same total as Path A, spread across the year. Start this month, pay as you use it.",
  },
] as const

const financingFaq = [
  {
    q: "Who qualifies for financing?",
    a: "Any project quoted at $5,000 or more. We ask that your business has been operating at least 12 months — no paperwork, just the conversation.",
  },
  {
    q: "Is this a loan? Will you pull my credit?",
    a: "No. This is a payment agreement directly with us. No credit check, no credit bureau reporting. We work off a signed contract.",
  },
  {
    q: "Is there really 0% interest?",
    a: "Yes. On a $10,000 project, you'd pay the same $3,000 deposit either way. Then $583.33/mo for 12 months, or $7,000 on delivery — both total $10,000. No interest, no financing fee, no hidden charges.",
  },
  {
    q: "Do I need a deposit either way?",
    a: "Yes. Every project — regardless of how you pay the balance — kicks off with a 30% deposit. This covers scoping, design, and the first sprint of build work. The 70% balance is where the two payment paths split.",
  },
  {
    q: "Why would you offer this for free?",
    a: "Because we'd rather help you ship now than lose the project to cash flow. We bet that you'll come back for the next one — and refer us to someone else.",
  },
  {
    q: "What if I want to pay off early?",
    a: "Pay it off anytime with no penalty. Settle the remaining balance and we close the account.",
  },
  {
    q: "What happens if a payment fails?",
    a: "We retry the card in 3 business days. After 30 days past due, work pauses and we pause access to hosting until it's resolved. We'd always rather talk than chase — reach out if something changes.",
  },
  {
    q: "What do I own while I'm still making payments?",
    a: "You use the product from day one — hosting, domain, your working software. Source code and full account handover happens on the final payment.",
  },
] as const

export default function FinancingPage() {
  return (
    <>
      <Section size="md">
        <RevealGroup
          className="max-w-3xl space-y-8"
          delayChildren={0.1}
          stagger={0.08}
        >
          <RevealItem y={18}>
            <Badge
              variant="outline"
              className="rounded-none border-border bg-transparent px-3 py-1 text-muted-foreground uppercase"
            >
              Financing
            </Badge>
          </RevealItem>

          <RevealItem className="space-y-5" y={26}>
            <h1 className="leading-hero font-heading text-5xl font-normal text-foreground capitalize sm:text-6xl md:text-7xl">
              <span className="block">Build it this month.</span>
              <span className="block">Pay over 12.</span>
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Every project kicks off with a {financing.depositRate}% deposit. For projects
              over ${financing.minAmount.toLocaleString()}, you can pay the 70% balance on
              delivery — or spread it over {financing.months} months at 0%. Same total either
              way. No banks, no credit checks — just a clear contract between us.
            </p>
          </RevealItem>

          <RevealItem y={28}>
            <BookCallButton size="lg" className="group">
              Talk through your numbers
              <ArrowRight className="size-4 transition-transform duration-300 group-hover/button:translate-x-1" />
            </BookCallButton>
          </RevealItem>
        </RevealGroup>
      </Section>

      <Section eyebrow="001 — Trust points" size="md">
        <RevealGroup
          className="grid grid-cols-1 gap-px bg-border sm:grid-cols-3"
          delayChildren={0.08}
          stagger={0.08}
        >
          {trustPoints.map((point) => (
            <RevealItem key={point.title} y={18} className="h-full">
              <div className="flex h-full flex-col gap-4 bg-background p-8">
                <p className="text-xs text-muted-foreground uppercase">
                  {point.title}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {point.copy}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      <Section eyebrow="002 — How it works" size="md">
        <RevealGroup
          className="mb-12 max-w-3xl space-y-4"
          delayChildren={0.08}
          stagger={0.08}
        >
          <RevealItem y={18}>
            <h2 className="leading-section font-heading text-4xl text-foreground capitalize sm:text-5xl">
              Four steps, one signature.
            </h2>
          </RevealItem>
        </RevealGroup>

        <RevealGroup
          className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-4"
          delayChildren={0.08}
          stagger={0.08}
        >
          {howItWorks.map((step) => (
            <RevealItem key={step.number} y={20} className="h-full">
              <div className="flex h-full flex-col justify-between gap-8 bg-background p-8">
                <p className="font-heading text-5xl leading-none text-foreground sm:text-6xl">
                  {step.number}
                </p>
                <div className="space-y-3">
                  <p className="text-xs text-foreground uppercase">
                    {step.title}
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {step.copy}
                  </p>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      <Section eyebrow="003 — Two ways to pay" size="md">
        <RevealGroup
          className="mb-12 max-w-3xl space-y-4"
          delayChildren={0.08}
          stagger={0.08}
        >
          <RevealItem y={18}>
            <h2 className="leading-section font-heading text-4xl text-foreground capitalize sm:text-5xl">
              Same total. Your pace.
            </h2>
          </RevealItem>
          <RevealItem y={20}>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              Example on a $10,000 project. $3,000 deposit either way — the 70% balance is where you choose.
            </p>
          </RevealItem>
        </RevealGroup>

        <div className="grid grid-cols-1 gap-px bg-border lg:grid-cols-2">
          {pricingPaths.map((path) => (
            <Reveal key={path.tag} y={20} className="h-full">
              <div className="flex h-full flex-col gap-8 bg-background p-10">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground uppercase">
                    {path.tag}
                  </span>
                  <span className="h-px w-12 bg-foreground/30" />
                </div>
                <div className="space-y-3">
                  <h3 className="font-heading text-3xl leading-tight text-foreground capitalize sm:text-4xl">
                    {path.title}
                  </h3>
                  <p className="text-sm text-foreground uppercase">
                    {path.price}
                  </p>
                </div>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {path.copy}
                </p>
                {path.tag === "Path A" ? (
                  <div className="mt-auto space-y-2 border-t border-border pt-6">
                    <p className="text-xs text-muted-foreground uppercase">
                      $10,000 project
                    </p>
                    <p className="font-heading text-2xl text-foreground">
                      $3,000 deposit + $7,000 on delivery
                    </p>
                    <p className="text-xs text-muted-foreground uppercase">
                      Two payments ▪ $10,000 total
                    </p>
                  </div>
                ) : (
                  <div className="mt-auto space-y-2 border-t border-border pt-6">
                    <p className="text-xs text-muted-foreground uppercase">
                      $10,000 project
                    </p>
                    <p className="font-heading text-2xl text-foreground">
                      $3,000 deposit + $583.33/mo
                    </p>
                    <p className="text-xs text-muted-foreground uppercase">
                      12 months ▪ $10,000 total
                    </p>
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section size="md" eyebrow="004 — FAQ">
        <div className="faq-split-grid grid gap-12">
          <Reveal y={18}>
            <h2 className="leading-section font-heading text-4xl text-foreground capitalize sm:text-5xl">
              Answers, up front.
            </h2>
          </Reveal>
          <Reveal y={24} x={20}>
            <Accordion>
              {financingFaq.map((item) => (
                <AccordionItem key={item.q} value={item.q}>
                  <AccordionTrigger className="text-left text-base uppercase">
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
            <h2 className="leading-section font-heading text-4xl text-foreground capitalize sm:text-5xl">
              Run the numbers together.
            </h2>
          </RevealItem>
          <RevealItem y={22}>
            <p className="text-base leading-relaxed text-muted-foreground">
              20-minute discovery call. We&apos;ll tell you what the project
              costs and show you both payment paths — no pressure.
            </p>
          </RevealItem>
          <RevealItem y={26}>
            <div className="flex justify-center">
              <BookCallButton size="lg" className="group">
                Book a discovery call
                <ArrowRight className="size-4 transition-transform duration-300 group-hover/button:translate-x-1" />
              </BookCallButton>
            </div>
          </RevealItem>
        </RevealGroup>
      </Section>
    </>
  )
}
