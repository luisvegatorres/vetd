import { Mail, Timer } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { ThemeSwitch } from "@/components/actions/theme-switch"
import { Logotype } from "@/components/brand/logo"
import { RevealGroup, RevealItem } from "@/components/motion/reveal"
import { Separator } from "@/components/ui/separator"
import { Link } from "@/i18n/navigation"
import { site } from "@/lib/site"

const NAV_KEYS = [
  { href: "/#home", key: "home" },
  { href: "/#products", key: "products" },
  { href: "/#process", key: "process" },
  { href: "/#about", key: "about" },
  { href: "/financing", key: "financing" },
  { href: "/contact", key: "contact" },
] as const

export async function SiteFooter() {
  const year = new Date().getFullYear()
  const tFooter = await getTranslations("footer")
  const tNav = await getTranslations("nav")
  const tSite = await getTranslations("site")

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
              <Logotype
                height={24}
                aria-label={site.name}
                className="text-foreground"
              />
              <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                {tSite("description")}
              </p>
            </div>
          </RevealItem>

          <RevealItem y={18}>
            <div>
              <p className="mb-4 text-xs font-medium text-muted-foreground uppercase">
                {tFooter("navigate")}
              </p>
              <ul className="space-y-3">
                {NAV_KEYS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground uppercase transition-colors hover:text-foreground"
                    >
                      {tNav(item.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </RevealItem>

          <RevealItem y={18}>
            <div>
              <p className="mb-4 text-xs font-medium text-muted-foreground uppercase">
                {tFooter("contact")}
              </p>
              <ul className="space-y-3 text-sm">
                <li>
                  <a
                    href={`mailto:${site.email}`}
                    className="inline-flex items-center gap-2 text-foreground hover:text-primary"
                  >
                    <Mail className="size-4" />
                    {site.email}
                  </a>
                </li>
                <li className="inline-flex items-center gap-2 text-muted-foreground">
                  <Timer className="size-4" />
                  {tSite("responseTime")}
                </li>
              </ul>
            </div>
          </RevealItem>
        </RevealGroup>

        <Separator className="my-12 bg-border/60" />

        <RevealGroup
          className="flex flex-col gap-2 text-xs text-muted-foreground/70 uppercase sm:flex-row sm:items-center sm:justify-between"
          delayChildren={0.05}
          stagger={0.06}
          viewport={{ once: true, amount: 0.12 }}
        >
          <RevealItem y={14}>
            <p>{tFooter("rights", { year, name: site.name })}</p>
          </RevealItem>
          <RevealItem y={14}>
            <div className="flex items-center gap-6">
              <p>{tSite("location")}</p>
              <ThemeSwitch />
            </div>
          </RevealItem>
        </RevealGroup>
      </div>
    </footer>
  )
}
