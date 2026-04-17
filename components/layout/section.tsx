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
          bleed ? "w-full" : "w-full px-6 sm:px-10 lg:px-20"
        )}
      >
        {eyebrow ? (
          <p className="mb-6 text-xs font-medium tracking-section text-muted-foreground uppercase">
            {eyebrow}
          </p>
        ) : null}
        {children}
      </div>
    </section>
  )
}
