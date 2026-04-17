import Link from "next/link"
import { Calendar, Mail, MessageCircle, Timer } from "lucide-react"

import { ThemeSwitch } from "@/components/actions/theme-switch"
import { RevealGroup, RevealItem } from "@/components/motion/reveal"
import { Separator } from "@/components/ui/separator"
import { nav, site } from "@/lib/site"
import { whatsappHref } from "@/lib/whatsapp"

export function SiteFooter() {
  const year = new Date().getFullYear()
  const whatsappLink = whatsappHref("Hi, I'd like to talk about a project.")
  const discoveryIsExternal = site.discoveryCallHref.startsWith("http")

  return (
    <footer className="w-full border-t border-border/60 bg-background">
      <div className="w-full px-6 py-16 sm:px-10 lg:px-20">
        <RevealGroup
          className="grid gap-12 md:grid-cols-3"
          delayChildren={0.08}
          stagger={0.08}
          viewport={{ once: true, amount: 0.12 }}
        >
          <RevealItem y={18}>
            <div className="space-y-3">
              <p className="font-heading text-base font-medium tracking-ui text-foreground uppercase">
                {site.name}
              </p>
              <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                {site.description}
              </p>
            </div>
          </RevealItem>

          <RevealItem y={18}>
            <div>
              <p className="mb-4 text-xs font-medium tracking-section text-muted-foreground uppercase">
                Navigate
              </p>
              <ul className="space-y-3">
                {nav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm tracking-ui text-muted-foreground uppercase transition-colors hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </RevealItem>

          <RevealItem y={18}>
            <div>
              <p className="mb-4 text-xs font-medium tracking-section text-muted-foreground uppercase">
                Contact
              </p>
              <ul className="space-y-3 text-sm">
                <li>
                  <a
                    href={site.discoveryCallHref}
                    target={discoveryIsExternal ? "_blank" : undefined}
                    rel={
                      discoveryIsExternal ? "noopener noreferrer" : undefined
                    }
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
          </RevealItem>
        </RevealGroup>

        <Separator className="my-12 bg-border/60" />

        <RevealGroup
          className="flex flex-col gap-2 text-xs tracking-ui text-muted-foreground/70 uppercase sm:flex-row sm:items-center sm:justify-between"
          delayChildren={0.05}
          stagger={0.06}
          viewport={{ once: true, amount: 0.12 }}
        >
          <RevealItem y={14}>
            <p>
              © {year} {site.name}. Built for businesses worldwide.
            </p>
          </RevealItem>
          <RevealItem y={14}>
            <div className="flex items-center gap-6">
              <p>{site.location}</p>
              <ThemeSwitch />
            </div>
          </RevealItem>
        </RevealGroup>
      </div>
    </footer>
  )
}
