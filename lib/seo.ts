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

export function buildAlternates(
  locale: Locale,
  path = "",
  availableLocales?: readonly Locale[],
) {
  const languages: Record<string, string> = {}
  const allow = availableLocales ?? (site.supportedLocales as readonly Locale[])
  for (const l of site.supportedLocales) {
    if (!allow.includes(l as Locale)) continue
    languages[l] = localeUrl(l as Locale, path)
  }
  // x-default always points at the default locale URL when it's available;
  // otherwise fall back to the first available locale so we never emit a
  // dangling alternate.
  const xDefaultLocale = allow.includes(site.defaultLocale as Locale)
    ? (site.defaultLocale as Locale)
    : allow[0]
  if (xDefaultLocale) {
    languages["x-default"] = localeUrl(xDefaultLocale, path)
  }
  return {
    canonical: localeUrl(locale, path),
    languages,
  }
}
