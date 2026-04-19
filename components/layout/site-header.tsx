"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { nav, site } from "@/lib/site"

const PANEL_EASE = [0.22, 1, 0.36, 1] as const

export function SiteHeader() {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()
  const shouldReduceMotion = useReducedMotion()

  // Close the panel whenever the route changes.
  React.useEffect(() => {
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
          className="font-heading text-base font-medium text-foreground uppercase"
        >
          {site.name}
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs font-medium text-muted-foreground uppercase transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/contact"
            className={cn(
              buttonVariants({ size: "sm" }),
              "hidden text-xs font-medium lg:inline-flex"
            )}
          >
            Start a project
          </Link>

          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav-panel"
            onClick={() => setOpen((value) => !value)}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-none border border-border/60 text-foreground transition-colors hover:bg-muted lg:hidden"
          >
            <span className="sr-only">Toggle menu</span>
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
              {nav.map((item, index) => (
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
                    {item.label}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.35,
                  delay: shouldReduceMotion ? 0 : 0.04 * nav.length,
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
                  Start a project
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
