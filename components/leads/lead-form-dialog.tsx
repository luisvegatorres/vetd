"use client"

import { Pencil, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useId, useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createLead, updateLead } from "@/app/(protected)/leads/actions"
import {
  SOURCE_LABEL,
  type ClientSource,
  type LeadRow,
} from "@/components/leads/lead-types"

const SOURCE_OPTIONS = Object.entries(SOURCE_LABEL) as [
  keyof typeof SOURCE_LABEL,
  string,
][]

const BUDGET_OPTIONS = [
  "$1k–$2k",
  "$2k–$5k",
  "$5k–$10k",
  "$10k–$20k",
  "$20k+",
] as const

function formatPhone(digits: string) {
  const d = digits.slice(0, 10)
  if (d.length === 0) return ""
  if (d.length <= 3) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

function phoneDigits(v: string | null | undefined) {
  return (v ?? "").replace(/\D/g, "").slice(0, 10)
}

type Props =
  | { mode: "create" }
  | { mode: "edit"; lead: LeadRow }

function LeadFormDialog(props: Props) {
  const isEdit = props.mode === "edit"
  const lead = isEdit ? props.lead : null
  const formId = useId()

  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phone, setPhone] = useState(() => phoneDigits(lead?.phone))
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  // Reset local state whenever the dialog opens (so edit picks up the latest lead).
  function handleOpenChange(next: boolean) {
    if (next) {
      setError(null)
      setPhone(phoneDigits(lead?.phone))
    }
    setOpen(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button variant="outline" size="sm" className="gap-2 capitalize">
              <Pencil aria-hidden /> Edit
            </Button>
          ) : (
            <Button className="gap-2 capitalize">
              <Plus aria-hidden /> New lead
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit lead" : "New lead"}</DialogTitle>
        </DialogHeader>
        <form
          id={formId}
          className="flex flex-col gap-5"
          action={(formData) => {
            setError(null)
            startTransition(async () => {
              const result = isEdit
                ? await updateLead(lead!.id, formData)
                : await createLead(formData)
              if (result.ok) {
                toast.success(isEdit ? "Lead updated" : "Lead created")
                setOpen(false)
                if (!isEdit) setPhone("")
                router.refresh()
              } else {
                setError(result.error)
              }
            })
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-name`}>Name</Label>
              <Input
                id={`${formId}-name`}
                name="name"
                required
                autoCapitalize="words"
                className="capitalize"
                defaultValue={lead?.name ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-company`}>Company</Label>
              <Input
                id={`${formId}-company`}
                name="company"
                autoCapitalize="words"
                className="capitalize"
                defaultValue={lead?.company ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-email`}>Email</Label>
              <Input
                id={`${formId}-email`}
                name="email"
                type="email"
                defaultValue={lead?.email ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-phone`}>Phone</Label>
              <Input
                id={`${formId}-phone`}
                name="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="(555) 123-4567"
                maxLength={14}
                value={formatPhone(phone)}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-source`}>Source</Label>
              <Select
                name="source"
                defaultValue={lead?.source ?? "contact_form"}
              >
                <SelectTrigger
                  id={`${formId}-source`}
                  className="w-full"
                >
                  <SelectValue>
                    {(value) =>
                      value
                        ? (SOURCE_LABEL[value as ClientSource] ?? "")
                        : ""
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {SOURCE_OPTIONS.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-budget`}>Budget</Label>
              <Select name="budget" defaultValue={lead?.budget ?? undefined}>
                <SelectTrigger
                  id={`${formId}-budget`}
                  className="w-full"
                >
                  <SelectValue placeholder="Select a range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {BUDGET_OPTIONS.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${formId}-intent`}>Intent</Label>
            <Textarea
              id={`${formId}-intent`}
              name="intent"
              rows={3}
              placeholder="What are they trying to do?"
              defaultValue={lead?.intent ?? ""}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${formId}-notes`}>Notes</Label>
            <Textarea
              id={`${formId}-notes`}
              name="notes"
              rows={3}
              placeholder="Internal notes — context, next steps, gotchas."
              defaultValue={lead?.notes ?? ""}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </form>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button form={formId} type="submit" disabled={pending}>
            {pending
              ? isEdit
                ? "Saving…"
                : "Creating…"
              : isEdit
                ? "Save changes"
                : "Create lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function NewLeadDialog() {
  return <LeadFormDialog mode="create" />
}

export function EditLeadDialog({ lead }: { lead: LeadRow }) {
  return <LeadFormDialog mode="edit" lead={lead} />
}
