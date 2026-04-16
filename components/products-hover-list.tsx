"use client"

import * as React from "react"
import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"
import { ArrowUpRight } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Product } from "@/lib/site"

const EASE = [0.22, 1, 0.36, 1] as const

type ProductsHoverListProps = {
  products: readonly Product[]
  href?: string
}

export function ProductsHoverList({
  products,
  href = "/products",
}: ProductsHoverListProps) {
  const reduceMotion = useReducedMotion()
  const defaultId = products[0]?.id ?? ""
  const [activeId, setActiveId] = React.useState<string>(defaultId)

  const resetActive = React.useCallback(
    () => setActiveId(defaultId),
    [defaultId]
  )

  return (
    <motion.ul
      className="border-t border-border"
      onMouseLeave={resetActive}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          resetActive()
        }
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={{
        hidden: { opacity: 1 },
        visible: {
          opacity: 1,
          transition: {
            delayChildren: reduceMotion ? 0 : 0.1,
            staggerChildren: reduceMotion ? 0 : 0.07,
          },
        },
      }}
    >
      {products.map((product) => {
        const isActive = activeId === product.id

        return (
          <motion.li
            key={product.id}
            className="border-b border-border"
            variants={{
              hidden: { opacity: 0, y: reduceMotion ? 0 : 18 },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: reduceMotion ? 0.01 : 0.55,
                  ease: EASE,
                },
              },
            }}
          >
            <Link
              href={href}
              onMouseEnter={() => setActiveId(product.id)}
              onFocus={() => setActiveId(product.id)}
              className={cn(
                "relative grid grid-cols-[1fr_auto] items-center gap-4 py-5 transition-colors duration-300 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto] sm:gap-8 sm:py-7",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground/35 hover:text-muted-foreground/60"
              )}
            >
              <motion.span
                initial={false}
                animate={{ x: isActive ? (reduceMotion ? 0 : 10) : 0 }}
                transition={{
                  duration: reduceMotion ? 0.01 : 0.5,
                  ease: EASE,
                }}
                className="font-heading text-2xl leading-[0.95] tracking-tight uppercase sm:text-3xl lg:text-4xl"
              >
                {product.name}
              </motion.span>

              <motion.span
                aria-hidden
                initial={false}
                animate={{
                  opacity: isActive ? 1 : 0,
                  x: isActive ? 0 : -10,
                }}
                transition={{
                  duration: reduceMotion ? 0.01 : 0.45,
                  ease: EASE,
                }}
                className="hidden text-xs tracking-[0.18em] text-muted-foreground uppercase sm:block"
              >
                {product.tagline}
              </motion.span>

              <motion.span
                aria-hidden
                initial={false}
                animate={{
                  opacity: isActive ? 1 : 0,
                  x: isActive ? 0 : -8,
                }}
                transition={{
                  duration: reduceMotion ? 0.01 : 0.4,
                  ease: EASE,
                }}
                className="flex size-8 items-center justify-center text-foreground"
              >
                <ArrowUpRight className="size-4" strokeWidth={1.75} />
              </motion.span>
            </Link>
          </motion.li>
        )
      })}
    </motion.ul>
  )
}
