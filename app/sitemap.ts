import type { MetadataRoute } from "next"

import { type Locale } from "@/i18n/routing"
import { createClient } from "@/lib/supabase/server"
import { localeUrl } from "@/lib/seo"
import { site } from "@/lib/site"

type SitemapEntry = MetadataRoute.Sitemap[number]

const STATIC_PATHS = ["", "/contact", "/financing"] as const

function staticEntry(path: string): SitemapEntry {
  const languages: Record<string, string> = {}
  for (const locale of site.supportedLocales) {
    languages[locale] = localeUrl(locale as Locale, path)
  }
  return {
    url: localeUrl(site.defaultLocale as Locale, path),
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: path === "" ? 1 : 0.8,
    alternates: { languages },
  }
}

async function caseStudyEntries(): Promise<SitemapEntry[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("showcase_projects")
      .select("slug, updated_at")
      .eq("published", true)
      .order("sort_order", { ascending: true })

    if (error || !data) return []

    return data.map((row) => {
      const path = `/work/${row.slug}`
      const languages: Record<string, string> = {}
      for (const locale of site.supportedLocales) {
        languages[locale] = localeUrl(locale as Locale, path)
      }
      return {
        url: localeUrl(site.defaultLocale as Locale, path),
        lastModified: row.updated_at ? new Date(row.updated_at) : new Date(),
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: { languages },
      } satisfies SitemapEntry
    })
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const statics = STATIC_PATHS.map((p) => staticEntry(p))
  const work = await caseStudyEntries()
  return [...statics, ...work]
}
