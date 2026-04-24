import type { Metadata } from "next"
import { ArrowRight, Calculator } from "lucide-react"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { BookCallButton } from "@/components/actions/book-call-button"
import { FinancingCalculatorDialog } from "@/components/actions/financing-calculator-dialog"
import { Section } from "@/components/layout/section"
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal"
import { JsonLd } from "@/components/seo/json-ld"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { routing, type Locale } from "@/i18n/routing"
import { buildAlternates } from "@/lib/seo"
import { financing } from "@/lib/site"
import { faqPageSchema } from "@/lib/structured-data"

const TRUST_KEYS = ["zeroInterest", "noCredit", "noSurprises"] as const
const STEP_KEYS = ["scope", "deposit", "choose", "deliver"] as const
const STEP_NUMBERS: Record<(typeof STEP_KEYS)[number], string> = {
  scope: "01",
  deposit: "02",
  choose: "03",
  deliver: "04",
}
const FAQ_KEYS = [
  "qualifies",
  "loan",
  "interest",
  "deposit",
  "free",
  "early",
  "late",
  "ownership",
] as const

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!routing.locales.includes(locale as Locale)) return {}
  const t = await getTranslations({ locale, namespace: "financing" })
  const alternates = buildAlternates(locale as Locale, "/financing")
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

