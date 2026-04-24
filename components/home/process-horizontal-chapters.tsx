"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react"

import { cn } from "@/lib/utils"

const STEP_NUMBERS = ["01", "02", "03", "04", "05"] as const
type StepNumber = (typeof STEP_NUMBERS)[number]

export function ProcessHorizontalChapters() {
  const reduceMotion = useReducedMotion()

  return (
    <section>
      {/* Desktop: scroll-hijacked horizontal chapters with big→small heading intro */}
      <div className="hidden lg:block">
        {reduceMotion ? <VerticalFallback /> : <HorizontalChapters />}
      </div>

      {/* Mobile / tablet: vertical fallback */}
      <div className="lg:hidden">
        <VerticalFallback />
      </div>
    </section>
  )
}

/* ---------- Desktop: horizontal scroll hijack with intro ---------- */

function HorizontalChapters() {
  const outerRef = React.useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = React.useState(0)
  const t = useTranslations("home.process")

  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ["start start", "end end"],
  })

  const totalOffset = (STEP_NUMBERS.length - 1) * 100
  const x = useTransform(scrollYProgress, (progress) => {
    return `${-progress * totalOffset}vw`
  })

  const handleProgressChange = React.useEffectEvent((progress: number) => {
    const idx = Math.min(
      STEP_NUMBERS.length - 1,
      Math.max(0, Math.round(progress * (STEP_NUMBERS.length - 1))),
    )

    setActiveIndex((current) => (current === idx ? current : idx))
  })

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    handleProgressChange(progress)
  })

  const jumpTo = React.useCallback((index: number) => {
    const outer = outerRef.current
    if (!outer) return

    const rect = outer.getBoundingClientRect()
    const scrollable = outer.offsetHeight - window.innerHeight
    const target =
      rect.top +
      window.scrollY +
      (index / Math.max(1, STEP_NUMBERS.length - 1)) * scrollable

    window.scrollTo({ top: target, behavior: "smooth" })
  }, [])

  return (
    <div
      ref={outerRef}
      className="relative"
      style={{ height: `${STEP_NUMBERS.length * 100}vh` }}
    >
      <div className="h-screen-minus-header-dvh sticky top-16 overflow-hidden border-y border-border bg-background">
        <div
          aria-hidden
          className="process-grid-overlay pointer-events-none absolute inset-0 opacity-60"
        />

        <p className="pointer-events-none absolute top-20 left-6 z-20 text-xs font-medium text-muted-foreground uppercase sm:left-10 lg:left-20">
          {t("eyebrow")}
        </p>

        <h2 className="pointer-events-none absolute top-28 left-6 z-20 max-w-[16ch] font-heading text-4xl leading-section text-foreground capitalize sm:left-10 sm:text-5xl lg:left-20">
          {t("title")}
        </h2>

        <div className="relative h-full">
          <motion.div
            className="flex h-full transform-gpu will-change-transform"
            style={{ x }}
          >
            {STEP_NUMBERS.map((num, index) => (
              <Chapter
                key={num}
                number={num}
                index={index}
                total={STEP_NUMBERS.length}
              />
            ))}
          </motion.div>

          <ChapterDots
            activeIndex={activeIndex}
            total={STEP_NUMBERS.length}
            onJump={jumpTo}
          />

          <ChapterCounter
            activeIndex={activeIndex}
            total={STEP_NUMBERS.length}
          />
        </div>
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
  const t = useTranslations("home.process")
  return (
    <div className="absolute right-0 bottom-8 left-0 z-20 flex justify-center sm:bottom-10">
      <div className="flex items-center gap-3">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onJump(i)}
            aria-label={t("jumpAria", { step: String(i + 1).padStart(2, "0") })}
            className={cn(
              "relative h-2 w-2 border border-foreground transition-all duration-300",
              i === activeIndex
                ? "scale-125 bg-foreground"
                : i < activeIndex
                  ? "bg-foreground"
                  : "bg-transparent hover:bg-foreground/30",
            )}
          />
        ))}
      </div>
    </div>
  )
}

/* ---------- Step counter (bottom right) ---------- */

