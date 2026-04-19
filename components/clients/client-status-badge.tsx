import { Badge } from "@/components/ui/badge"
import { clientDirectoryStatusTone } from "@/lib/status-colors"
import { cn } from "@/lib/utils"
import type { ClientDerivedStatus } from "./client-types"

export function ClientStatusBadge({
  status,
  className,
}: {
  status: ClientDerivedStatus
  className?: string
}) {
  const tone = clientDirectoryStatusTone(status)
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
