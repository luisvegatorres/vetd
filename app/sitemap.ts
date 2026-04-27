import type { MetadataRoute } from "next"

import { type Locale } from "@/i18n/routing"
import { createClient } from "@/lib/supabase/server"
import { localeUrl } from "@/lib/seo"
import { site } from "@/lib/site"

type SitemapEntry = MetadataRoute.Sitemap[number]

const STATIC_PATHS = ["", "/contact", "/financing", "/blog"] as const

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

async function blogPostEntries(): Promise<SitemapEntry[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("blog_posts")
      .select("slug, updated_at, title_es, body_md_es, published_at")
      .eq("status", "published")
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })

    if (error || !data) return []

    return data.map((row) => {
      const path = `/blog/${row.slug}`
      const hasEs = Boolean(row.title_es && row.body_md_es)
      const languages: Record<string, string> = {
        en: localeUrl("en", path),
      }
      if (hasEs) languages.es = localeUrl("es", path)
      return {
        url: localeUrl(site.defaultLocale as Locale, path),
        lastModified: row.updated_at ? new Date(row.updated_at) : new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
        alternates: { languages },
      } satisfies SitemapEntry
    })
  } catch {
    return []
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
  const [work, posts] = await Promise.all([
    caseStudyEntries(),
    blogPostEntries(),
  ])
  return [...statics, ...work, ...posts]
}