function ChapterCounter({
  activeIndex,
  total,
}: {
  activeIndex: number
  total: number
}) {
  const t = useTranslations("home.process")
  return (
    <div className="pointer-events-none absolute right-6 bottom-8 z-20 flex items-center gap-4 sm:right-10 sm:bottom-10 lg:right-20">
      <span className="text-overline font-heading text-muted-foreground uppercase">
        {t("stepByStep")}
      </span>
      <span className="text-overline font-heading text-foreground tabular-nums uppercase">
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
  number,
  index,
  total,
}: {
  number: StepNumber
  index: number
  total: number
}) {
  const tStep = useTranslations(`processSteps.${number}`)
  const tArtifact = useTranslations(`processArtifacts.${number}`)
  const tProcess = useTranslations("home.process")
  const bullets = tArtifact.raw("bullets") as string[]
  const title = tStep("title")

  return (
    <article
      className="flex h-full w-screen shrink-0 items-center px-8 pt-24 pb-16 sm:px-16 sm:pt-28"
      aria-label={`${tProcess("stepByStep")} ${number}: ${title}`}
    >
      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-16 xl:gap-24">
        <div className="relative flex flex-col gap-4">
          <p className="text-process-number font-heading text-foreground tabular-nums">
            {number}
          </p>
          <div className="flex items-center gap-3">
            <span aria-hidden className="block h-px w-8 bg-foreground/60" />
            <p className="text-overline font-heading text-muted-foreground uppercase">
              {tProcess("stepOf", {
                current: String(index + 1).padStart(2, "0"),
                total: String(total).padStart(2, "0"),
              })}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-8 lg:max-w-xl">
          <div className="space-y-5">
            <h2 className="leading-process-title font-heading text-4xl text-foreground capitalize sm:text-5xl lg:text-6xl">
              {title}
            </h2>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              {tStep("copy")}
            </p>
          </div>

          <div className="max-w-md bg-card p-6 ring-1 ring-border">
            <p className="text-overline font-heading text-muted-foreground uppercase">
              {tArtifact("kicker")}
            </p>
            <h3 className="mt-2 font-heading text-xl leading-tight text-foreground capitalize sm:text-2xl">
              {tArtifact("title")}
            </h3>
            <div className="my-4 h-px bg-border" />
            <ul className="space-y-2">
              {bullets.map((bullet) => (
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
              <p className="text-overline font-heading text-muted-foreground uppercase">
                {tArtifact("meta")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

/* ---------- Mobile + reduced-motion fallback ---------- */

function VerticalFallback() {
  const t = useTranslations("home.process")
  return (
    <div className="border-t border-border">
      <div className="px-6 py-16 sm:px-12 sm:py-24">
        <p className="mb-6 text-xs font-medium text-muted-foreground uppercase">
          {t("eyebrow")}
        </p>
        <div className="max-w-3xl space-y-4">
          <h2 className="leading-section font-heading text-4xl text-foreground capitalize sm:text-5xl">
            {t("title")}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("subtitle")}
          </p>
        </div>
      </div>

      <div className="px-6 pb-8 sm:px-12">
        <p className="text-overline font-heading text-muted-foreground uppercase">
          {t("stepByStep")}
        </p>
      </div>

      <ol className="divide-y divide-border border-y border-border">
        {STEP_NUMBERS.map((num, index) => (
          <VerticalChapter
            key={num}
            number={num}
            index={index}
            total={STEP_NUMBERS.length}
          />
        ))}
      </ol>
    </div>
  )
}

function VerticalChapter({
  number,
  index,
  total,
}: {
  number: StepNumber
  index: number
  total: number
}) {
  const tStep = useTranslations(`processSteps.${number}`)
  const tArtifact = useTranslations(`processArtifacts.${number}`)
  const tProcess = useTranslations("home.process")
  const bullets = tArtifact.raw("bullets") as string[]

  return (
    <li className="px-6 py-10 sm:px-12 sm:py-14">
      <div className="process-fallback-grid grid gap-6 lg:gap-10">
        <div className="space-y-2">
          <p className="font-heading text-6xl leading-none text-foreground sm:text-7xl">
            {number}
          </p>
          <p className="text-overline font-heading text-muted-foreground uppercase">
            {tProcess("stepOf", {
              current: String(index + 1).padStart(2, "0"),
              total: String(total).padStart(2, "0"),
            })}
          </p>
        </div>
        <div className="space-y-5">
          <h2 className="leading-section font-heading text-3xl text-foreground capitalize sm:text-4xl">
            {tStep("title")}
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
            {tStep("copy")}
          </p>
          <div className="max-w-md bg-card p-5 ring-1 ring-border">
            <p className="text-overline font-heading text-muted-foreground uppercase">
              {tArtifact("kicker")}
            </p>
            <h3 className="mt-1 font-heading text-lg text-foreground capitalize">
              {tArtifact("title")}
            </h3>
            <ul className="mt-3 space-y-1.5">
              {bullets.map((bullet) => (
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
        </div>
      </div>
    </li>
  )
}
