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
  h1: "leading-hero text-4xl tracking-tight sm:text-5xl md:text-6xl lg:text-7xl",
  h2: "leading-section text-3xl tracking-tight sm:text-4xl md:text-5xl",
  h3: "leading-subheading text-2xl tracking-tight sm:text-3xl",
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
          "font-heading font-normal capitalize text-foreground",
          sizeMap[as],
          className
        )}
      >
        {es}
      </Tag>
      <p
        className={cn(
          "uppercase tracking-ui text-muted-foreground",
          enSizeMap[as],
          enClassName
        )}
      >
        {en}
      </p>
    </div>
  )
}
