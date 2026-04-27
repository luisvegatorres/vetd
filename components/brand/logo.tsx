import * as React from "react"

import { cn } from "@/lib/utils"

const MARK_PATH =
  "M0 200L0 133.333L66.667 133.333L66.667 66.667L133.333 66.667L133.333 0L200 0L200 200L0 200Z"

type LogoProps = React.SVGProps<SVGSVGElement> & {
  size?: number
}

export function Logo({ size = 24, className, ...props }: LogoProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0", className)}
      {...props}
    >
      <path d={MARK_PATH} />
    </svg>
  )
}

type LogotypeProps = Omit<React.SVGProps<SVGSVGElement>, "height" | "width"> & {
  height?: number
}

export function Logotype({
  height = 24,
  className,
  ...props
}: LogotypeProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={height}
      height={height}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0", className)}
      {...props}
    >
      <path d={MARK_PATH} />
    </svg>
  )
}
