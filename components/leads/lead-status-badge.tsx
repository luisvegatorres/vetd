import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { LeadDerivedStatus } from "./lead-types"

const STATUS_LABEL: Record<LeadDerivedStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  archived: "Archived",
}

const STATUS_CLASS: Record<LeadDerivedStatus, string> = {
  new: "bg-primary/10 text-primary",
  contacted: "bg-foreground/10 text-foreground",
  qualified: "bg-emerald-500/10 text-emerald-500",
  archived: "bg-muted text-muted-foreground",
}

export function LeadStatusBadge({
  status,
  className,
}: {
  status: LeadDerivedStatus
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent uppercase tracking-ui",
        STATUS_CLASS[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </Badge>
  )
}
