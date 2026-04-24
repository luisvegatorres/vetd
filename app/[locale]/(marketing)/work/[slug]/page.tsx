import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { hasLocale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { BrandIcon } from "@/components/brand/brand-icons"
import { Section } from "@/components/layout/section"
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal"
import { JsonLd } from "@/components/seo/json-ld"
import { buttonVariants } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { routing, type Locale } from "@/i18n/routing"
import {
  getCaseStudies,
  getCaseStudySlugs,
  type Beat,
  type CaseStudy,
  type Figure,
} from "@/lib/case-studies"
import { buildAlternates, localeUrl } from "@/lib/seo"
import { site } from "@/lib/site"
import { breadcrumbSchema, creativeWorkSchema } from "@/lib/structured-data"
import { cn } from "@/lib/utils"

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getCaseStudySlugs().map((slug) => ({ locale, slug })),
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  if (!hasLocale(routing.locales, locale)) return {}
  const studies = getCaseStudies(locale)
  const study = studies[slug]
  if (!study) return {}
  const alternates = buildAlternates(locale, `/work/${slug}`)
  return {
    title: `${study.title} — ${site.name}`,
    description: study.tagline,
    alternates,
    openGraph: {
      title: study.title,
      description: study.tagline,
      url: alternates.canonical,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: study.title,
      description: study.tagline,
    },
  }
}

function FigureBlock({ figure }: { figure: Figure }) {
  return (
    <figure className="space-y-3">
      <div className="relative aspect-[16/9] overflow-hidden border border-border bg-muted">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
            backgroundSize: "2rem 2rem",
          }}
        />
        {figure.initials ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-heading text-6xl leading-none text-muted-foreground/40 uppercase sm:text-7xl">
              {figure.initials}
            </span>
          </div>
        ) : null}
      </div>
      <figcaption className="text-sm leading-relaxed text-muted-foreground italic">
        {figure.caption}
      </figcaption>
    </figure>
  )
}

function ChapterAside({
  number,
  title,
  caption,
}: {
  number: string
  title: string
  caption?: string
}) {
  return (
    <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
      <p className="font-heading text-xs text-muted-foreground uppercase tracking-wide">
        {number}
      </p>
      <h2 className="font-heading text-2xl leading-snug text-foreground uppercase sm:text-3xl">
        {title}
      </h2>
      {caption ? (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {caption}
        </p>
      ) : null}
      <div className="h-px w-12 bg-foreground/30" />
    </div>
  )
}

function Chapter({
  number,
  title,
  caption,
  children,
}: {
  number: string
  title: string
  caption?: string
  children: React.ReactNode
}) {
  return (
    <Section size="md" className="border-b-0">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)] lg:gap-20">
        <Reveal y={18}>
          <ChapterAside number={number} title={title} caption={caption} />
        </Reveal>
        <div className="space-y-12">{children}</div>
      </div>
    </Section>
  )
}

