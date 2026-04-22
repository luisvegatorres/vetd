"use client"

import { Archive, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { archiveLead, deleteLead } from "@/app/(protected)/leads/actions"
import { ControlledEditLeadDialog } from "./lead-form-dialog"
import type { LeadRow } from "./lead-types"

export function LeadActionsPopover({ lead }: { lead: LeadRow }) {
  const router = useRouter()
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function closePopoverAnd(open: (v: boolean) => void) {
    setPopoverOpen(false)
    open(true)
  }

  function handleArchive() {
    startTransition(async () => {
      const result = await archiveLead(lead.id)
      if (result.ok) {
        toast.success("Lead archived")
        setArchiveOpen(false)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteLead(lead.id)
      if (result.ok) {
        toast.success("Lead removed")
        setDeleteOpen(false)
        router.push("/leads")
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="secondary"
              size="icon-sm"
              aria-label="Lead actions"
            >
              <MoreHorizontal aria-hidden />
            </Button>
          }
        />
        <PopoverContent align="end" className="w-48 gap-1 p-1">
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-2 capitalize"
            onClick={() => closePopoverAnd(setEditOpen)}
          >
            <Pencil aria-hidden /> Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-2 capitalize"
            onClick={() => closePopoverAnd(setArchiveOpen)}
          >
            <Archive aria-hidden /> Archive
          </Button>
          <Separator className="my-1" />
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-2 capitalize text-destructive hover:text-destructive"
            onClick={() => closePopoverAnd(setDeleteOpen)}
          >
            <Trash2 aria-hidden /> Remove
          </Button>
        </PopoverContent>
      </Popover>

      <ControlledEditLeadDialog
        lead={lead}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Archive this lead?</DialogTitle>
            <DialogDescription>
              {lead.name} moves to the Archived tab. You can still view the
              record and undo this later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button onClick={handleArchive} disabled={pending}>
              {pending ? "Archiving…" : "Archive lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove this lead?</DialogTitle>
            <DialogDescription>
              {lead.name} will be permanently deleted. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={pending}
            >
              {pending ? "Removing…" : "Remove lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
