import { cn } from "@/lib/utils"
import type { ClientOwner } from "./client-types"

export function OwnerChip({
  owner,
  className,
}: {
  owner: ClientOwner | null
  className?: string
}) {
  if (!owner || !owner.full_name) {
    return (
      <span
        aria-label="Unassigned"
        className={cn("text-sm text-muted-foreground", className)}
      >
        —
      </span>
    )
  }
  return (
    <span className={cn("truncate text-sm", className)}>
      {owner.full_name}
    </span>
  )
}
