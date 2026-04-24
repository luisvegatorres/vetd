import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { hasLocale, NextIntlClientProvider } from "next-intl"
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server"

import { JsonLd } from "@/components/seo/json-ld"
import { routing, type Locale } from "@/i18n/routing"
import { buildAlternates } from "@/lib/seo"
import { site, siteMeta } from "@/lib/site"
import {
  organizationSchema,
  websiteSchema,
} from "@/lib/structured-data"

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) return {}
  const typedLocale = locale as Locale
  const meta = siteMeta[typedLocale]
  const alternates = buildAlternates(typedLocale)

  return {
    title: { default: meta.title, template: `%s ▪ ${site.name}` },
    description: meta.description,
    alternates,
    openGraph: {
      type: "website",
      siteName: site.name,
      title: meta.title,
      description: meta.description,
      url: alternates.canonical,
      locale: typedLocale === "es" ? "es_ES" : "en_US",
      alternateLocale:
        typedLocale === "es" ? ["en_US"] : ["es_ES"],
    },
    twitter: {
      card: "summary_large_image",
      site: site.twitterHandle,
      creator: site.twitterHandle,
      title: meta.title,
      description: meta.description,
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  setRequestLocale(locale)

  const messages = await getMessages()
  const typedLocale = locale as Locale

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <JsonLd data={organizationSchema()} />
      <JsonLd data={websiteSchema(typedLocale)} />
      {children}
    </NextIntlClientProvider>
  )
}
