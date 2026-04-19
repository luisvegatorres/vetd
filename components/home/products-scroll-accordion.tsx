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

import { financing, type Product } from "@/lib/site"

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
      <div className="sticky top-16 flex h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-background">
        {header ? <div className="bg-background">{header}</div> : null}
        <div className="relative flex flex-1 flex-col overflow-hidden px-6 py-16 sm:px-10 sm:py-24 lg:px-20">
          <div className="relative grid flex-1 grid-cols-1 grid-rows-1">
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
        transformOrigin: "50% 50%",
        willChange: "transform, opacity",
      }}
      className="relative col-start-1 row-start-1 mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden bg-card ring-1 ring-border"
    >
        <div className="relative grid gap-10 p-8 sm:p-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-16 lg:p-16">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="font-heading text-xs tracking-badge text-muted-foreground tabular-nums">
                / {number}
              </span>
              <span className="h-px w-12 bg-foreground/30" />
              <span className="text-xs tracking-badge text-muted-foreground uppercase">
                {index + 1} of {total}
              </span>
            </div>

            <div className="space-y-4">
              <h3 className="font-heading text-xl leading-section tracking-tight text-foreground capitalize sm:text-2xl lg:text-3xl">
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
              <div className="flex items-center gap-3 pt-2 text-xs tracking-badge text-muted-foreground uppercase">
                <ArrowUpRight
                  className="size-4 text-foreground"
                  strokeWidth={1.5}
                />
                Scroll to continue
              </div>
            ) : null}
          </div>

          <div className="grid content-start gap-6 border-t border-border pt-8 sm:grid-cols-2 lg:grid-cols-1 lg:border-t-0 lg:pt-0 lg:pl-12">
            <MetaBlock label="Timeline">{product.timeline}</MetaBlock>
            {product.financingEligible ? (
              <MetaBlock label="Financing">
                {financing.headlineShort}
              </MetaBlock>
            ) : null}
            {product.pricingTiers ? (
              <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                <p className="text-xs tracking-badge text-muted-foreground uppercase">
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
            {product.includes ? (
              <div className="space-y-3 sm:col-span-2 lg:col-span-1">
                <p className="text-xs tracking-badge text-muted-foreground uppercase">
                  What&apos;s included
                </p>
                <ul className="space-y-2">
                  {product.includes.map((item) => (
                    <li
                      key={item}
                      className="flex gap-3 text-xs leading-relaxed text-muted-foreground sm:text-sm"
                    >
                      <span
                        className="mt-1.5 size-1 shrink-0 bg-foreground/60"
                        aria-hidden
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {product.tools ? (
              <div className="space-y-3 sm:col-span-2 lg:col-span-1">
                <p className="text-xs tracking-badge text-muted-foreground uppercase">
                  Built with
                </p>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                  {product.tools.map((tool) => (
                    <img
                      key={tool.slug}
                      src={`https://cdn.jsdelivr.net/npm/simple-icons@v14/icons/${tool.slug}.svg`}
                      alt={tool.name}
                      loading="lazy"
                      className="h-5 w-auto opacity-55 dark:invert"
                    />
                  ))}
                </div>
              </div>
            ) : null}
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
      <p className="text-xs tracking-badge text-muted-foreground uppercase">
        {label}
      </p>
      <p className="font-heading text-lg leading-tight text-foreground sm:text-xl">
        {children}
      </p>
    </div>
  )
}
