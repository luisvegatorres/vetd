import { products, site } from "@/lib/site"
import type { Locale } from "@/i18n/routing"
import { localeUrl } from "@/lib/seo"

const ORG_ID = `${site.url}#organization`
const WEBSITE_ID = `${site.url}#website`

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: site.name,
    url: site.url,
    logo: `${site.url}/opengraph-image`,
    description: site.description,
    email: site.email,
    sameAs: [...site.sameAs],
  }
}

export function websiteSchema(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: localeUrl(locale),
    name: site.name,
    inLanguage: locale,
    publisher: { "@id": ORG_ID },
  }
}

export function serviceSchemas(locale: Locale) {
  return products.map((product) => ({
    "@context": "https://schema.org",
    "@type": "Service",
    name: product.name,
    description: product.description,
    serviceType: product.tagline,
    areaServed: "Worldwide",
    inLanguage: locale,
    provider: { "@id": ORG_ID },
    url: `${localeUrl(locale)}#products`,
  }))
}

export function breadcrumbSchema(
  items: Array<{ name: string; url: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

type CreativeWorkInput = {
  name: string
  description: string
  url: string
  image?: string | null
  category?: string | null
  locale: Locale
  datePublished?: string
  dateModified?: string
}

export function creativeWorkSchema(input: CreativeWorkInput) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: input.name,
    description: input.description,
    url: input.url,
    inLanguage: input.locale,
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
  }
  if (input.image) data.image = input.image
  if (input.category) data.genre = input.category
  if (input.datePublished) data.datePublished = input.datePublished
  if (input.dateModified) data.dateModified = input.dateModified
  return data
}

export function faqPageSchema(
  items: Array<{ question: string; answer: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  }
}
