import type { Metadata } from "next"
import Link from "next/link"

import { Section } from "@/components/section"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

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
        <div className="max-w-3xl space-y-6">
          <Badge
            variant="outline"
            className="rounded-none border-primary/50 bg-transparent px-3 py-1 text-[10px] tracking-[0.22em] text-primary uppercase"
          >
            Our work
          </Badge>
          <h1 className="font-heading text-5xl leading-[0.95] tracking-tight text-foreground uppercase sm:text-6xl">
            Products we&apos;ve built and shipped.
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            Every project starts with a problem. Here&apos;s how we solved them.
          </p>
        </div>
      </Section>

      <Section eyebrow="Filters">
        <div className="flex flex-wrap gap-3">
          {filters.map((filter, index) => (
            <button
              key={filter}
              type="button"
              className={
                "inline-flex h-11 items-center justify-center rounded-none border px-5 text-xs tracking-[0.18em] uppercase transition-colors " +
                (index === 0
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground")
              }
            >
              {filter}
            </button>
          ))}
        </div>
      </Section>

      <Section eyebrow="Portfolio status">
        <Card className="rounded-none bg-card p-10 ring-1 ring-border">
          <CardContent className="space-y-6 px-0">
            <div className="space-y-3">
              <h2 className="font-heading text-4xl leading-none tracking-tight text-foreground uppercase sm:text-5xl">
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
                className="inline-flex h-14 items-center justify-center bg-primary px-8 text-base font-medium tracking-[0.14em] text-primary-foreground uppercase transition-colors hover:bg-primary/85"
              >
                Start a project
              </Link>
            </div>
          </CardContent>
        </Card>
      </Section>
    </>
  )
}
