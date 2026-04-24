import { site } from "@/lib/site"
import type { Locale } from "@/i18n/routing"

function trimSlash(path: string) {
  if (!path) return ""
  return path.replace(/^\/+|\/+$/g, "")
}

export function localePath(locale: Locale, path = ""): string {
  const clean = trimSlash(path)
  const prefix = locale === site.defaultLocale ? "" : `/${locale}`
  if (!clean) return prefix || "/"
  return `${prefix}/${clean}`
}

export function localeUrl(locale: Locale, path = ""): string {
  const rel = localePath(locale, path)
  return rel === "/" ? site.url : `${site.url}${rel}`
}

export function buildAlternates(locale: Locale, path = "") {
  const languages: Record<string, string> = {}
  for (const l of site.supportedLocales) {
    languages[l] = localeUrl(l as Locale, path)
  }
  languages["x-default"] = localeUrl(site.defaultLocale as Locale, path)
  return {
    canonical: localeUrl(locale, path),
    languages,
  }
}
