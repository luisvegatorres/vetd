"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function LeadIntentCell({
  intent,
  leadName,
}: {
  intent: string | null
  leadName: string
}) {
  if (!intent) {
    return <p className="truncate text-sm">—</p>
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="link"
            size="sm"
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            See more
          </Button>
        }
      />
      <DialogContent
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>Intent</DialogTitle>
          <DialogDescription>{leadName}</DialogDescription>
        </DialogHeader>
        <p className="text-sm whitespace-pre-wrap text-foreground">{intent}</p>
      </DialogContent>
    </Dialog>
  )
}
