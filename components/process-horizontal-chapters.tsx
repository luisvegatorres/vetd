"use client"

import * as React from "react"
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react"

import { cn } from "@/lib/utils"
import { processArtifacts, type ProcessStep } from "@/lib/site"

const EASE = [0.22, 1, 0.36, 1] as const

type ProcessHorizontalChaptersProps = {
  steps: readonly ProcessStep[]
  eyebrow?: string
}

export function ProcessHorizontalChapters({
  steps,
  eyebrow = "Step by step",
}: ProcessHorizontalChaptersProps) {
  const reduceMotion = useReducedMotion()

  return (
    <section aria-label={eyebrow}>
      {/* Desktop: scroll-hijacked horizontal chapters */}
      <div className="hidden lg:block">
        {reduceMotion ? (
          <VerticalFallback steps={steps} eyebrow={eyebrow} />
        ) : (
          <HorizontalChapters steps={steps} eyebrow={eyebrow} />
        )}
      </div>

      {/* Mobile / tablet: vertical fallback */}
      <div className="lg:hidden">
        <VerticalFallback steps={steps} eyebrow={eyebrow} />
      </div>
    </section>
  )
}

/* ---------- Desktop: horizontal scroll hijack ---------- */

function HorizontalChapters({
  steps,
  eyebrow,
}: {
  steps: readonly ProcessStep[]
  eyebrow: string
}) {
  const outerRef = React.useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = React.useState(0)

  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ["start start", "end end"],
  })

  // Translate the horizontal flex in absolute viewport-width units.
  // Each chapter is exactly 100vw, so moving -(n-1) * 100vw brings the
  // last chapter's left edge to the viewport's left edge. Using vw (rather
  // than a % of the flex's layout width) avoids the pitfall where the
  // flex container is sized to its parent (100vw) and percentages would
  // translate by a fraction of 100vw instead of the full content length.
  const xRaw = useTransform(
    scrollYProgress,
    [0, 1],
    [0, -(steps.length - 1) * 100]
  )
  const xSmooth = useSpring(xRaw, {
    stiffness: 220,
    damping: 40,
    mass: 0.6,
  })
  const x = useTransform(xSmooth, (value) => `${value}vw`)

  // Active chapter = nearest integer position on the 0..n-1 axis
  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    const idx = Math.min(
      steps.length - 1,
      Math.max(0, Math.round(progress * (steps.length - 1)))
    )
    if (idx !== activeIndex) setActiveIndex(idx)
  })

  const jumpTo = React.useCallback(
    (index: number) => {
      const outer = outerRef.current
      if (!outer) return
      const rect = outer.getBoundingClientRect()
      const scrollable = outer.offsetHeight - window.innerHeight
      const target =
        rect.top +
        window.scrollY +
        (index / Math.max(1, steps.length - 1)) * scrollable
      window.scrollTo({ top: target, behavior: "smooth" })
    },
    [steps.length]
  )

  return (
    <div
      ref={outerRef}
      className="relative"
      style={{ height: `${steps.length * 100}vh` }}
    >
      <div className="sticky top-16 h-[calc(100dvh-4rem)] overflow-hidden border-y border-border bg-background">
        <ChapterProgress
          eyebrow={eyebrow}
          scrollYProgress={scrollYProgress}
          activeIndex={activeIndex}
          total={steps.length}
          onJump={jumpTo}
        />

        <motion.div
          className="flex h-full will-change-transform"
          style={{ x }}
        >
          {steps.map((step, index) => (
            <Chapter
              key={step.number}
              step={step}
              index={index}
              total={steps.length}
            />
          ))}
        </motion.div>

        <ScrollHint />
      </div>
    </div>
  )
}

/* ---------- Progress header ---------- */

