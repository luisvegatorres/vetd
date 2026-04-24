"use client"

import { useLocale, useTranslations } from "next-intl"
import { useTransition } from "react"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { usePathname, useRouter } from "@/i18n/navigation"
import { routing, type Locale } from "@/i18n/routing"
import { cn } from "@/lib/utils"

const LOCALE_COOKIE = "NEXT_LOCALE"

function persistLocaleCookie(next: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
}

export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations("localeSwitcher")
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()

  function handleChange(values: string[]) {
    const next = values[0] as Locale | undefined
    if (!next || next === locale) return
    persistLocaleCookie(next)
    startTransition(() => {
      router.replace(pathname, { locale: next })
    })
  }

  return (
    <ToggleGroup
      value={[locale]}
      onValueChange={handleChange}
      variant="outline"
      size="sm"
      aria-label={t("label")}
      className={cn("text-xs font-medium uppercase", className)}
    >
      {routing.locales.map((value) => (
        <ToggleGroupItem
          key={value}
          value={value}
          aria-label={t(value === "en" ? "english" : "spanish")}
          className="aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
        >
          {value.toUpperCase()}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
