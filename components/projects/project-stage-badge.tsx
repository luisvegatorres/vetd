import { Badge } from "@/components/ui/badge"
import { projectStageTone } from "@/lib/status-colors"
import { cn } from "@/lib/utils"
import type { ProjectStage } from "./project-types"

export function ProjectStageBadge({
  stage,
  className,
}: {
  stage: ProjectStage
  className?: string
}) {
  const tone = projectStageTone(stage)
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent uppercase", tone.badge, className)}
    >
      {tone.label}
    </Badge>
  )
}
