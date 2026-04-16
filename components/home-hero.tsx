import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { HeroShader } from "@/components/hero-shader"
import { Reveal, RevealGroup, RevealItem } from "@/components/reveal"
import { Section } from "@/components/section"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function HomeHero() {
  return (
    <HeroShader className="border-b border-border/60">
      <Section
        size="sm"
        className="flex min-h-[calc(100svh-4rem)] items-center border-b-0 py-12 sm:py-16"
      >
        <div className="grid items-center gap-12 lg:grid-cols-[1.25fr_0.75fr]">
          <RevealGroup
            className="space-y-8"
            delayChildren={0.12}
            stagger={0.1}
            viewport={{ once: true, amount: 0.4 }}
          >
            <RevealItem y={18}>
              <Badge
                variant="outline"
                className="rounded-none border-border bg-transparent px-3 py-1 text-[10px] tracking-[0.22em] text-muted-foreground uppercase"
              >
                Home
              </Badge>
            </RevealItem>

            <RevealItem className="space-y-4" y={24}>
              <h1 className="font-heading text-5xl leading-[0.95] font-normal tracking-tight text-foreground uppercase sm:text-6xl md:text-7xl lg:text-[5.5rem]">
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
              <Link
                href="/contact"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "group rounded-none tracking-[0.14em] uppercase"
                )}
              >
                Start a project
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/work"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "group rounded-none border-foreground/30 tracking-[0.18em] uppercase hover:bg-foreground/5"
                )}
              >
                See our work
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </RevealItem>
          </RevealGroup>

          <Reveal
            className="bg-card/80 ring-1 ring-border backdrop-blur-[2px]"
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
                <p className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
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
                    <p className="mt-1 text-xs tracking-[0.18em] text-muted-foreground uppercase">
                      {item.label}
                    </p>
                  </RevealItem>
                ))}
              </div>
              <RevealItem
                className="text-[10px] tracking-[0.3em] text-muted-foreground/70 uppercase"
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
