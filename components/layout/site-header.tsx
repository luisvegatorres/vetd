"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { Logo, Logotype } from "@/components/brand/logo"
import { LocaleSwitcher } from "@/components/layout/locale-switcher"
import { buttonVariants } from "@/components/ui/button"
import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { site } from "@/lib/site"

const PANEL_EASE = [0.22, 1, 0.36, 1] as const

const NAV_KEYS = [
  { href: "/#home", key: "home" },
  { href: "/#products", key: "products" },
  { href: "/#process", key: "process" },
  { href: "/#about", key: "about" },
  { href: "/blog", key: "blog" },
  { href: "/financing", key: "financing" },
  { href: "/contact", key: "contact" },
] as const

export function SiteHeader() {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()
  const shouldReduceMotion = useReducedMotion()
  const tNav = useTranslations("nav")

  // Close the panel whenever the route changes.
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false)
  }, [pathname])

  // Lock body scroll while the panel is open.
  React.useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  // Close on Escape.
  React.useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open])

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="flex h-16 w-full items-center justify-between px-6 sm:px-10 lg:px-20">
        <Link
          href="/"
          aria-label={site.name}
          className="inline-flex items-center text-foreground"
        >
          <Logo size={24} className="lg:hidden" />
          <Logotype height={20} className="hidden lg:block" />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_KEYS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs font-medium text-muted-foreground uppercase transition-colors hover:text-foreground"
            >
              {tNav(item.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LocaleSwitcher />

          <button
            type="button"
            aria-label={open ? tNav("closeMenu") : tNav("openMenu")}
            aria-expanded={open}
            aria-controls="mobile-nav-panel"
            onClick={() => setOpen((value) => !value)}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-none border border-border/60 text-foreground transition-colors hover:bg-muted lg:hidden"
          >
            <span className="sr-only">{tNav("toggleMenu")}</span>
            <span className="relative block h-3 w-5">
              <motion.span
                aria-hidden
                className="absolute left-0 top-0 block h-px w-5 bg-current"
                animate={
                  open
                    ? { rotate: 45, y: 6 }
                    : { rotate: 0, y: 0 }
                }
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.25,
                  ease: PANEL_EASE,
                }}
              />
              <motion.span
                aria-hidden
                className="absolute left-0 bottom-0 block h-px w-5 bg-current"
                animate={
                  open
                    ? { rotate: -45, y: -6 }
                    : { rotate: 0, y: 0 }
                }
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.25,
                  ease: PANEL_EASE,
                }}
              />
            </span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="mobile-panel"
            id="mobile-nav-panel"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.28,
              ease: PANEL_EASE,
            }}
            className="absolute inset-x-0 top-16 border-b border-border/60 bg-background lg:hidden"
          >
            <nav className="flex flex-col px-6 py-6 sm:px-10">
              {NAV_KEYS.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.35,
                    delay: shouldReduceMotion ? 0 : 0.04 * index,
                    ease: PANEL_EASE,
                  }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block border-b border-border/40 py-4 font-heading text-2xl transition-colors",
                      pathname === item.href
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tNav(item.key)}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.35,
                  delay: shouldReduceMotion ? 0 : 0.04 * NAV_KEYS.length,
                  ease: PANEL_EASE,
                }}
                className="pt-6"
              >
                <Link
                  href="/contact"
                  onClick={() => setOpen(false)}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "w-full text-xs font-medium"
                  )}
                >
                  {tNav("startProject")}
                </Link>
              </motion.div>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>

    <AnimatePresence>
      {open ? (
        <motion.div
          key="mobile-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.28,
            ease: PANEL_EASE,
          }}
          onClick={() => setOpen(false)}
          aria-hidden
          className="fixed inset-x-0 top-16 bottom-0 z-40 bg-black/50 backdrop-blur-md lg:hidden"
        />
      ) : null}
    </AnimatePresence>
    </>
  )
}
