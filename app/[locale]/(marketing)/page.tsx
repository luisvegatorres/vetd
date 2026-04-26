import type { Metadata } from "next"
import { ArrowRight } from "lucide-react"
import { setRequestLocale } from "next-intl/server"
import { getTranslations } from "next-intl/server"

import { AboutValuesGrid } from "@/components/home/about-values-grid"
import { CraftLogoCloud } from "@/components/home/craft-logo-cloud"
import { HomeHero } from "@/components/home/home-hero"
import { ProcessHorizontalChapters } from "@/components/home/process-horizontal-chapters"
import { ProductsScrollAccordion } from "@/components/home/products-scroll-accordion"
import { Section } from "@/components/layout/section"
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal"
import { JsonLd } from "@/components/seo/json-ld"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { buttonVariants } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { routing, type Locale } from "@/i18n/routing"
import { buildAlternates } from "@/lib/seo"
import { financing } from "@/lib/site"
import { serviceSchemas } from "@/lib/structured-data"
import { cn } from "@/lib/utils"

const sectionAnchor = "scroll-mt-20"

const FAQ_KEYS = [
  "cost",
  "who",
  "payment",
  "after",
  "ownership",
  "start",
] as const

const FINANCING_STAT_KEYS = ["interest", "deposit", "term"] as const

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!routing.locales.includes(locale as Locale)) return {}
  const t = await getTranslations({ locale, namespace: "home" })
  const alternates = buildAlternates(locale as Locale)
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates,
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: alternates.canonical,
      type: "website",
    },
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations("home")
  const tFaq = await getTranslations("home.faq.items")
  const services = serviceSchemas(locale as Locale)

  return (
    <>
      {services.map((service, i) => (
        <JsonLd key={`service-${i}`} data={service} />
      ))}
      <HomeHero />

      <Section size="sm">
        <Reveal y={18}>
          <CraftLogoCloud />
        </Reveal>
      </Section>

      <div id="products" className={sectionAnchor}>
        <ProductsScrollAccordion
          header={
            <div className="px-6 pt-16 sm:px-10 sm:pt-24 lg:px-20">
              <p className="mb-6 text-xs font-medium text-muted-foreground uppercase">
                {t("products.eyebrow")}
              </p>
              <div className="max-w-3xl space-y-4">
                <h2 className="leading-section font-heading text-4xl text-foreground capitalize sm:text-5xl">
                  {t("products.title")}
                </h2>
                <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {t("products.subtitle")}
                </p>
              </div>
            </div>
          }
        />
      </div>

      <div id="process" className={sectionAnchor}>
        <ProcessHorizontalChapters />
      </div>

      <Section
        id="about"
        size="sm"
        eyebrow={t("about.eyebrow")}
        className={cn(sectionAnchor, "border-b-0")}
      >
        <div className="mb-20 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <RevealGroup
            className="space-y-5"
            delayChildren={0.08}
            stagger={0.08}
          >
            <RevealItem y={20}>
              <h2 className="leading-section font-heading text-4xl text-foreground capitalize sm:text-5xl">
                {t("about.title")}
              </h2>
            </RevealItem>
          </RevealGroup>

          <RevealGroup
            className="space-y-5 self-end text-base leading-relaxed text-muted-foreground sm:text-lg"
            delayChildren={0.16}
            stagger={0.08}
          >
            <RevealItem y={22}>
              <p>{t("about.p1")}</p>
            </RevealItem>
            <RevealItem y={22}>
              <p>{t("about.p2")}</p>
            </RevealItem>
          </RevealGroup>
        </div>

        <AboutValuesGrid />
      </Section>

      <Section
        id="financing"
        size="sm"
        eyebrow={t("financing.eyebrow")}
        className={sectionAnchor}
      >
        <div className="mb-16 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <RevealGroup
            className="space-y-5"
            delayChildren={0.08}
            stagger={0.08}
          >
            <RevealItem y={20}>
              <h2 className="leading-section font-heading text-4xl text-foreground capitalize sm:text-5xl">
                {t("financing.title")}
              </h2>
            </RevealItem>
          </RevealGroup>

          <RevealGroup
            className="space-y-5 self-end text-base leading-relaxed text-muted-foreground sm:text-lg"
            delayChildren={0.16}
            stagger={0.08}
          >
            <RevealItem y={22}>
              <p>
                {t("financing.intro", {
                  min: financing.minAmount.toLocaleString(),
                  deposit: financing.depositRate,
                  months: financing.months,
                })}
              </p>
            </RevealItem>
          </RevealGroup>
        </div>

        <RevealGroup
          className="grid grid-cols-1 gap-px bg-border sm:grid-cols-3"
          delayChildren={0.08}
          stagger={0.08}
        >
          {FINANCING_STAT_KEYS.map((key) => (
            <RevealItem key={key} y={20} className="h-full">
              <div className="flex h-full flex-col justify-between gap-8 bg-background p-8">
                <p className="font-heading text-5xl leading-none text-foreground sm:text-6xl">
                  {t(`financing.stats.${key}.value`, {
                    deposit: financing.depositRate,
                    months: financing.months,
                  })}
                </p>
                <div className="space-y-3">
                  <p className="text-xs text-foreground uppercase">
                    {t(`financing.stats.${key}.label`)}
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t(`financing.stats.${key}.copy`)}
                  </p>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal y={22} className="mt-12">
          <Link
            href="/financing"
            className="group inline-flex items-center gap-2 text-xs font-medium text-foreground uppercase transition-colors hover:text-primary"
          >
            {t("financing.cta")}
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </Section>

      <Section size="sm" eyebrow={t("faq.eyebrow")}>
        <div className="faq-split-grid grid gap-12">
          <Reveal y={18}>
            <h2 className="leading-section font-heading text-4xl text-foreground capitalize sm:text-5xl">
              {t("faq.title")}
            </h2>
          </Reveal>
          <Reveal y={24} x={20}>
            <Accordion>
              {FAQ_KEYS.map((key) => (
                <AccordionItem key={key} value={key}>
                  <AccordionTrigger className="text-left text-base uppercase">
                    {tFaq(`${key}.q`)}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {tFaq(`${key}.a`)}
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
              {t("cta.title")}
            </h2>
          </RevealItem>
          <RevealItem y={22}>
            <p className="text-base leading-relaxed text-muted-foreground">
              {t("cta.subtitle")}
            </p>
          </RevealItem>
          <RevealItem y={26}>
            <div className="flex justify-center">
              <Link href="/contact" className={cn(buttonVariants({ size: "lg" }))}>
                {t("cta.button")}
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </RevealItem>
        </RevealGroup>
      </Section>
    </>
  )
}
