"use client"

import * as React from "react"
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react"
import { ArrowUpRight } from "lucide-react"

import type { Product } from "@/lib/site"

type ProductsScrollAccordionProps = {
  products: readonly Product[]
  header?: React.ReactNode
}

const SPRING = { stiffness: 320, damping: 40, mass: 0.4 } as const

export function ProductsScrollAccordion({
  products,
  header,
}: ProductsScrollAccordionProps) {
  const sectionRef = React.useRef<HTMLDivElement>(null)
  const headerRef = React.useRef<HTMLDivElement>(null)
  const [headerH, setHeaderH] = React.useState(0)

  React.useLayoutEffect(() => {
    if (!headerRef.current) return
    const el = headerRef.current
    const update = () => setHeaderH(el.offsetHeight)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  })

  // Section must be exactly viewport + (N - 1) * slotHeight so the last card
  // arrives at progress = 1, with no dead scroll after.
  const slotVh = 55
  const sectionVh = 100 + (products.length - 1) * slotVh

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{ height: `${sectionVh}vh` }}
    >
      {header ? (
        <div
          ref={headerRef}
          className="sticky top-16 z-30 border-b border-border bg-background"
        >
          {header}
        </div>
      ) : null}

      <div
        className="sticky overflow-hidden"
        style={{
          top: `calc(4rem + ${headerH}px)`,
          height: `calc(100dvh - 4rem - ${headerH}px)`,
        }}
      >
        <div className="relative h-full">
          {products.map((product, i) => (
            <StackCard
              key={product.id}
              product={product}
              index={i}
              total={products.length}
              progress={scrollYProgress}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function StackCard({
  product,
  index,
  total,
  progress,
}: {
  product: Product
  index: number
  total: number
  progress: MotionValue<number>
}) {
  const reduceMotion = useReducedMotion()
  const N = total
  // Use N - 1 slots so the last card arrives at progress = 1.
  const slot = 1 / (N - 1)
  const slotStart = index * slot
  const nextStart = (index + 1) * slot
  const isFirst = index === 0
  const isLast = index === N - 1

  const rawY = useTransform(
    progress,
    [Math.max(0, slotStart - slot * 0.9), slotStart],
    isFirst || reduceMotion ? ["0vh", "0vh"] : ["110vh", "0vh"]
  )
  const rawScale = useTransform(
    progress,
    [nextStart - slot * 0.6, nextStart],
    isLast || reduceMotion ? [1, 1] : [1, 0.93]
  )
  const rawOpacity = useTransform(
    progress,
    [nextStart - slot * 0.6, nextStart],
    isLast || reduceMotion ? [1, 1] : [1, 0]
  )

  const y = useSpring(rawY, SPRING)
  const scale = useSpring(rawScale, SPRING)
  const opacity = useSpring(rawOpacity, SPRING)

  const number = String(index + 1).padStart(2, "0")

  return (
    <motion.article
      style={{
        y,
        scale,
        opacity,
        zIndex: index + 1,
        transformOrigin: "50% 0%",
        willChange: "transform, opacity",
      }}
      className="absolute inset-x-6 top-12 bottom-12 flex flex-col overflow-hidden bg-card ring-1 ring-border sm:inset-x-10 sm:top-16 sm:bottom-16 lg:inset-x-20 lg:top-20 lg:bottom-20"
    >
      <div className="relative flex h-full flex-col">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/8 via-primary/2 to-transparent"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -right-2 -bottom-10 font-heading text-[clamp(10rem,22vw,24rem)] leading-none tracking-tight text-foreground/[0.035] select-none sm:-right-4 sm:-bottom-16 lg:-right-6 lg:-bottom-20"
        >
          {number}
        </span>

        <div className="relative grid flex-1 content-center gap-10 p-8 sm:p-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-16 lg:p-16">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="font-heading text-xs tracking-badge text-muted-foreground tabular-nums">
                / {number}
              </span>
              <span className="h-px w-12 bg-foreground/30" />
              <span className="text-[10px] tracking-badge text-muted-foreground uppercase">
                {index + 1} of {total}
              </span>
            </div>

            <div className="space-y-4">
              <h3 className="font-heading text-3xl leading-section tracking-tight text-foreground capitalize sm:text-4xl lg:text-6xl">
                {product.name}
              </h3>
              <p className="text-xs tracking-badge text-muted-foreground uppercase sm:text-sm">
                {product.tagline}
              </p>
            </div>

            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {product.description}
            </p>

            {!isLast ? (
              <div className="flex items-center gap-3 pt-2 text-[10px] tracking-badge text-muted-foreground uppercase">
                <ArrowUpRight
                  className="size-4 text-foreground"
                  strokeWidth={1.5}
                />
                Scroll to continue
              </div>
            ) : null}
          </div>

          <div className="grid content-start gap-6 border-t border-border pt-8 sm:grid-cols-2 lg:grid-cols-1 lg:border-t-0 lg:border-l lg:border-border lg:pt-0 lg:pl-12">
            <MetaBlock label="Starting at">
              {product.startingAt ?? "See pricing tiers"}
            </MetaBlock>
            <MetaBlock label="Timeline">{product.timeline}</MetaBlock>
            {product.pricingTiers ? (
              <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                <p className="text-[10px] tracking-badge text-muted-foreground uppercase">
                  Tiers
                </p>
                <ul className="space-y-1">
                  {product.pricingTiers.map((tier) => (
                    <li
                      key={tier}
                      className="text-xs leading-relaxed text-muted-foreground"
                    >
                      {tier}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </motion.article>
  )
}

function MetaBlock({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] tracking-badge text-muted-foreground uppercase">
        {label}
      </p>
      <p className="font-heading text-lg leading-tight text-foreground sm:text-xl">
        {children}
      </p>
    </div>
  )
}
