import * as React from "react"

import { cn } from "@/lib/utils"

type Level = "h1" | "h2" | "h3"

type BilingualHeadingProps = {
  es: React.ReactNode
  en: React.ReactNode
  as?: Level
  align?: "left" | "center"
  className?: string
  enClassName?: string
}

const sizeMap: Record<Level, string> = {
  h1: "text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[0.95] tracking-tight",
  h2: "text-3xl sm:text-4xl md:text-5xl leading-[1.05] tracking-tight",
  h3: "text-2xl sm:text-3xl leading-[1.15] tracking-tight",
}

const enSizeMap: Record<Level, string> = {
  h1: "text-base sm:text-lg",
  h2: "text-sm sm:text-base",
  h3: "text-xs sm:text-sm",
}

export function BilingualHeading({
  es,
  en,
  as = "h2",
  align = "left",
  className,
  enClassName,
}: BilingualHeadingProps) {
  const Tag = as
  return (
    <div className={cn(align === "center" && "text-center", "space-y-2")}>
      <Tag
        className={cn(
          "font-heading font-normal uppercase text-foreground",
          sizeMap[as],
          className
        )}
      >
        {es}
      </Tag>
      <p
        className={cn(
          "uppercase tracking-[0.18em] text-muted-foreground",
          enSizeMap[as],
          enClassName
        )}
      >
        {en}
      </p>
    </div>
  )
}
