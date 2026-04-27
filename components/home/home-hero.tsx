"use client"

import { ArrowRight } from "lucide-react"
import { useTranslations } from "next-intl"

import { Section } from "@/components/layout/section"
import { HeroShader } from "@/components/motion/hero-shader"
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal"
import { TypewriterCycle } from "@/components/motion/typewriter-cycle"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

const OFFER_PRODUCT_KEYS = ["website", "app", "saas", "ai"] as const
const OFFER_TERM_KEYS = ["scope", "payments", "handoff"] as const

export function HomeHero() {
  const t = useTranslations("home.hero")
  const tProducts = useTranslations("home.hero.offer.products")
  const tTerms = useTranslations("home.hero.offer.terms")

  return (
    <HeroShader id="home" className="scroll-mt-20 border-b border-border/60">
      <Section
        size="sm"
        className="min-h-screen-minus-header flex items-center border-b-0 py-12 sm:py-16"
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
                className="rounded-none border-border bg-transparent px-3 py-1 text-muted-foreground uppercase"
              >
                {t("badge")}
              </Badge>
            </RevealItem>

            <RevealItem className="space-y-4" y={24}>
              <h1 className="hero-display-scale font-heading text-5xl leading-hero font-normal text-foreground capitalize sm:text-6xl md:text-7xl">
                <span className="block">
                  {t("headlineStart")}{" "}
                  <TypewriterCycle words={t.raw("headlineCycle")} />
                </span>
                <span className="block">{t("headlineEnd")}</span>
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {t("subhead")}
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
                  "group transition-transform duration-200 hover:scale-[1.02] motion-reduce:hover:scale-100",
                )}
              >
                {t("ctaBookCall")}
                <ArrowRight
                  data-icon="inline-end"
                  className="transition-transform duration-300 group-hover/button:translate-x-1"
                />
              </Link>
            </RevealItem>
          </RevealGroup>

          <Reveal
            className="panel-blur-soft relative overflow-hidden border border-border bg-card/80"
            delay={0.24}
            x={32}
            y={20}
            viewport={{ once: true, amount: 0.35 }}
          >
            <RevealGroup
              className="grid min-h-[34rem] grid-rows-[auto_1fr_auto] gap-8 p-6 sm:p-8 lg:p-10"
              delayChildren={0.18}
              stagger={0.08}
              viewport={{ once: true, amount: 0.5 }}
            >
              <RevealItem className="space-y-5" y={14}>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-overline text-muted-foreground uppercase">
                    {t("panelEyebrow")}
                  </p>
                  <p className="text-overline hidden text-muted-foreground/70 uppercase sm:block">
                    {t("offer.systemLabel")}
                  </p>
                </div>
                <div className="max-w-sm space-y-3">
                  <h2 className="font-heading text-2xl leading-subheading text-foreground sm:text-3xl">
                    {t("offer.title")}
                  </h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t("offer.copy")}
                  </p>
                </div>
              </RevealItem>

              <div className="self-center border-y border-border">
                {OFFER_PRODUCT_KEYS.map((key, index) => (
                  <RevealItem
                    key={key}
                    className="group relative grid cursor-default grid-cols-[3rem_1fr] gap-4 border-b border-border py-4 transition-[transform,background-color,padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] last:border-b-0 hover:bg-muted/30 hover:pl-2 motion-reduce:transition-none motion-reduce:hover:pl-0 sm:grid-cols-[3.5rem_1fr_auto] sm:items-center"
                    x={20 + index * 2}
                    y={0}
                  >
                    <p className="font-heading text-sm text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
                      0{index + 1}
                    </p>
                    <div className="min-w-0 space-y-1">
                      <p className="font-heading text-base text-foreground uppercase">
                        {tProducts(`${key}.title`)}
                      </p>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {tProducts(`${key}.copy`)}
                      </p>
                    </div>
                    <p className="text-overline hidden border border-border px-2 py-1 text-muted-foreground uppercase transition-colors duration-300 group-hover:border-foreground group-hover:text-foreground sm:block">
                      {tProducts(`${key}.tag`)}
                    </p>
                  </RevealItem>
                ))}
              </div>

              <RevealItem y={12}>
                <p className="text-overline mb-4 text-muted-foreground uppercase">
                  {t("offer.termsEyebrow")}
                </p>
                <div className="grid gap-4 sm:grid-cols-3">
                  {OFFER_TERM_KEYS.map((key) => (
                    <div key={key} className="space-y-1">
                      <p className="font-heading text-lg text-foreground uppercase">
                        {tTerms(`${key}.value`)}
                      </p>
                      <p className="text-xs leading-relaxed text-muted-foreground uppercase">
                        {tTerms(`${key}.label`)}
                      </p>
                    </div>
                  ))}
                </div>
              </RevealItem>
            </RevealGroup>
          </Reveal>
        </div>
      </Section>
    </HeroShader>
  )
}
