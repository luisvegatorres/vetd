import * as React from "react"

import { cn } from "@/lib/utils"

type SectionProps = React.HTMLAttributes<HTMLElement> & {
  eyebrow?: string
  bleed?: boolean
  size?: "sm" | "md" | "lg"
}

const sizeMap = {
  sm: "py-12 sm:py-16",
  md: "py-16 sm:py-24",
  lg: "py-20 sm:py-32",
} as const

export function Section({
  className,
  children,
  eyebrow,
  bleed = false,
  size = "md",
  ...props
}: SectionProps) {
  return (
    <section
      className={cn("w-full border-b border-border/60", sizeMap[size], className)}
      {...props}
    >
      <div
        className={cn(
          bleed ? "w-full" : "mx-auto w-full max-w-6xl px-6 sm:px-8"
        )}
      >
        {eyebrow ? (
          <p className="mb-6 text-xs font-medium tracking-[0.2em] text-primary uppercase">
            {eyebrow}
          </p>
        ) : null}
        {children}
      </div>
    </section>
  )
}
