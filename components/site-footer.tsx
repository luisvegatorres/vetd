import Link from "next/link"
import { AtSign, Mail, MapPin, MessageCircle } from "lucide-react"

import { Separator } from "@/components/ui/separator"
import { nav, site } from "@/lib/site"
import { whatsappHref } from "@/lib/whatsapp"

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="w-full border-t border-border/60 bg-background">
      <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-3">
          <div className="space-y-3">
            <p className="font-heading text-base font-medium uppercase tracking-[0.18em] text-foreground">
              {site.name}
            </p>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              {site.tagline.es}
            </p>
            <p className="max-w-xs text-xs uppercase tracking-[0.18em] text-muted-foreground/70">
              {site.tagline.en}
            </p>
          </div>

          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-primary">
              Navegar · Navigate
            </p>
            <ul className="space-y-2.5">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label.es}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-primary">
              Contacto · Contact
            </p>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href={whatsappHref()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-foreground hover:text-primary"
                >
                  <MessageCircle className="size-4" />
                  WhatsApp
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
                  href={site.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <AtSign className="size-4" />@{site.instagram}
                </a>
              </li>
              <li className="inline-flex items-center gap-2 text-muted-foreground">
                <MapPin className="size-4" />
                {site.location}
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-12 bg-border/60" />

        <div className="flex flex-col gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground/70 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {site.name}. Hecho en Puerto Rico.
          </p>
          <p>Sin contrato · No contract · Mes a mes</p>
        </div>
      </div>
    </footer>
  )
}
