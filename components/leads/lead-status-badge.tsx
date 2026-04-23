import { Badge } from "@/components/ui/badge"
import { leadStatusTone, type LeadBadgeStatus } from "@/lib/status-colors"
import { cn } from "@/lib/utils"

export function LeadStatusBadge({
  status,
  className,
}: {
  status: LeadBadgeStatus
  className?: string
}) {
  const tone = leadStatusTone(status)
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent uppercase",
        tone.badge,
        className,
      )}
    >
      {tone.label}
    </Badge>
  )
}
