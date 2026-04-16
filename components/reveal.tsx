"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"

const REVEAL_EASE = [0.22, 1, 0.36, 1] as const

type MotionDivProps = React.ComponentPropsWithoutRef<typeof motion.div>

type RevealProps = Omit<
  MotionDivProps,
  "animate" | "initial" | "transition" | "variants"
> & {
  delay?: number
  duration?: number
  x?: number
  y?: number
}

type RevealGroupProps = Omit<
  MotionDivProps,
  "animate" | "initial" | "transition" | "variants"
> & {
  delayChildren?: number
  stagger?: number
}

export function Reveal({
  children,
  className,
  delay = 0,
  duration = 0.55,
  viewport = { once: true, amount: 0.2 },
  x = 0,
  y = 24,
  ...props
}: RevealProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: shouldReduceMotion ? 0 : x,
        y: shouldReduceMotion ? 0 : y,
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
      }}
      viewport={viewport}
      transition={{
        duration: shouldReduceMotion ? 0.01 : duration,
        delay: shouldReduceMotion ? 0 : delay,
        ease: REVEAL_EASE,
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function RevealGroup({
  children,
  className,
  delayChildren = 0,
  stagger = 0.1,
  viewport = { once: true, amount: 0.16 },
  ...props
}: RevealGroupProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={{
        hidden: { opacity: 1 },
        visible: {
          opacity: 1,
          transition: {
            delayChildren: shouldReduceMotion ? 0 : delayChildren,
            staggerChildren: shouldReduceMotion ? 0 : stagger,
          },
        },
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function RevealItem({
  children,
  className,
  delay = 0,
  duration = 0.55,
  viewport = { once: true, amount: 0.2 },
  x = 0,
  y = 24,
  ...props
}: RevealProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      variants={{
        hidden: {
          opacity: 0,
          x: shouldReduceMotion ? 0 : x,
          y: shouldReduceMotion ? 0 : y,
        },
        visible: {
          opacity: 1,
          x: 0,
          y: 0,
          transition: {
            duration: shouldReduceMotion ? 0.01 : duration,
            delay: shouldReduceMotion ? 0 : delay,
            ease: REVEAL_EASE,
          },
        },
      }}
      viewport={viewport}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}
