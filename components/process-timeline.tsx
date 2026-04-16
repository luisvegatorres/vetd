"use client"

import * as React from "react"
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react"

import { processArtifacts } from "@/lib/site"
import type { ProcessStep } from "@/lib/site"

const EASE = [0.22, 1, 0.36, 1] as const

type ProcessTimelineProps = {
  steps: readonly ProcessStep[]
  startLabel?: string
  endLabel?: string
}

export function ProcessTimeline({
  steps,
  startLabel = "When you start",
  endLabel = "When you're live",
}: ProcessTimelineProps) {
  const reduceMotion = useReducedMotion()
  const containerRef = React.useRef<HTMLDivElement>(null)
  const dotRefs = React.useRef<(HTMLSpanElement | null)[]>([])
  const [thresholds, setThresholds] = React.useState<number[]>(() =>
    steps.map((_, i) => (i + 1) / (steps.length + 1))
  )
  const [activeIndex, setActiveIndex] = React.useState(0)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 80%", "end 40%"],
  })

  const fillHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"])

  // Measure each dot's vertical center as a fraction of the container's
  // height — those fractions are the exact scrollYProgress values at which
  // the progress spine reaches each dot.
  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const measure = () => {
      const containerRect = container.getBoundingClientRect()
      if (containerRect.height === 0) return
      const next = dotRefs.current.map((dot) => {
        if (!dot) return 1
        const dotRect = dot.getBoundingClientRect()
        const dotCenter =
          dotRect.top - containerRect.top + dotRect.height / 2
        return dotCenter / containerRect.height
      })
      setThresholds(next)
    }

    measure()
    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(container)
    window.addEventListener("resize", measure)
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [steps.length])

  // Switch the active artifact a little before the spine reaches each dot —
  // 75% of the way through the gap from the previous dot. This gives the
  // card a subtle lead so it feels responsive, without flipping as early as
  // the midpoint between dots.
  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    let idx = 0
    for (let i = 1; i < thresholds.length; i++) {
      const prev = thresholds[i - 1]
      const switchPoint = prev + (thresholds[i] - prev) * 0.75
      if (progress >= switchPoint) idx = i
    }
    if (idx !== activeIndex) setActiveIndex(idx)
  })

  const activeStep = steps[activeIndex]
  const activeArtifact = activeStep
    ? processArtifacts[activeStep.number]
    : undefined

  return (
    <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-24">
      <div ref={containerRef} className="relative">
        {/* Background spine */}
        <div
          aria-hidden
          className="absolute top-0 bottom-0 left-[11px] w-px bg-border"
        />
        {/* Progress spine */}
        <motion.div
          aria-hidden
          className="absolute top-0 left-[11px] w-px origin-top bg-foreground"
          style={{ height: reduceMotion ? "100%" : fillHeight }}
        />

        {/* Start label */}
        <div className="pb-10 pl-10 sm:pb-12">
          <span className="font-heading text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
            {startLabel}
          </span>
        </div>

        <ol className="space-y-12 sm:space-y-14">
          {steps.map((step, index) => (
            <TimelineStep
              key={step.number}
              step={step}
              dotRef={(element) => {
                dotRefs.current[index] = element
              }}
              scrollYProgress={scrollYProgress}
              threshold={thresholds[index] ?? 1}
              reduceMotion={!!reduceMotion}
            />
          ))}
        </ol>

        {/* End label */}
        <div className="pt-10 pl-10 sm:pt-12">
          <span className="font-heading text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
            {endLabel}
          </span>
        </div>
      </div>

      {/* Right column — sticky artifact, lg+ only */}
      <div className="hidden lg:block">
        <div className="sticky top-28">
          <article className="relative bg-card p-8 ring-1 ring-border">
            <AnimatePresence mode="wait" initial={false}>
              {activeArtifact ? (
                <motion.div
                  key={activeArtifact.kicker}
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduceMotion ? 0 : -14 }}
                  transition={{
                    duration: reduceMotion ? 0.01 : 0.45,
                    ease: EASE,
                  }}
                >
                  <header className="space-y-2">
                    <p className="font-heading text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
                      {activeArtifact.kicker}
                    </p>
                    <h4 className="font-heading text-3xl leading-tight tracking-tight text-foreground uppercase sm:text-4xl">
                      {activeArtifact.title}
                    </h4>
                  </header>

                  <div className="my-6 h-px bg-border" />

                  <ul className="space-y-3">
                    {activeArtifact.bullets.map((bullet) => (
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

                  <div className="mt-8 border-t border-border pt-4">
                    <p className="font-heading text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
                      {activeArtifact.meta}
                    </p>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </article>
        </div>
      </div>
    </div>
  )
}

type TimelineStepProps = {
  step: ProcessStep
  dotRef: (element: HTMLSpanElement | null) => void
  scrollYProgress: MotionValue<number>
  threshold: number
  reduceMotion: boolean
}

function TimelineStep({
  step,
  dotRef,
  scrollYProgress,
  threshold,
  reduceMotion,
}: TimelineStepProps) {
  const active = useTransform(
    scrollYProgress,
    [threshold, Math.min(1, threshold + 0.015)],
    [0, 1]
  )
  const dotOpacity = useTransform(active, [0, 1], [0, 1])
  const dotScale = useTransform(active, [0, 1], [0.5, 1])

  return (
    <motion.li
      className="relative pl-10"
      initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: reduceMotion ? 0.01 : 0.55, ease: EASE }}
    >
      {/* Outer ring */}
      <span
        ref={dotRef}
        aria-hidden
        className="absolute top-[9px] left-[5px] size-3 rounded-full border border-foreground bg-background"
      />
      {/* Inner fill */}
      <motion.span
        aria-hidden
        className="absolute top-[9px] left-[5px] size-3 rounded-full bg-foreground"
        style={{
          opacity: reduceMotion ? 1 : dotOpacity,
          scale: reduceMotion ? 1 : dotScale,
        }}
      />

      <div className="space-y-3">
        <div className="flex items-baseline gap-4 sm:gap-5">
          <span className="font-heading text-xs tracking-[0.22em] text-muted-foreground tabular-nums">
            {step.number}
          </span>
          <h3 className="font-heading text-2xl leading-[1.05] tracking-tight text-foreground uppercase sm:text-3xl lg:text-4xl">
            {step.title}
          </h3>
        </div>
        <p className="max-w-2xl pl-[3.25rem] text-sm leading-relaxed text-muted-foreground sm:text-base">
          {step.copy}
        </p>
      </div>
    </motion.li>
  )
}
