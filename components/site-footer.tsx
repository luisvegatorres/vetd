import Link from "next/link"
import { Calendar, Mail, MessageCircle, Timer } from "lucide-react"

import { ThemeSwitch } from "@/components/theme-switch"
import { Separator } from "@/components/ui/separator"
import { nav, site } from "@/lib/site"
import { whatsappHref } from "@/lib/whatsapp"

export function SiteFooter() {
  const year = new Date().getFullYear()
  const whatsappLink = whatsappHref("Hi, I'd like to talk about a project.")
  const discoveryIsExternal = site.discoveryCallHref.startsWith("http")

  return (
    <footer className="w-full border-t border-border/60 bg-background">
      <div className="mx-auto w-full max-w-7xl px-6 py-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-3">
          <div className="space-y-3">
            <p className="font-heading text-base font-medium tracking-[0.18em] text-foreground uppercase">
              {site.name}
            </p>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              {site.description}
            </p>
          </div>

          <div>
            <p className="mb-4 text-xs font-medium tracking-[0.2em] text-primary uppercase">
              Navigate
            </p>
            <ul className="space-y-3">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm tracking-[0.14em] text-muted-foreground uppercase transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-4 text-xs font-medium tracking-[0.2em] text-primary uppercase">
              Contact
            </p>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href={site.discoveryCallHref}
                  target={discoveryIsExternal ? "_blank" : undefined}
                  rel={discoveryIsExternal ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center gap-2 text-foreground hover:text-primary"
                >
                  <Calendar className="size-4" />
                  Book a call
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Mail className="size-4" />
                  {site.email}
                </a>
              </li>
              <li>
                <a
                  href={whatsappLink}
                  target={
                    whatsappLink.startsWith("http") ? "_blank" : undefined
                  }
                  rel={
                    whatsappLink.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <MessageCircle className="size-4" />
                  {site.whatsappDisplay}
                </a>
              </li>
              <li className="inline-flex items-center gap-2 text-muted-foreground">
                <Timer className="size-4" />
                {site.responseTime}
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-12 bg-border/60" />

        <div className="flex flex-col gap-2 text-xs tracking-[0.18em] text-muted-foreground/70 uppercase sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {site.name}. Built for businesses worldwide.
          </p>
          <div className="flex items-center gap-6">
            <p>{site.location}</p>
            <ThemeSwitch />
          </div>
        </div>
      </div>
    </footer>
  )
}