function BeatBlock({ index, beat }: { index: number; beat: Beat }) {
  return (
    <div className="space-y-3">
      <p className="font-heading text-xs text-muted-foreground uppercase">
        {String(index + 1).padStart(2, "0")}
      </p>
      <h3 className="font-heading text-xl leading-snug text-foreground uppercase sm:text-2xl">
        {beat.title}
      </h3>
      <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
        {beat.body}
      </p>
    </div>
  )
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)

  const study: CaseStudy | undefined = getCaseStudies(locale as Locale)[slug]
  if (!study) notFound()

  const t = await getTranslations("caseStudy")
  const tLabels = await getTranslations("caseStudy.labels")
  const tChapters = await getTranslations("caseStudy.chapters")

  const studyUrl = localeUrl(locale as Locale, `/work/${slug}`)
  const breadcrumbs = breadcrumbSchema([
    { name: site.name, url: localeUrl(locale as Locale) },
    { name: t("back"), url: `${localeUrl(locale as Locale)}#work` },
    { name: study.title, url: studyUrl },
  ])
  const creativeWork = creativeWorkSchema({
    name: study.title,
    description: study.tagline,
    url: studyUrl,
    category: study.category,
    locale: locale as Locale,
  })

  return (
    <>
      <JsonLd data={breadcrumbs} />
      <JsonLd data={creativeWork} />
      <Section size="sm" className="scroll-mt-20 border-b-0 pb-0">
        <Reveal y={12}>
          <Link
            href="/#work"
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            {t("back")}
          </Link>
        </Reveal>
      </Section>

      <Section size="md" className="border-b-0">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)] lg:gap-20">
          <Reveal y={18} className="space-y-3">
            <p className="font-heading text-xs text-muted-foreground uppercase tracking-wide">
              {t("kicker")}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("lead")}
            </p>
          </Reveal>
          <RevealGroup
            className="space-y-10"
            delayChildren={0.08}
            stagger={0.08}
          >
            <RevealItem y={24} className="space-y-8">
              <h1 className="leading-hero font-heading text-5xl text-foreground capitalize sm:text-6xl md:text-7xl">
                {study.title}
              </h1>
              <p className="max-w-3xl text-xl leading-relaxed text-muted-foreground sm:text-2xl">
                {study.tagline}
              </p>
            </RevealItem>
          </RevealGroup>
        </div>

        <Reveal y={18} className="mt-16">
          <dl className="grid grid-cols-2 gap-8 border-t border-border pt-8 sm:grid-cols-4">
            {(
              [
                [tLabels("year"), study.year],
                [tLabels("duration"), study.duration],
                [tLabels("role"), study.role],
                [tLabels("category"), study.category],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="space-y-2">
                <dt className="text-xs font-medium text-muted-foreground uppercase">
                  {label}
                </dt>
                <dd className="font-heading text-base text-foreground uppercase">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </Section>

      <Section size="sm" className="border-b-0">
        <Reveal y={24}>
          <FigureBlock figure={study.leadFigure} />
        </Reveal>
      </Section>

      <Chapter
        number="001"
        title={tChapters("overview.title")}
        caption={tChapters("overview.caption")}
      >
        <Reveal y={18}>
          <p className="text-lg leading-relaxed text-foreground sm:text-xl">
            {study.overview}
          </p>
        </Reveal>
      </Chapter>

      <Chapter
        number="002"
        title={tChapters("constraints.title")}
        caption={tChapters("constraints.caption")}
      >
        <Reveal y={18}>
          <p className="text-lg leading-relaxed text-foreground sm:text-xl">
            {study.problemIntro}
          </p>
        </Reveal>
        <RevealGroup
          className="grid gap-10 sm:grid-cols-2"
          delayChildren={0.08}
          stagger={0.06}
        >
          {study.problem.map((beat, idx) => (
            <RevealItem key={beat.title} y={18}>
              <BeatBlock index={idx} beat={beat} />
            </RevealItem>
          ))}
        </RevealGroup>
      </Chapter>

      <Section size="md" className="border-b-0">
        <Reveal y={18}>
          <blockquote className="border-l border-foreground/30 pl-6 sm:pl-10">
            <p className="font-heading text-2xl leading-snug text-foreground capitalize sm:text-3xl md:text-4xl">
              &ldquo;{study.pullQuote}&rdquo;
            </p>
          </blockquote>
        </Reveal>
      </Section>

      <Chapter
        number="003"
        title={tChapters("decisions.title")}
        caption={tChapters("decisions.caption")}
      >
        <Reveal y={18}>
          <p className="text-lg leading-relaxed text-foreground sm:text-xl">
            {study.solutionIntro}
          </p>
        </Reveal>
        <RevealGroup
          className="grid gap-10 sm:grid-cols-2"
          delayChildren={0.08}
          stagger={0.06}
        >
          {study.solution.map((beat, idx) => (
            <RevealItem key={beat.title} y={18}>
              <BeatBlock index={idx} beat={beat} />
            </RevealItem>
          ))}
        </RevealGroup>
      </Chapter>

      <Section size="sm" className="border-b-0">
        <Reveal y={24}>
          <FigureBlock figure={study.midFigure} />
        </Reveal>
      </Section>

      <Chapter
        number="004"
        title={tChapters("stack.title")}
        caption={tChapters("stack.caption")}
      >
        <RevealGroup
          className="grid gap-0 border-t border-l border-border sm:grid-cols-2 lg:grid-cols-3"
          delayChildren={0.06}
          stagger={0.05}
        >
          {study.stack.map((tech) => (
            <RevealItem key={tech.name} y={18}>
              <div className="h-full space-y-4 border-r border-b border-border bg-card px-6 py-8">
                <div className="flex size-8 items-center justify-center text-foreground">
                  <BrandIcon name={tech.name} />
                </div>
                <div className="space-y-2">
                  <p className="font-heading text-lg text-foreground uppercase">
                    {tech.name}
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {tech.role}
                  </p>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Chapter>

      <Chapter
        number="005"
        title={tChapters("wrote.title")}
        caption={tChapters("wrote.caption")}
      >
        <RevealGroup
          className="divide-y divide-border border-t border-b border-border"
          delayChildren={0.06}
          stagger={0.04}
        >
          {study.features.map((feature, idx) => (
            <RevealItem key={feature} y={12}>
              <div className="flex items-start gap-6 py-4">
                <span className="font-heading text-xs text-muted-foreground uppercase">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <p className="text-base leading-relaxed text-foreground sm:text-lg">
                  {feature}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Chapter>

      <Chapter
        number="006"
        title={tChapters("numbers.title")}
        caption={tChapters("numbers.caption")}
      >
        <RevealGroup
          className="grid gap-0 border-t border-l border-border sm:grid-cols-2 lg:grid-cols-4"
          delayChildren={0.08}
          stagger={0.06}
        >
          {study.metrics.map((metric) => (
            <RevealItem key={metric.label} y={18}>
              <div className="space-y-3 border-r border-b border-border bg-card px-6 py-10">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  {metric.label}
                </p>
                <p className="font-heading text-4xl text-foreground uppercase sm:text-5xl">
                  {metric.value}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Chapter>

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
          <RevealItem y={18}>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("ctaSubtitle")}
            </p>
          </RevealItem>
          <RevealItem
            y={18}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              href="/contact"
              className={cn(
                buttonVariants({ variant: "default" }),
                "inline-flex items-center gap-2",
              )}
            >
              {t("ctaPrimary")}
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/#work"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "inline-flex items-center gap-2",
              )}
            >
              {t("ctaSecondary")}
            </Link>
          </RevealItem>
        </RevealGroup>
      </Section>
    </>
  )
}
