import type { Metadata } from "next"

import { ProductsAccordion } from "@/components/products-accordion"
import { RevealGroup, RevealItem } from "@/components/reveal"
import { Section } from "@/components/section"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { site, products } from "@/lib/site"

export const metadata: Metadata = {
  title: "Products",
  description:
    "Digital products built to perform: marketing websites, mobile apps, web apps, growth systems, and AI integrations.",
}

export default function ProductsPage() {
  return (
    <>
      <Section size="md">
        <RevealGroup className="max-w-3xl space-y-6" delayChildren={0.08}>
          <RevealItem y={18}>
            <Badge
              variant="outline"
              className="rounded-none border-border bg-transparent px-3 py-1 text-[10px] tracking-[0.22em] text-muted-foreground uppercase"
            >
              Our products
            </Badge>
          </RevealItem>
          <RevealItem y={24}>
            <h1 className="font-heading text-5xl leading-[0.95] tracking-tight text-foreground uppercase sm:text-6xl">
              Digital products built to perform.
            </h1>
          </RevealItem>
          <RevealItem y={28}>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              From a $97/mo website to a full mobile app — we build what your
              business actually needs.
            </p>
          </RevealItem>
        </RevealGroup>
      </Section>

      <Section eyebrow="What we build">
        <ProductsAccordion products={products} />
      </Section>

      <Section size="lg" className="border-b-0 bg-card/40">
        <RevealGroup
          className="mx-auto max-w-3xl space-y-8 text-center"
          delayChildren={0.1}
          stagger={0.08}
        >
          <RevealItem y={18}>
            <h2 className="font-heading text-4xl leading-[1.05] tracking-tight text-foreground uppercase sm:text-5xl">
              Not sure which product is right for you?
            </h2>
          </RevealItem>
          <RevealItem y={22}>
            <p className="text-base leading-relaxed text-muted-foreground">
              Book a free 20-minute discovery call. We&apos;ll point you in the
              right direction.
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
