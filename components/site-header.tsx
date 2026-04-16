import Link from "next/link"

import { nav, site } from "@/lib/site"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6 sm:px-8">
        <Link
          href="/"
          className="font-heading text-base font-medium tracking-[0.18em] text-foreground uppercase"
        >
          {site.name}
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/contact"
          className="inline-flex h-11 items-center justify-center rounded-none bg-primary px-5 text-sm font-medium tracking-[0.14em] text-primary-foreground uppercase transition-colors hover:bg-primary/85"
        >
          Start a project
        </Link>
      </div>
    </header>
  )
}
