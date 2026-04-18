"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function LeadNotesDialog({ notes }: { notes: string | null }) {
  return (
    <div className="space-y-2">
      <p className="text-overline font-medium uppercase tracking-ui text-muted-foreground">
        Notes
      </p>
      {notes ? (
        <Dialog>
          <DialogTrigger
            render={
              <Button variant="link" className="h-auto px-0 py-0">
                View notes
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Notes</DialogTitle>
            </DialogHeader>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {notes}
            </p>
          </DialogContent>
        </Dialog>
      ) : (
        <p className="text-sm text-muted-foreground">No notes yet</p>
      )}
    </div>
  )
}
