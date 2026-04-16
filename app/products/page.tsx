import type { Metadata } from "next"

import { Section } from "@/components/section"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
        <div className="max-w-3xl space-y-6">
          <Badge
            variant="outline"
            className="rounded-none border-primary/50 bg-transparent px-3 py-1 text-[10px] tracking-[0.22em] text-primary uppercase"
          >
            Our products
          </Badge>
          <h1 className="font-heading text-5xl leading-[0.95] tracking-tight text-foreground uppercase sm:text-6xl">
            Digital products built to perform.
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            From a $97/mo website to a full mobile app — we build what your
            business actually needs.
          </p>
        </div>
      </Section>

      <Section eyebrow="What we build">
        <div className="grid gap-6">
          {products.map((product) => (
            <Card
              key={product.id}
              className="rounded-none bg-card ring-1 ring-border"
            >
              <div className="grid gap-8 p-8 lg:grid-cols-[1.1fr_0.9fr]">
                <CardHeader className="space-y-4 p-0">
                  <CardTitle className="font-heading text-3xl tracking-tight text-foreground uppercase">
                    {product.name}
                  </CardTitle>
                  <p className="text-xs tracking-[0.18em] text-primary uppercase">
                    {product.tagline}
                  </p>
                  <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {product.description}
                  </p>
                </CardHeader>

                <CardContent className="grid gap-6 p-0 sm:grid-cols-2">
                  <div className="space-y-2 border-t border-border pt-4">
                    <p className="text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
                      Starting at
                    </p>
                    <p className="font-heading text-2xl text-foreground">
                      {product.startingAt ?? "See pricing tiers"}
                    </p>
                  </div>

                  <div className="space-y-2 border-t border-border pt-4">
                    <p className="text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
                      Timeline
                    </p>
                    <p className="font-heading text-2xl text-foreground">
                      {product.timeline}
                    </p>
                  </div>

                  {product.pricingTiers ? (
                    <div className="space-y-3 border-t border-border pt-4 sm:col-span-2">
                      {product.pricingTiers.map((tier) => (
                        <p
                          key={tier}
                          className="text-sm leading-relaxed text-muted-foreground"
                        >
                          {tier}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section size="lg" className="border-b-0 bg-card/40">
        <div className="mx-auto max-w-3xl space-y-8 text-center">
          <h2 className="font-heading text-4xl leading-none tracking-tight text-foreground uppercase sm:text-5xl">
            Not sure which product is right for you?
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            Book a free 20-minute discovery call. We&apos;ll point you in the
            right direction.
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