export default async function FinancingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations("financing")
  const tTrust = await getTranslations("financing.trust")
  const tSteps = await getTranslations("financing.steps")
  const tFaq = await getTranslations("financing.faq")
  const tPathA = await getTranslations("financing.pathA")
  const tPathB = await getTranslations("financing.pathB")

  const faqSchema = faqPageSchema(
    FAQ_KEYS.map((key) => ({
      question: tFaq(`${key}.q`),
      answer: tFaq(`${key}.a`),
    })),
  )

  return (
    <>
      <JsonLd data={faqSchema} />
      <Section size="md">
        <RevealGroup
          className="max-w-3xl space-y-8"
          delayChildren={0.1}
          stagger={0.08}
        >
          <RevealItem y={18}>
            <Badge
              variant="outline"
              className="rounded-none border-border bg-transparent px-3 py-1 text-muted-foreground uppercase"
            >
              {t("badge")}
            </Badge>
          </RevealItem>

          <RevealItem className="space-y-5" y={26}>
            <h1 className="leading-hero font-heading text-5xl font-normal text-foreground capitalize sm:text-6xl md:text-7xl">
              <span className="block">{t("headlineLine1")}</span>
              <span className="block">{t("headlineLine2")}</span>
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("intro", {
                deposit: financing.depositRate,
                min: financing.minAmount.toLocaleString(),
                months: financing.months,
              })}
            </p>
          </RevealItem>

          <RevealItem y={28}>
            <BookCallButton size="lg" className="group">
              {t("ctaTalk")}
              <ArrowRight className="size-4 transition-transform duration-300 group-hover/button:translate-x-1" />
            </BookCallButton>
          </RevealItem>
        </RevealGroup>
      </Section>

      <Section eyebrow={t("trustEyebrow")} size="sm">
        <div className="grid grid-cols-1 gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <Reveal y={18}>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t("trustIntro")}
            </p>
          </Reveal>
          <RevealGroup
            className="divide-y divide-border"
            delayChildren={0.08}
            stagger={0.08}
          >
            {TRUST_KEYS.map((key) => (
              <RevealItem key={key} y={18}>
                <div className="grid grid-cols-1 gap-3 py-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-10 sm:py-8">
                  <p className="font-heading text-sm text-foreground uppercase">
                    {tTrust(`${key}.title`)}
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {tTrust(`${key}.copy`)}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </Section>

      <Section eyebrow={t("stepsEyebrow")} size="md">
        <RevealGroup
          className="mb-12 max-w-3xl space-y-4"
          delayChildren={0.08}
          stagger={0.08}
        >
          <RevealItem y={18}>
            <h2 className="leading-section font-heading text-4xl text-foreground capitalize sm:text-5xl">
              {t("stepsTitle")}
            </h2>
          </RevealItem>
        </RevealGroup>

        <RevealGroup
          className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-4"
          delayChildren={0.08}
          stagger={0.08}
        >
          {STEP_KEYS.map((key) => (
            <RevealItem key={key} y={20} className="h-full">
              <div className="flex h-full flex-col justify-between gap-8 bg-background p-8">
                <p className="font-heading text-5xl leading-none text-foreground sm:text-6xl">
                  {STEP_NUMBERS[key]}
                </p>
                <div className="space-y-3">
                  <p className="text-xs text-foreground uppercase">
                    {tSteps(`${key}.title`)}
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {tSteps(`${key}.copy`)}
                  </p>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      <Section eyebrow={t("pathsEyebrow")} size="lg">
        <RevealGroup
          className="mb-16 max-w-3xl space-y-4"
          delayChildren={0.08}
          stagger={0.08}
        >
          <RevealItem y={18}>
            <h2 className="leading-section font-heading text-4xl text-foreground capitalize sm:text-5xl">
              {t("pathsTitle")}
            </h2>
          </RevealItem>
          <RevealItem y={20}>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("pathsIntro")}
            </p>
          </RevealItem>
        </RevealGroup>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-5 lg:gap-16">
          <Reveal y={20} className="lg:col-span-2">
            <div className="flex h-full flex-col gap-6 border border-border/60 p-8">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground uppercase">
                  {tPathA("tag")}
                </span>
                <span className="h-px w-12 bg-foreground/30" />
              </div>
              <div className="space-y-3">
                <h3 className="font-heading text-2xl leading-tight text-foreground capitalize">
                  {tPathA("title")}
                </h3>
                <p className="text-sm text-foreground uppercase">
                  {tPathA("price")}
                </p>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {tPathA("copy")}
              </p>
              <div className="mt-auto grid grid-cols-3 gap-4 border-t border-border pt-6">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase">
                    {tPathA("fieldDeposit")}
                  </p>
                  <p className="font-heading text-xl text-foreground">
                    $3,000
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase">
                    {tPathA("fieldBalance")}
                  </p>
                  <p className="font-heading text-xl text-foreground">
                    $7,000
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase">
                    {tPathA("fieldTotal")}
                  </p>
                  <p className="font-heading text-xl text-foreground">
                    $10,000
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal y={20} x={16} className="lg:col-span-3">
            <div className="flex h-full flex-col gap-8 border border-foreground bg-card/40 p-10">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-foreground uppercase">
                    {tPathB("tag")}
                  </span>
                  <span className="h-px w-12 bg-foreground" />
                </div>
                <span className="text-xs text-muted-foreground uppercase">
                  {tPathB("emphasis")}
                </span>
              </div>
              <div className="space-y-4">
                <h3 className="font-heading text-4xl leading-tight text-foreground capitalize sm:text-5xl">
                  {tPathB("title")}
                </h3>
                <p className="text-sm text-foreground uppercase">
                  {tPathB("price")}
                </p>
              </div>
              <p className="max-w-lg text-base leading-relaxed text-muted-foreground">
                {tPathB("copy")}
              </p>
              <div className="grid grid-cols-1 gap-6 border-t border-border pt-6 sm:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase">
                    {tPathB("fieldDeposit")}
                  </p>
                  <p className="font-heading text-2xl text-foreground">
                    $3,000
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase">
                    {tPathB("fieldMonthly")}
                  </p>
                  <p className="font-heading text-2xl text-foreground">
                    $583.33
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase">
                    {tPathB("fieldDuration")}
                  </p>
                  <p className="font-heading text-2xl text-foreground">
                    {tPathB("fieldDurationValue")}
                  </p>
                </div>
              </div>
              <div className="mt-auto pt-2">
                <FinancingCalculatorDialog size="lg">
                  <Calculator className="size-4" />
                  {tPathB("calculatorCta")}
                </FinancingCalculatorDialog>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      <Section size="md" eyebrow={t("faqEyebrow")}>
        <div className="faq-split-grid grid gap-12">
          <Reveal y={18}>
            <h2 className="leading-section font-heading text-4xl text-foreground capitalize sm:text-5xl">
              {t("faqTitle")}
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
              {t("ctaTitle")}
            </h2>
          </RevealItem>
          <RevealItem y={22}>
            <p className="text-base leading-relaxed text-muted-foreground">
              {t("ctaSubtitle")}
            </p>
          </RevealItem>
          <RevealItem y={26}>
            <div className="flex justify-center">
              <BookCallButton size="lg" className="group">
                {t("ctaButton")}
                <ArrowRight className="size-4 transition-transform duration-300 group-hover/button:translate-x-1" />
              </BookCallButton>
            </div>
          </RevealItem>
        </RevealGroup>
      </Section>
    </>
  )
}
