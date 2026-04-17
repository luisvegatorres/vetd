"use client"

import * as React from "react"
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react"

import { cn } from "@/lib/utils"
import { processArtifacts, type ProcessStep } from "@/lib/site"

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

  const totalOffset = (steps.length - 1) * 100
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 260,
    damping: 34,
    mass: 0.22,
    restDelta: 0.0005,
  })

  // Smooth the progress slightly without introducing the heavy drag that
  // comes from springing the full viewport translation directly.
  const x = useTransform(smoothProgress, (progress) => {
    return `${-progress * totalOffset}vw`
  })

  const handleProgressChange = React.useEffectEvent((progress: number) => {
    const idx = Math.min(
      steps.length - 1,
      Math.max(0, Math.round(progress * (steps.length - 1)))
    )

    setActiveIndex((current) => (current === idx ? current : idx))
  })

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    handleProgressChange(progress)
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
      <div className="h-screen-minus-header-dvh sticky top-16 overflow-hidden border-y border-border bg-background">
        <div
          aria-hidden
          className="process-grid-overlay pointer-events-none absolute inset-0 opacity-60"
        />

        <div className="relative h-full">
          <ChapterProgress
            eyebrow={eyebrow}
            activeIndex={activeIndex}
            total={steps.length}
            onJump={jumpTo}
          />

          <motion.div
            className="flex h-full transform-gpu will-change-transform"
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
    </div>
  )
}

/* ---------- Progress header ---------- */

function ChapterProgress({
  eyebrow,
  activeIndex,
  total,
  onJump,
}: {
  eyebrow: string
  activeIndex: number
  total: number
  onJump: (index: number) => void
}) {
  return (
    <div className="chapter-progress-surface absolute top-0 right-0 left-0 z-10 border-b border-border/60">
      <div className="flex h-16 items-center gap-6 px-6 sm:px-10 lg:px-20">
        <span className="text-overline font-heading tracking-badge text-muted-foreground uppercase">
          {eyebrow}
        </span>

        <span className="text-overline font-heading tracking-badge text-foreground tabular-nums uppercase">
          {String(activeIndex + 1).padStart(2, "0")}
          <span className="text-muted-foreground">
            {" "}
            / {String(total).padStart(2, "0")}
          </span>
        </span>

        <div className="ml-auto flex items-center gap-3">
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
      <span className="text-overline font-heading tracking-badge text-muted-foreground uppercase">
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
          <p className="text-process-number font-heading tracking-tight text-foreground tabular-nums">
            {step.number}
          </p>
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="block h-px w-8 bg-foreground/60"
            />
            <p className="text-overline font-heading tracking-badge text-muted-foreground uppercase">
              Step {String(index + 1).padStart(2, "0")} of{" "}
              {String(total).padStart(2, "0")}
            </p>
          </div>
        </div>

        {/* Right: title, copy, deliverable */}
        <div className="flex flex-col gap-8 lg:max-w-xl">
          <div className="space-y-5">
            <h2 className="leading-process-title font-heading text-4xl tracking-tight text-foreground capitalize sm:text-5xl lg:text-6xl">
              {step.title}
            </h2>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              {step.copy}
            </p>
          </div>

          {artifact ? (
            <div className="max-w-md bg-card p-6 ring-1 ring-border">
              <p className="text-overline font-heading tracking-badge text-muted-foreground uppercase">
                {artifact.kicker}
              </p>
              <h3 className="mt-2 font-heading text-xl leading-tight tracking-tight text-foreground capitalize sm:text-2xl">
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
                      className="marker-offset block size-1 bg-foreground"
                    />
                    {bullet}
                  </li>
                ))}
              </ul>
              <div className="mt-5 border-t border-border pt-3">
                <p className="text-overline font-heading tracking-badge text-muted-foreground uppercase">
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
        <p className="text-overline font-heading tracking-badge text-muted-foreground uppercase">
          {eyebrow}
        </p>
      </div>

      <ol className="divide-y divide-border border-y border-border">
        {steps.map((step, index) => {
          const artifact = processArtifacts[step.number]
          return (
            <li key={step.number} className="px-6 py-10 sm:px-12 sm:py-14">
              <div className="process-fallback-grid grid gap-6 lg:gap-10">
                <div className="space-y-2">
                  <p className="font-heading text-6xl leading-none text-foreground sm:text-7xl">
                    {step.number}
                  </p>
                  <p className="text-overline font-heading tracking-badge text-muted-foreground uppercase">
                    Step {String(index + 1).padStart(2, "0")} of{" "}
                    {String(steps.length).padStart(2, "0")}
                  </p>
                </div>
                <div className="space-y-5">
                  <h2 className="leading-section font-heading text-3xl tracking-tight text-foreground capitalize sm:text-4xl">
                    {step.title}
                  </h2>
                  <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
                    {step.copy}
                  </p>
                  {artifact ? (
                    <div className="max-w-md bg-card p-5 ring-1 ring-border">
                      <p className="text-overline font-heading tracking-badge text-muted-foreground uppercase">
                        {artifact.kicker}
                      </p>
                      <h3 className="mt-1 font-heading text-lg tracking-tight text-foreground capitalize">
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
                              className="marker-offset block size-1 bg-foreground"
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
