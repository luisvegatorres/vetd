import type { Metadata } from "next"

import { Section } from "@/components/section"
import { Badge } from "@/components/ui/badge"
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
        <div className="max-w-3xl space-y-6">
          <Badge
            variant="outline"
            className="rounded-none border-primary/50 bg-transparent px-3 py-1 text-[10px] tracking-[0.22em] text-primary uppercase"
          >
            How we work
          </Badge>
          <h1 className="font-heading text-5xl leading-[0.95] tracking-tight text-foreground uppercase sm:text-6xl">
            A process built for clarity, not chaos.
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            We&apos;ve made it simple. You always know what&apos;s happening,
            what&apos;s next, and what it costs.
          </p>
        </div>
      </Section>

      <Section eyebrow="Step by step">
        <div className="grid gap-6">
          {processSteps.map((step) => (
            <div
              key={step.number}
              className="grid gap-6 border-t-2 border-primary bg-card p-8 ring-1 ring-border lg:grid-cols-[180px_1fr]"
            >
              <div className="space-y-2">
                <p className="font-heading text-5xl text-primary">
                  {step.number}
                </p>
                <p className="text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
                  Step {step.number}
                </p>
              </div>
              <div className="space-y-4">
                <h2 className="font-heading text-3xl tracking-tight text-foreground uppercase">
                  {step.title}
                </h2>
                <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
                  {step.copy}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section size="lg" className="border-b-0 bg-card/40">
        <div className="mx-auto max-w-3xl space-y-8 text-center">
          <h2 className="font-heading text-4xl leading-none tracking-tight text-foreground uppercase sm:text-5xl">
            Want to see the process in action?
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            Book a free discovery call and we&apos;ll walk you through it.
          </p>
          <div className="flex justify-center">
            <a
              href={site.discoveryCallHref}
              target={
                site.discoveryCallHref.startsWith("http") ? "_blank" : undefined
              }
              rel={
                site.discoveryCallHref.startsWith("http")
                  ? "noopener noreferrer"
                  : undefined
              }
              className="inline-flex h-14 items-center justify-center bg-primary px-8 text-base font-medium tracking-[0.14em] text-primary-foreground uppercase transition-colors hover:bg-primary/85"
            >
              Book a call
            </a>
          </div>
        </div>
      </Section>
    </>
  )
}
