import type { Metadata } from "next"
import { ArrowRight } from "lucide-react"
import { hasLocale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { BlogIndexGrid } from "@/components/blog/blog-index-grid"
import { Section } from "@/components/layout/section"
import { RevealGroup, RevealItem } from "@/components/motion/reveal"
import { JsonLd } from "@/components/seo/json-ld"
import { buttonVariants } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { routing, type Locale } from "@/i18n/routing"
import { getAllPublishedTags, getPublishedPosts } from "@/lib/blog/queries"
import { buildAlternates, localeUrl } from "@/lib/seo"
import { site } from "@/lib/site"
import { breadcrumbSchema } from "@/lib/structured-data"
import { cn } from "@/lib/utils"

// 5-minute ISR. Server actions also revalidatePath('/blog') after publish, so
// edits propagate immediately when staff is authoring; this is the floor for
// crawler / direct-traffic freshness.
export const revalidate = 300

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) return {}
  const t = await getTranslations({ locale, namespace: "blog" })
  const alternates = buildAlternates(locale as Locale, "/blog")
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
    twitter: {
      card: "summary_large_image",
      title: t("metaTitle"),
      description: t("metaDescription"),
    },
  }
}

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) return null
  setRequestLocale(locale)

  const t = await getTranslations({ locale, namespace: "blog" })

  const [posts, tags] = await Promise.all([
    getPublishedPosts(locale as Locale),
    getAllPublishedTags(locale as Locale),
  ])

  const breadcrumbs = breadcrumbSchema([
    { name: site.name, url: localeUrl(locale as Locale) },
    { name: t("metaTitle"), url: localeUrl(locale as Locale, "/blog") },
  ])

  return (
    <>
      <JsonLd data={breadcrumbs} />

      <Section size="md" className="border-b-0 pb-8 sm:pb-12">
        <RevealGroup
          className="max-w-3xl space-y-6"
          delayChildren={0.08}
          stagger={0.08}
        >
          <RevealItem y={18}>
            <p className="font-heading text-xs text-muted-foreground uppercase tracking-wide">
              {t("eyebrow")}
            </p>
          </RevealItem>
          <RevealItem y={18}>
            <h1 className="leading-hero font-heading text-4xl text-foreground capitalize sm:text-5xl md:text-6xl lg:text-7xl">
              {t("headline")}
            </h1>
          </RevealItem>
          <RevealItem y={18}>
            <p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {t("subhead")}
            </p>
          </RevealItem>
        </RevealGroup>
      </Section>

      <Section size="md" className="border-b-0 pt-0 sm:pt-0">
        <BlogIndexGrid posts={posts} tags={tags} locale={locale} />
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
          </RevealItem>
        </RevealGroup>
      </Section>
    </>
  )
}
