import { setRequestLocale } from "next-intl/server"

import { hasLocale } from "next-intl"
import { notFound } from "next/navigation"

import { Logo, Logotype } from "@/components/brand/logo"
import { routing } from "@/i18n/routing"

const WORDMARK_HEIGHTS = [16, 24, 32, 48, 96] as const
const MARK_SIZES = [16, 24, 32, 64, 128] as const

function Surface({
  background,
  children,
}: {
  background: "dark" | "light"
  children: React.ReactNode
}) {
  const bg =
    background === "dark"
      ? "bg-black text-white"
      : "bg-white text-black border border-black/10"
  return (
    <div className={`flex flex-wrap items-end gap-10 ${bg} px-8 py-10`}>
      {children}
    </div>
  )
}

export default async function LogoLabPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10">
        <header className="mb-12 space-y-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
            Brand mark · shipped
          </p>
          <h1 className="font-heading text-4xl font-medium text-foreground uppercase sm:text-6xl">
            Logo Lab
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            The official Vetd wordmark and standalone V glyph, lifted from{" "}
            <code className="font-mono text-foreground">public/vetd.svg</code>.
            Both render via{" "}
            <code className="font-mono text-foreground">currentColor</code> so
            they inherit the surrounding text color and theme. The wordmark is
            used in headers, footers, and OG cards. The V glyph is used at
            favicon scale and in the collapsed dashboard sidebar.
          </p>
        </header>

        <section className="mb-16 space-y-4">
          <h2 className="font-heading text-2xl font-medium text-foreground uppercase">
            Wordmark
          </h2>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            <code className="font-mono">{`<Logotype height={…} />`}</code>{" "}
            · 3:1 aspect, scales freely
          </p>
          <Surface background="dark">
            {WORDMARK_HEIGHTS.map((h) => (
              <div key={h} className="flex flex-col items-center gap-2">
                <Logotype height={h} />
                <span className="text-[10px] uppercase tracking-widest opacity-60">
                  {h}px
                </span>
              </div>
            ))}
          </Surface>
          <Surface background="light">
            {WORDMARK_HEIGHTS.map((h) => (
              <div key={h} className="flex flex-col items-center gap-2">
                <Logotype height={h} />
                <span className="text-[10px] uppercase tracking-widest opacity-60">
                  {h}px
                </span>
              </div>
            ))}
          </Surface>
        </section>

        <section className="mb-16 space-y-4">
          <h2 className="font-heading text-2xl font-medium text-foreground uppercase">
            V Glyph
          </h2>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            <code className="font-mono">{`<Logo size={…} />`}</code> · used
            for favicon, apple-touch-icon, collapsed sidebar
          </p>
          <Surface background="dark">
            {MARK_SIZES.map((s) => (
              <div key={s} className="flex flex-col items-center gap-2">
                <Logo size={s} />
                <span className="text-[10px] uppercase tracking-widest opacity-60">
                  {s}px
                </span>
              </div>
            ))}
          </Surface>
          <Surface background="light">
            {MARK_SIZES.map((s) => (
              <div key={s} className="flex flex-col items-center gap-2">
                <Logo size={s} />
                <span className="text-[10px] uppercase tracking-widest opacity-60">
                  {s}px
                </span>
              </div>
            ))}
          </Surface>
        </section>

        <section className="space-y-4 border-t border-border/60 pt-8">
          <h2 className="font-heading text-2xl font-medium text-foreground uppercase">
            Wired surfaces
          </h2>
          <ul className="grid gap-2 text-sm leading-relaxed text-muted-foreground sm:grid-cols-2">
            <li>
              <span className="text-foreground">Header</span> ·
              components/layout/site-header.tsx — Logotype 20px
            </li>
            <li>
              <span className="text-foreground">Footer</span> ·
              components/layout/site-footer.tsx — Logotype 24px
            </li>
            <li>
              <span className="text-foreground">Sidebar</span> ·
              components/dashboard/dashboard-sidebar.tsx — Logotype 18px
              expanded, Logo 20px collapsed
            </li>
            <li>
              <span className="text-foreground">Favicon</span> · app/icon.tsx
              — V glyph, 22px on 32px black canvas
            </li>
            <li>
              <span className="text-foreground">Apple touch icon</span> ·
              app/apple-icon.tsx — V glyph, 120px on 180px black canvas
            </li>
            <li>
              <span className="text-foreground">OG card</span> ·
              app/opengraph-image.tsx — Logotype, 80px tall
            </li>
          </ul>
        </section>
      </div>
    </main>
  )
}
