"use client"

import * as React from "react"
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react"

import { cn } from "@/lib/utils"
import { processArtifacts, type ProcessStep } from "@/lib/site"

type ProcessHeading = {
  eyebrow: string
  title: string
  subtitle?: string
}

type ProcessHorizontalChaptersProps = {
  steps: readonly ProcessStep[]
  eyebrow?: string
  heading: ProcessHeading
}

export function ProcessHorizontalChapters({
  steps,
  eyebrow = "Step by step",
  heading,
}: ProcessHorizontalChaptersProps) {
  const reduceMotion = useReducedMotion()

  return (
    <section aria-label={eyebrow}>
      {/* Desktop: scroll-hijacked horizontal chapters with big→small heading intro */}
      <div className="hidden lg:block">
        {reduceMotion ? (
          <VerticalFallback
            steps={steps}
            eyebrow={eyebrow}
            heading={heading}
          />
        ) : (
          <HorizontalChapters
            steps={steps}
            eyebrow={eyebrow}
            heading={heading}
          />
        )}
      </div>

      {/* Mobile / tablet: vertical fallback */}
      <div className="lg:hidden">
        <VerticalFallback
          steps={steps}
          eyebrow={eyebrow}
          heading={heading}
        />
      </div>
    </section>
  )
}

/* ---------- Desktop: horizontal scroll hijack with intro ---------- */

function HorizontalChapters({
  steps,
  eyebrow,
  heading,
}: {
  steps: readonly ProcessStep[]
  eyebrow: string
  heading: ProcessHeading
}) {
  const outerRef = React.useRef<HTMLDivElement>(null)
  const stickyRef = React.useRef<HTMLDivElement>(null)
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const titleRef = React.useRef<HTMLHeadingElement>(null)
  const [activeIndex, setActiveIndex] = React.useState(0)

  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ["start start", "end end"],
  })

  // Reserve the first viewport of scroll for the big→small heading intro.
  const introFraction = 1 / (steps.length + 1)

  const introProgress = useTransform(
    scrollYProgress,
    [0, introFraction],
    [0, 1],
    { clamp: true }
  )

  // Start/end font size and translate — populated by measurement so the big
  // centered state lands precisely regardless of viewport size.
  const smallTitleFs = useMotionValue(24)
  const bigTitleFs = useMotionValue(24)
  const startTx = useMotionValue(0)
  const startTy = useMotionValue(0)
  const ready = useMotionValue(0)

  React.useLayoutEffect(() => {
    function measure() {
      const wrapper = wrapperRef.current
      const title = titleRef.current
      const sticky = stickyRef.current
      if (!wrapper || !title || !sticky) return

      // Clear any inline style Motion has written so we read the natural
      // (CSS-defined) small state dimensions.
      const prevTranslate = wrapper.style.translate
      const prevTransform = wrapper.style.transform
      const prevTitleFs = title.style.fontSize
      wrapper.style.translate = ""
      wrapper.style.transform = "none"
      title.style.fontSize = ""

      const titleFs = parseFloat(getComputedStyle(title).fontSize)

      const wRect = wrapper.getBoundingClientRect()
      const sRect = sticky.getBoundingClientRect()
      const smallW = wRect.width
      const smallH = wRect.height
      const naturalLeft = wRect.left - sRect.left
      const naturalTop = wRect.top - sRect.top
      const cw = sRect.width
      const ch = sRect.height

      // Restore Motion-owned inline styles so it keeps control.
      wrapper.style.translate = prevTranslate
      wrapper.style.transform = prevTransform
      title.style.fontSize = prevTitleFs

      if (smallW === 0 || smallH === 0) return

      // Big font size = whatever makes the title ~88% wide / 72% tall.
      // Since the title wraps to a fixed number of lines (via max-w-[16ch]),
      // width/height scale linearly with font-size.
      const ratio = Math.min((cw * 0.88) / smallW, (ch * 0.72) / smallH)
      const bigTitle = titleFs * ratio
      const bigW = smallW * ratio
      const bigH = smallH * ratio

      // Translate the small top-left so the big version's center lands on the
      // sticky container's center.
      const tx = cw / 2 - bigW / 2 - naturalLeft
      const ty = ch / 2 - bigH / 2 - naturalTop

      smallTitleFs.set(titleFs)
      bigTitleFs.set(bigTitle)
      startTx.set(tx)
      startTy.set(ty)
      ready.set(1)
    }

    measure()

    const ro = new ResizeObserver(measure)
    const stickyEl = stickyRef.current
    if (stickyEl) ro.observe(stickyEl)
    window.addEventListener("resize", measure)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [bigTitleFs, ready, smallTitleFs, startTx, startTy])

  // Motion-driven interpolation: font-size animates (so text re-rasterizes
  // crisply at every frame) and translate moves the anchor from center to
  // top-left.
  const titleFontSize = useTransform(() => {
    const p = introProgress.get()
    return bigTitleFs.get() * (1 - p) + smallTitleFs.get() * p
  })
  const wrapperX = useTransform(() => startTx.get() * (1 - introProgress.get()))
  const wrapperY = useTransform(() => startTy.get() * (1 - introProgress.get()))
  const wrapperOpacity = useTransform(ready, [0, 1], [0, 1])

  // Eyebrow only appears once the title has settled into the top-left.
  const eyebrowOpacity = useTransform(introProgress, [0.85, 1], [0, 1])

  // Chapter layer — revealed as intro completes.
  const chapterOpacity = useTransform(introProgress, [0.55, 1], [0, 1])

  const chapterProgress = useTransform(
    scrollYProgress,
    [introFraction, 1],
    [0, 1],
    { clamp: true }
  )

  const totalOffset = (steps.length - 1) * 100
  const x = useTransform(chapterProgress, (progress) => {
    return `${-progress * totalOffset}vw`
  })

  const handleProgressChange = React.useEffectEvent((progress: number) => {
    const idx = Math.min(
      steps.length - 1,
      Math.max(0, Math.round(progress * (steps.length - 1)))
    )

    setActiveIndex((current) => (current === idx ? current : idx))
  })

  useMotionValueEvent(chapterProgress, "change", (progress) => {
    handleProgressChange(progress)
  })

  const jumpTo = React.useCallback(
    (index: number) => {
      const outer = outerRef.current
      if (!outer) return

      const rect = outer.getBoundingClientRect()
      const scrollable = outer.offsetHeight - window.innerHeight
      const introOffset = introFraction * scrollable
      const chapterTarget =
        (index / Math.max(1, steps.length - 1)) * (scrollable - introOffset)
      const target = rect.top + window.scrollY + introOffset + chapterTarget

      window.scrollTo({ top: target, behavior: "smooth" })
    },
    [introFraction, steps.length]
  )

  return (
    <div
      ref={outerRef}
      className="relative"
      style={{ height: `${(steps.length + 1) * 100}vh` }}
    >
      <div
        ref={stickyRef}
        className="h-screen-minus-header-dvh sticky top-16 overflow-hidden border-y border-border bg-background"
      >
        <div
          aria-hidden
          className="process-grid-overlay pointer-events-none absolute inset-0 opacity-60"
        />

        {/* Eyebrow — fades in once the title has settled into the corner */}
        <motion.p
          style={{ opacity: eyebrowOpacity }}
          className="pointer-events-none absolute top-20 left-6 z-20 text-xs font-medium tracking-section text-muted-foreground uppercase sm:left-10 lg:left-20"
        >
          {heading.eyebrow}
        </motion.p>

        {/* Morphing title — font-size + translate animate on scroll */}
        <motion.div
          ref={wrapperRef}
          style={{
            x: wrapperX,
            y: wrapperY,
            opacity: wrapperOpacity,
          }}
          className="pointer-events-none absolute top-28 left-6 z-20 will-change-transform sm:left-10 lg:left-20"
        >
          <motion.h2
            ref={titleRef}
            style={{ fontSize: titleFontSize }}
            className="leading-section max-w-[16ch] font-heading text-4xl tracking-tight text-foreground capitalize sm:text-5xl"
          >
            {heading.title}
          </motion.h2>
        </motion.div>

        {/* Chapter layer — fades in as the heading settles into the corner */}
        <motion.div
          style={{ opacity: chapterOpacity }}
          className="relative h-full"
        >
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

          <ChapterDots
            activeIndex={activeIndex}
            total={steps.length}
            onJump={jumpTo}
          />

          <ChapterCounter
            eyebrow={eyebrow}
            activeIndex={activeIndex}
            total={steps.length}
          />
        </motion.div>
      </div>
    </div>
  )
}

