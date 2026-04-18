import { cn } from "@/lib/utils"

/**
 * Inline separator square used between inline metadata items
 * (e.g. "Contact form · 2h" → "Contact form ▪ 2h").
 */
export function Dot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-1 shrink-0 bg-border", className)}
    />
  )
}
