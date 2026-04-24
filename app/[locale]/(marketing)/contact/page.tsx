import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { ContactForm } from "@/components/contact/contact-form"
import { routing, type Locale } from "@/i18n/routing"
import { buildAlternates } from "@/lib/seo"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!routing.locales.includes(locale as Locale)) return {}
  const t = await getTranslations({ locale, namespace: "contact" })
  const alternates = buildAlternates(locale as Locale, "/contact")
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

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return <ContactForm />
}
