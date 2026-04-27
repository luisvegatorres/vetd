"use client"

import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"

const TYPING_INTERVAL_MS = 90
const DELETING_INTERVAL_MS = 45
const HOLD_AFTER_TYPED_MS = 1600
const PAUSE_BEFORE_NEXT_MS = 280

type Phase = "typing" | "holding" | "deleting" | "between"

type Props = {
  words: readonly string[]
  className?: string
  cursorClassName?: string
}

export function TypewriterCycle({ words, className, cursorClassName }: Props) {
  const reduceMotion = useReducedMotion()
  // Render the first word fully on SSR / initial client render so the heading
  // is meaningful before the cycle effect kicks in (and so there's no
  // hydration mismatch).
  const [index, setIndex] = useState(0)
  const [displayed, setDisplayed] = useState(words[0] ?? "")
  const [phase, setPhase] = useState<Phase>("holding")

  useEffect(() => {
    if (reduceMotion || words.length <= 1) return
    const word = words[index] ?? ""
    const delay =
      phase === "typing"
        ? displayed.length < word.length
          ? TYPING_INTERVAL_MS
          : 0
        : phase === "holding"
          ? HOLD_AFTER_TYPED_MS
          : phase === "deleting"
            ? displayed.length > 0
              ? DELETING_INTERVAL_MS
              : 0
            : PAUSE_BEFORE_NEXT_MS
    const timer = setTimeout(() => {
      if (phase === "typing") {
        if (displayed.length < word.length) {
          setDisplayed(word.slice(0, displayed.length + 1))
        } else {
          setPhase("holding")
        }
      } else if (phase === "holding") {
        setPhase("deleting")
      } else if (phase === "deleting") {
        if (displayed.length > 0) {
          setDisplayed(displayed.slice(0, -1))
        } else {
          setPhase("between")
        }
      } else {
        setIndex((current) => (current + 1) % words.length)
        setPhase("typing")
      }
    }, delay)
    return () => clearTimeout(timer)
  }, [phase, displayed, index, words, reduceMotion])

  return (
    <span className={cn("inline-flex items-baseline", className)}>
      <span aria-live="polite">{displayed}</span>
      {!reduceMotion && (
        <motion.span
          aria-hidden
          className={cn(
            "ml-[0.06em] inline-block h-[0.78em] w-[0.06em] translate-y-[0.04em] bg-foreground",
            cursorClassName,
          )}
          animate={{ opacity: [1, 1, 0, 0] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            times: [0, 0.5, 0.5, 1],
            ease: "linear",
          }}
        />
      )}
    </span>
  )
}
