import type { Metadata } from "next"
import Link from "next/link"

import { Reveal, RevealGroup, RevealItem } from "@/components/reveal"
import { Section } from "@/components/section"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const filters = [
  "All",
  "Websites",
  "Mobile Apps",
  "Web Apps",
  "Growth Systems",
] as const

export const metadata: Metadata = {
  title: "Work",
  description:
    "See how Innovate App Studios approaches websites, mobile apps, web apps, and growth systems.",
}

export default function WorkPage() {
  return (
    <>
      <Section size="md">
        <RevealGroup className="max-w-3xl space-y-6" delayChildren={0.08}>
          <RevealItem y={18}>
            <Badge
              variant="outline"
              className="rounded-none border-border bg-transparent px-3 py-1 text-[10px] tracking-[0.22em] text-muted-foreground uppercase"
            >
              Our work
            </Badge>
          </RevealItem>
          <RevealItem y={24}>
            <h1 className="font-heading text-5xl leading-[0.95] tracking-tight text-foreground uppercase sm:text-6xl">
              Products we&apos;ve built and shipped.
            </h1>
          </RevealItem>
          <RevealItem y={28}>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              Every project starts with a problem. Here&apos;s how we solved
              them.
            </p>
          </RevealItem>
        </RevealGroup>
      </Section>

      <Section eyebrow="Filters">
        <RevealGroup
          className="flex flex-wrap gap-3"
          delayChildren={0.06}
          stagger={0.05}
        >
          {filters.map((filter, index) => (
            <RevealItem key={filter} y={14}>
              <Button
                type="button"
                size="lg"
                variant={index === 0 ? "default" : "outline"}
                className={cn(
                  "rounded-none tracking-[0.18em] uppercase",
                  index !== 0 &&
                    "bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                {filter}
              </Button>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      <Section eyebrow="Portfolio status">
        <Reveal y={22}>
          <Card className="rounded-none bg-card p-10 ring-1 ring-border">
            <CardContent className="space-y-6 px-0">
              <div className="space-y-3">
                <h2 className="font-heading text-4xl leading-[1.05] tracking-tight text-foreground uppercase sm:text-5xl">
                  We&apos;re building our portfolio in public.
                </h2>
                <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
                  Our first projects are launching now. Check back soon — or
                  become one of our first case studies.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/contact"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "rounded-none tracking-[0.14em] uppercase"
                  )}
                >
                  Start a project
                </Link>
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </Section>
    </>
  )
}
