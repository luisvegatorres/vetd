import { Badge } from "@/components/ui/badge"
import { leadStatusTone } from "@/lib/status-colors"
import { cn } from "@/lib/utils"
import type { LeadDerivedStatus } from "./lead-types"

export function LeadStatusBadge({
  status,
  className,
}: {
  status: LeadDerivedStatus
  className?: string
}) {
  const tone = leadStatusTone(status)
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent uppercase tracking-ui",
        tone.badge,
        className,
      )}
    >
      {tone.label}
    </Badge>
  )
}
