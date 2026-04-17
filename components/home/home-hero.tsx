import { ArrowRight } from "lucide-react"

import { BookCallButton } from "@/components/actions/book-call-button"
import { Section } from "@/components/layout/section"
import { HeroShader } from "@/components/motion/hero-shader"
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal"
import { Badge } from "@/components/ui/badge"

export function HomeHero() {
  return (
    <HeroShader
      id="home"
      className="scroll-mt-20 border-b border-border/60"
    >
      <Section
        size="sm"
        className="flex min-h-screen-minus-header items-center border-b-0 py-12 sm:py-16"
      >
        <div className="hero-split-grid grid items-center gap-12">
          <RevealGroup
            className="space-y-8"
            delayChildren={0.12}
            stagger={0.1}
            viewport={{ once: true, amount: 0.4 }}
          >
            <RevealItem y={18}>
              <Badge
                variant="outline"
                className="text-overline rounded-none border-border bg-transparent px-3 py-1 tracking-badge text-muted-foreground uppercase"
              >
                Home
              </Badge>
            </RevealItem>

            <RevealItem className="space-y-4" y={24}>
              <h1 className="hero-display-scale leading-hero font-heading text-5xl font-normal tracking-tight text-foreground capitalize sm:text-6xl md:text-7xl">
                <span className="block">We build digital</span>
                <span className="block">products that grow</span>
                <span className="block">businesses.</span>
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Websites. Mobile apps. Web apps. AI integrations. Growth
                systems. Built to perform, designed to convert.
              </p>
            </RevealItem>

            <RevealItem
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
              y={28}
            >
              <BookCallButton
                size="lg"
                className="group tracking-wider uppercase"
              >
                Book a discovery call
                <ArrowRight
                  data-icon="inline-end"
                  className="transition-transform duration-300 group-hover/button:translate-x-1"
                />
              </BookCallButton>
            </RevealItem>
          </RevealGroup>

          <Reveal
            className="panel-blur-soft bg-card/80 ring-1 ring-border"
            delay={0.24}
            x={32}
            y={20}
            viewport={{ once: true, amount: 0.35 }}
          >
            <RevealGroup
              className="flex h-full flex-col justify-between gap-8 p-8"
              delayChildren={0.18}
              stagger={0.08}
              viewport={{ once: true, amount: 0.5 }}
            >
              <RevealItem y={14}>
                <p className="text-overline tracking-banner text-muted-foreground uppercase">
                  / 001 - Digital product studio
                </p>
              </RevealItem>
              <div className="space-y-6">
                {[
                  {
                    value: "5",
                    label: "Core product lines",
                  },
                  {
                    value: "Global",
                    label: "Remote delivery from day one",
                  },
                  {
                    value: "Fixed",
                    label: "Scope, timeline, and pricing before build starts",
                  },
                ].map((item, index) => (
                  <RevealItem
                    key={item.label}
                    className="border-t border-border pt-4"
                    x={20 + index * 2}
                    y={0}
                  >
                    <p className="font-heading text-4xl text-foreground">
                      {item.value}
                    </p>
                    <p className="mt-1 text-xs tracking-ui text-muted-foreground uppercase">
                      {item.label}
                    </p>
                  </RevealItem>
                ))}
              </div>
              <RevealItem
                className="text-overline tracking-banner text-muted-foreground/70 uppercase"
                y={12}
              >
                Websites · Apps · Growth · AI
              </RevealItem>
            </RevealGroup>
          </Reveal>
        </div>
      </Section>
    </HeroShader>
  )
}
