"use client"

import { useTransition } from "react"
import { toast } from "sonner"

import { Switch } from "@/components/ui/switch"
import { setEmploymentStatus } from "./actions"

export function EmploymentToggle({
  profileId,
  status,
  isSelf,
}: {
  profileId: string
  status: "active" | "terminated"
  isSelf: boolean
}) {
  const [isPending, startTransition] = useTransition()

  function handleChange(next: boolean) {
    const newStatus = next ? "active" : "terminated"
    if (newStatus === status) return
    startTransition(async () => {
      const result = await setEmploymentStatus(profileId, newStatus)
      if (result.ok) {
        toast.success(
          newStatus === "terminated"
            ? "Marked as terminated — residuals stopped"
            : "Marked as active — residuals will resume on next billing cycle",
        )
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="flex items-center gap-3">
      <Switch
        checked={status === "active"}
        onCheckedChange={handleChange}
        disabled={isPending || isSelf}
      />
      <span className="text-xs uppercase text-muted-foreground">
        {status === "active" ? "Active" : "Terminated"}
      </span>
    </div>
  )
}
