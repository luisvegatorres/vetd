import { setRequestLocale } from "next-intl/server"

import { hasLocale } from "next-intl"
import { notFound } from "next/navigation"

import { Logo } from "@/components/brand/logo"
import { routing } from "@/i18n/routing"

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
            The official Vetd brand mark, lifted from{" "}
            <code className="font-mono text-foreground">public/logo.svg</code>.
            Renders via{" "}
            <code className="font-mono text-foreground">currentColor</code> so
            it inherits the surrounding text color and theme. Used everywhere:
            headers, footers, dashboard sidebar, favicon, apple-touch-icon, and
            OG cards.
          </p>
        </header>

        <section className="mb-16 space-y-4">
          <h2 className="font-heading text-2xl font-medium text-foreground uppercase">
            Mark
          </h2>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            <code className="font-mono">{`<Logo size={…} />`}</code> · 1:1
            aspect, scales freely</p>
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
              components/layout/site-header.tsx — mark 24px mobile, 20px
              desktop
            </li>
            <li>
              <span className="text-foreground">Footer</span> ·
              components/layout/site-footer.tsx — mark 24px
            </li>
            <li>
              <span className="text-foreground">Sidebar</span> ·
              components/dashboard/dashboard-sidebar.tsx — mark 18px expanded,
              20px collapsed
            </li>
            <li>
              <span className="text-foreground">Favicon</span> · app/icon.tsx
              — mark 18px on 32px black canvas
            </li>
            <li>
              <span className="text-foreground">Apple touch icon</span> ·
              app/apple-icon.tsx — mark 120px on 180px black canvas
            </li>
            <li>
              <span className="text-foreground">OG card</span> ·
              app/opengraph-image.tsx — mark 80px
            </li>
          </ul>
        </section>
      </div>
    </main>
  )
}
