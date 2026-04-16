import type { Metadata } from "next"

import { RevealGroup, RevealItem } from "@/components/reveal"
import { Section } from "@/components/section"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { site, processSteps } from "@/lib/site"

export const metadata: Metadata = {
  title: "Process",
  description:
    "A product process built for clarity: discovery, proposal, build, launch, and support.",
}

export default function ProcessPage() {
  return (
    <>
      <Section size="md">
        <RevealGroup className="max-w-3xl space-y-6" delayChildren={0.08}>
          <RevealItem y={18}>
            <Badge
              variant="outline"
              className="rounded-none border-border bg-transparent px-3 py-1 text-[10px] tracking-[0.22em] text-muted-foreground uppercase"
            >
              How we work
            </Badge>
          </RevealItem>
          <RevealItem y={24}>
            <h1 className="font-heading text-5xl leading-[0.95] tracking-tight text-foreground uppercase sm:text-6xl">
              A process built for clarity, not chaos.
            </h1>
          </RevealItem>
          <RevealItem y={28}>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              We&apos;ve made it simple. You always know what&apos;s happening,
              what&apos;s next, and what it costs.
            </p>
          </RevealItem>
        </RevealGroup>
      </Section>

      <Section eyebrow="Step by step">
        <RevealGroup className="grid gap-6" delayChildren={0.12} stagger={0.08}>
          {processSteps.map((step) => (
            <RevealItem key={step.number} y={22}>
              <div className="grid gap-6 border-t border-border bg-card p-8 ring-1 ring-border lg:grid-cols-[180px_1fr]">
                <div className="space-y-2">
                  <p className="font-heading text-5xl text-foreground">
                    {step.number}
                  </p>
                  <p className="text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
                    Step {step.number}
                  </p>
                </div>
                <div className="space-y-4">
                  <h2 className="font-heading text-3xl leading-[1.1] tracking-tight text-foreground uppercase">
                    {step.title}
                  </h2>
                  <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
                    {step.copy}
                  </p>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      <Section size="lg" className="border-b-0 bg-card/40">
        <RevealGroup
          className="mx-auto max-w-3xl space-y-8 text-center"
          delayChildren={0.1}
          stagger={0.08}
        >
          <RevealItem y={18}>
            <h2 className="font-heading text-4xl leading-[1.05] tracking-tight text-foreground uppercase sm:text-5xl">
              Want to see the process in action?
            </h2>
          </RevealItem>
          <RevealItem y={22}>
            <p className="text-base leading-relaxed text-muted-foreground">
              Book a free discovery call and we&apos;ll walk you through it.
            </p>
          </RevealItem>
          <RevealItem y={26}>
            <div className="flex justify-center">
              <a
                href={site.discoveryCallHref}
                target={
                  site.discoveryCallHref.startsWith("http")
                    ? "_blank"
                    : undefined
                }
                rel={
                  site.discoveryCallHref.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "rounded-none tracking-[0.14em] uppercase"
                )}
              >
                Book a call
              </a>
            </div>
          </RevealItem>
        </RevealGroup>
      </Section>
    </>
  )
}
