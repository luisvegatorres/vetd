"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Product } from "@/lib/site"

const EASE = [0.22, 1, 0.36, 1] as const

function shortPrice(product: Product): string {
  if (product.startingAt) {
    const monthly = product.startingAt.match(/\$\d+\s*\/\s*mo/i)
    if (monthly) return monthly[0].replace(/\s+/g, "")
    return product.startingAt
  }
  if (product.pricingTiers) {
    const monthly = product.pricingTiers.join(" ").match(/\$\d+\s*\/\s*mo/i)
    if (monthly) return `From ${monthly[0].replace(/\s+/g, "")}`
  }
  return "Custom"
}

type ProductsAccordionProps = {
  products: readonly Product[]
  defaultOpenId?: Product["id"]
}

export function ProductsAccordion({
  products,
  defaultOpenId,
}: ProductsAccordionProps) {
  const reduceMotion = useReducedMotion()
  const initialOpen = defaultOpenId ?? products[0]?.id ?? null
  const [openId, setOpenId] = React.useState<string | null>(initialOpen)

  return (
    <motion.ul
      className="border-t border-border"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.12 }}
      variants={{
        hidden: { opacity: 1 },
        visible: {
          opacity: 1,
          transition: {
            delayChildren: reduceMotion ? 0 : 0.08,
            staggerChildren: reduceMotion ? 0 : 0.06,
          },
        },
      }}
    >
      {products.map((product, index) => {
        const isOpen = openId === product.id
        const number = String(index + 1).padStart(2, "0")
        const meta = `${shortPrice(product)} · ${product.timeline}`

        return (
          <motion.li
            key={product.id}
            className="border-b border-border"
            variants={{
              hidden: {
                opacity: 0,
                y: reduceMotion ? 0 : 16,
              },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: reduceMotion ? 0.01 : 0.5,
                  ease: EASE,
                },
              },
            }}
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : product.id)}
              aria-expanded={isOpen}
              aria-controls={`product-panel-${product.id}`}
              className={cn(
                "group relative grid w-full cursor-pointer grid-cols-[2.25rem_1fr_auto] items-center gap-4 py-6 text-left transition-colors duration-300 hover:bg-card/40 sm:gap-6 sm:py-7",
                isOpen && "bg-card/30"
              )}
            >
              <span className="font-heading text-xs tracking-[0.22em] text-muted-foreground tabular-nums">
                {number}
              </span>

              <span className="flex min-w-0 items-center gap-4 sm:gap-6">
                <motion.span
                  aria-hidden
                  className="hidden h-px shrink-0 bg-foreground/40 sm:block"
                  initial={false}
                  animate={{ width: isOpen ? 64 : 24 }}
                  transition={{
                    duration: reduceMotion ? 0.01 : 0.5,
                    ease: EASE,
                  }}
                />
                <motion.span
                  className="truncate font-heading text-2xl leading-none tracking-tight text-foreground uppercase sm:text-3xl lg:text-4xl"
                  initial={false}
                  animate={{ x: isOpen ? 4 : 0 }}
                  transition={{
                    duration: reduceMotion ? 0.01 : 0.5,
                    ease: EASE,
                  }}
                >
                  {product.name}
                </motion.span>
              </span>

              <span className="flex items-center gap-4 sm:gap-8">
                <AnimatePresence mode="wait" initial={false}>
                  {!isOpen && (
                    <motion.span
                      key="meta"
                      className="hidden text-xs tracking-[0.18em] text-muted-foreground uppercase md:inline"
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{
                        duration: reduceMotion ? 0.01 : 0.3,
                        ease: EASE,
                      }}
                    >
                      {meta}
                    </motion.span>
                  )}
                </AnimatePresence>

                <motion.span
                  aria-hidden
                  className="flex size-8 items-center justify-center text-foreground"
                  animate={{ rotate: isOpen ? 45 : 0 }}
                  transition={{
                    duration: reduceMotion ? 0.01 : 0.45,
                    ease: EASE,
                  }}
                >
                  <Plus className="size-5" strokeWidth={1.5} />
                </motion.span>
              </span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.section
                  id={`product-panel-${product.id}`}
                  key="panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    height: {
                      duration: reduceMotion ? 0.01 : 0.55,
                      ease: EASE,
                    },
                    opacity: {
                      duration: reduceMotion ? 0.01 : 0.4,
                      ease: EASE,
                      delay: reduceMotion ? 0 : 0.05,
                    },
                  }}
                  className="overflow-hidden"
                >
                  <motion.div
                    initial={{ y: reduceMotion ? 0 : 12 }}
                    animate={{ y: 0 }}
                    exit={{ y: reduceMotion ? 0 : 12 }}
                    transition={{
                      duration: reduceMotion ? 0.01 : 0.5,
                      ease: EASE,
                    }}
                    className="grid gap-10 pb-10 sm:grid-cols-[2.25rem_1fr] sm:gap-6 lg:grid-cols-[2.25rem_1.4fr_1fr] lg:gap-12"
                  >
                    <div aria-hidden className="hidden sm:block" />

                    <div className="space-y-4 lg:max-w-xl">
                      <p className="text-xs tracking-[0.22em] text-muted-foreground uppercase">
                        {product.tagline}
                      </p>
                      <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                        {product.description}
                      </p>
                    </div>

                    <div className="grid gap-6 border-t border-border pt-6 sm:grid-cols-2 sm:col-span-2 lg:col-span-1 lg:border-t-0 lg:border-l lg:border-border lg:grid-cols-1 lg:pt-0 lg:pl-10">
                      <div className="space-y-2">
                        <p className="text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
                          Starting at
                        </p>
                        <p className="font-heading text-xl text-foreground">
                          {product.startingAt ?? "See pricing tiers"}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
                          Timeline
                        </p>
                        <p className="font-heading text-xl text-foreground">
                          {product.timeline}
                        </p>
                      </div>
                      {product.pricingTiers ? (
                        <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                          {product.pricingTiers.map((tier) => (
                            <p
                              key={tier}
                              className="text-xs leading-relaxed text-muted-foreground"
                            >
                              {tier}
                            </p>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </motion.div>
                </motion.section>
              )}
            </AnimatePresence>
          </motion.li>
        )
      })}
    </motion.ul>
  )
}
