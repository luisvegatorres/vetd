import Link from "next/link"

import { ThemeSwitch } from "@/components/theme-switch"
import { WhatsAppButton } from "@/components/whatsapp-button"
import { nav, site } from "@/lib/site"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 sm:px-8">
        <Link
          href="/"
          className="font-heading text-base font-medium uppercase tracking-[0.18em] text-foreground"
        >
          {site.name}
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label.es}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <ThemeSwitch />
          <WhatsAppButton>WhatsApp</WhatsAppButton>
        </div>
      </div>
    </header>
  )
}
