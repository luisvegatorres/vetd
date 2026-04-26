"use client"

import { motion, useReducedMotion } from "motion/react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const REVEAL_EASE = [0.22, 1, 0.36, 1] as const

export interface AboutValueTileProps {
  icon: LucideIcon
  title: string
  copy: string
  className?: string
}

export function AboutValueTile({
  icon: Icon,
  title,
  copy,
  className,
}: AboutValueTileProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      variants={{
        hidden: {
          opacity: 0,
          y: shouldReduceMotion ? 0 : 22,
        },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: shouldReduceMotion ? 0.01 : 0.55,
            ease: REVEAL_EASE,
          },
        },
      }}
      className={cn(
        "relative flex h-full flex-col gap-5 bg-background px-6 py-10 sm:px-10 sm:py-12 lg:px-20 lg:py-14",
        "border-b border-r border-border/60",
        "transition-[colors,transform] duration-300 ease-out hover:-translate-y-0.5 hover:bg-muted/50 motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      <Icon
        className="size-8 text-foreground"
        strokeWidth={1.25}
        aria-hidden
      />
      <h4 className="font-heading text-lg leading-subheading text-foreground capitalize sm:text-xl">
        {title}
      </h4>
      <p className="max-w-[32ch] text-sm leading-relaxed text-muted-foreground">
        {copy}
      </p>
    </motion.div>
  )
}