function ChapterProgress({
  eyebrow,
  scrollYProgress,
  activeIndex,
  total,
  onJump,
}: {
  eyebrow: string
  scrollYProgress: MotionValue<number>
  activeIndex: number
  total: number
  onJump: (index: number) => void
}) {
  return (
    <div className="absolute top-0 right-0 left-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-6 px-8 py-5 sm:px-12 sm:py-6">
        <span className="font-heading text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
          {eyebrow}
        </span>

        <span className="font-heading text-[10px] tracking-[0.22em] text-foreground tabular-nums uppercase">
          {String(activeIndex + 1).padStart(2, "0")}
          <span className="text-muted-foreground">
            {" "}
            / {String(total).padStart(2, "0")}
          </span>
        </span>

        <div className="relative flex-1">
          <div className="h-px bg-border" />
          <motion.div
            aria-hidden
            className="absolute inset-y-0 left-0 h-px origin-left bg-foreground"
            style={{ scaleX: scrollYProgress }}
          />
        </div>

        <div className="flex items-center gap-3">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onJump(i)}
              aria-label={`Jump to step ${String(i + 1).padStart(2, "0")}`}
              className={cn(
                "relative h-2 w-2 border border-foreground transition-all duration-300",
                i === activeIndex
                  ? "scale-125 bg-foreground"
                  : i < activeIndex
                    ? "bg-foreground"
                    : "bg-transparent hover:bg-foreground/30"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------- Scroll hint (subtle, at bottom of viewport) ---------- */

function ScrollHint() {
  return (
    <div className="pointer-events-none absolute right-8 bottom-8 z-10 flex items-center gap-3 sm:right-12 sm:bottom-10">
      <span className="font-heading text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
        Scroll
      </span>
      <motion.span
        aria-hidden
        className="block h-px w-10 bg-muted-foreground/60"
        animate={{ scaleX: [0.4, 1, 0.4], originX: [0, 0, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "left center" }}
      />
    </div>
  )
}

/* ---------- Chapter slide ---------- */

function Chapter({
  step,
  index,
  total,
}: {
  step: ProcessStep
  index: number
  total: number
}) {
  const artifact = processArtifacts[step.number]

  return (
    <article
      className="flex h-full w-screen shrink-0 items-center px-8 pt-24 pb-16 sm:px-16 sm:pt-28"
      aria-label={`Step ${step.number}: ${step.title}`}
    >
      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-16 xl:gap-24">
        {/* Left: huge display number + step label */}
        <div className="relative flex flex-col gap-4">
          <p className="font-heading text-[clamp(8rem,16vw,18rem)] leading-[0.82] tracking-tight text-foreground tabular-nums">
            {step.number}
          </p>
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="block h-px w-8 bg-foreground/60"
            />
            <p className="font-heading text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
              Step {String(index + 1).padStart(2, "0")} of{" "}
              {String(total).padStart(2, "0")}
            </p>
          </div>
        </div>

        {/* Right: title, copy, deliverable */}
        <div className="flex flex-col gap-8 lg:max-w-xl">
          <div className="space-y-5">
            <h2 className="font-heading text-4xl leading-[1.02] tracking-tight text-foreground uppercase sm:text-5xl lg:text-6xl">
              {step.title}
            </h2>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              {step.copy}
            </p>
          </div>

          {artifact ? (
            <div className="max-w-md bg-card p-6 ring-1 ring-border">
              <p className="font-heading text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
                {artifact.kicker}
              </p>
              <h3 className="mt-2 font-heading text-xl leading-tight tracking-tight text-foreground uppercase sm:text-2xl">
                {artifact.title}
              </h3>
              <div className="my-4 h-px bg-border" />
              <ul className="space-y-2">
                {artifact.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground"
                  >
                    <span
                      aria-hidden
                      className="mt-[0.55rem] block size-1 bg-foreground"
                    />
                    {bullet}
                  </li>
                ))}
              </ul>
              <div className="mt-5 border-t border-border pt-3">
                <p className="font-heading text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
                  {artifact.meta}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}

/* ---------- Mobile + reduced-motion fallback ---------- */

function VerticalFallback({
  steps,
  eyebrow,
}: {
  steps: readonly ProcessStep[]
  eyebrow: string
}) {
  return (
    <div className="border-t border-border">
      <div className="px-6 py-8 sm:px-12">
        <p className="font-heading text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
          {eyebrow}
        </p>
      </div>

      <ol className="divide-y divide-border border-y border-border">
        {steps.map((step, index) => {
          const artifact = processArtifacts[step.number]
          return (
            <li key={step.number} className="px-6 py-10 sm:px-12 sm:py-14">
              <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:gap-10">
                <div className="space-y-2">
                  <p className="font-heading text-6xl leading-none text-foreground sm:text-7xl">
                    {step.number}
                  </p>
                  <p className="font-heading text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
                    Step {String(index + 1).padStart(2, "0")} of{" "}
                    {String(steps.length).padStart(2, "0")}
                  </p>
                </div>
                <div className="space-y-5">
                  <h2 className="font-heading text-3xl leading-[1.05] tracking-tight text-foreground uppercase sm:text-4xl">
                    {step.title}
                  </h2>
                  <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
                    {step.copy}
                  </p>
                  {artifact ? (
                    <div className="max-w-md bg-card p-5 ring-1 ring-border">
                      <p className="font-heading text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
                        {artifact.kicker}
                      </p>
                      <h3 className="mt-1 font-heading text-lg tracking-tight text-foreground uppercase">
                        {artifact.title}
                      </h3>
                      <ul className="mt-3 space-y-1.5">
                        {artifact.bullets.map((bullet) => (
                          <li
                            key={bullet}
                            className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground"
                          >
                            <span
                              aria-hidden
                              className="mt-[0.55rem] block size-1 bg-foreground"
                            />
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