/* ---------- Progress dots (bottom center) ---------- */

function ChapterDots({
  activeIndex,
  total,
  onJump,
}: {
  activeIndex: number
  total: number
  onJump: (index: number) => void
}) {
  return (
    <div className="absolute right-0 bottom-8 left-0 z-20 flex justify-center sm:bottom-10">
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
  )
}

/* ---------- Step counter (bottom right) ---------- */

function ChapterCounter({
  eyebrow,
  activeIndex,
  total,
}: {
  eyebrow: string
  activeIndex: number
  total: number
}) {
  return (
    <div className="pointer-events-none absolute right-6 bottom-8 z-20 flex items-center gap-4 sm:right-10 sm:bottom-10 lg:right-20">
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
  heading,
}: {
  steps: readonly ProcessStep[]
  eyebrow: string
  heading: ProcessHeading
}) {
  return (
    <div className="border-t border-border">
      <div className="px-6 py-16 sm:px-12 sm:py-24">
        <p className="mb-6 text-xs font-medium tracking-section text-muted-foreground uppercase">
          {heading.eyebrow}
        </p>
        <div className="max-w-3xl space-y-4">
          <h2 className="leading-section font-heading text-4xl tracking-tight text-foreground capitalize sm:text-5xl">
            {heading.title}
          </h2>
          {heading.subtitle ? (
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              {heading.subtitle}
            </p>
          ) : null}
        </div>
      </div>

      <div className="px-6 pb-8 sm:px-12">
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
