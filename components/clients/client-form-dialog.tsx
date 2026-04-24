"use client"

import { MapPin, Pencil, Phone, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useId, useState, useTransition } from "react"
import { toast } from "sonner"

import { BusinessInput } from "@/components/forms/business-input"
import { EmailInput } from "@/components/forms/email-input"
import { NameInput } from "@/components/forms/name-input"
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createNewClient, updateClient } from "@/app/(protected)/clients/actions"
import { INDUSTRY_OPTIONS } from "@/lib/industries"
import type { ClientRow, ClientStatus } from "./client-types"

const STATUS_LABEL: Record<ClientStatus, string> = {
  lead: "Lead",
  qualified: "Qualified",
  active_client: "Active client",
  archived: "Archived",
  lost: "Lost",
}

const STATUS_OPTIONS = Object.entries(STATUS_LABEL) as [
  ClientStatus,
  string,
][]

const UNASSIGNED_VALUE = "__unassigned__"

export type RepOption = { id: string; full_name: string | null }

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
  | { mode: "create"; reps?: RepOption[]; canReassign?: boolean }
  | {
      mode: "edit"
      client: ClientRow
      reps?: RepOption[]
      canReassign?: boolean
    }

function ClientFormDialog(props: Props) {
  const isEdit = props.mode === "edit"
  const client = isEdit ? props.client : null
  const reps = props.reps ?? []
  const canReassign = Boolean(props.canReassign && reps.length > 0)
  const formId = useId()

  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phone, setPhone] = useState(() => phoneDigits(client?.phone))
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleOpenChange(next: boolean) {
    if (next) {
      setError(null)
      setPhone(phoneDigits(client?.phone))
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
              <Plus aria-hidden /> New client
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit client" : "New client"}</DialogTitle>
        </DialogHeader>
        <form
          id={formId}
          className="flex flex-col gap-5"
          action={(formData) => {
            setError(null)
            startTransition(async () => {
              const result = isEdit
                ? await updateClient(client!.id, formData)
                : await createNewClient(formData)
              if (result.ok) {
                toast.success(isEdit ? "Client updated" : "Client created")
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
              <Label htmlFor={`${formId}-name`}>Primary contact</Label>
              <NameInput
                id={`${formId}-name`}
                name="name"
                required
                defaultValue={client?.name ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-company`}>Business</Label>
              <BusinessInput
                id={`${formId}-company`}
                name="company"
                defaultValue={client?.company ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-email`}>Email</Label>
              <EmailInput
                id={`${formId}-email`}
                name="email"
                placeholder="name@company.com"
                defaultValue={client?.email ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-phone`}>Phone</Label>
              <InputGroup>
                <InputGroupAddon>
                  <Phone aria-hidden />
                </InputGroupAddon>
                <InputGroupInput
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
              </InputGroup>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-industry`}>Industry</Label>
              <Select
                name="industry"
                defaultValue={client?.industry ?? undefined}
              >
                <SelectTrigger id={`${formId}-industry`} className="w-full">
                  <SelectValue placeholder="Select an industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Industry</SelectLabel>
                    {INDUSTRY_OPTIONS.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-location`}>Location</Label>
              <InputGroup>
                <InputGroupAddon>
                  <MapPin aria-hidden />
                </InputGroupAddon>
                <InputGroupInput
                  id={`${formId}-location`}
                  name="location"
                  autoCapitalize="words"
                  className="capitalize"
                  placeholder="City, State"
                  defaultValue={client?.location ?? ""}
                />
              </InputGroup>
            </div>
            {canReassign ? (
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor={`${formId}-assigned-to`}>Rep</Label>
                <Select
                  name="assigned_to"
                  defaultValue={client?.owner?.id ?? UNASSIGNED_VALUE}
                >
                  <SelectTrigger
                    id={`${formId}-assigned-to`}
                    className="w-full"
                  >
                    <SelectValue>
                      {(value) => {
                        if (!value || value === UNASSIGNED_VALUE) {
                          return "Unassigned"
                        }
                        const rep = reps.find((r) => r.id === value)
                        return rep?.full_name ?? "Unassigned"
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Rep</SelectLabel>
                      <SelectItem value={UNASSIGNED_VALUE}>
                        Unassigned
                      </SelectItem>
                      {reps.map((rep) => (
                        <SelectItem key={rep.id} value={rep.id}>
                          {rep.full_name ?? "Unnamed"}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor={`${formId}-status`}>Status</Label>
              <Select
                name="status"
                defaultValue={client?.status ?? "active_client"}
              >
                <SelectTrigger id={`${formId}-status`} className="w-full">
                  <SelectValue>
                    {(value) =>
                      value ? (STATUS_LABEL[value as ClientStatus] ?? "") : ""
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Status</SelectLabel>
                    {STATUS_OPTIONS.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${formId}-notes`}>Notes</Label>
            <Textarea
              id={`${formId}-notes`}
              name="notes"
              rows={3}
              placeholder="Internal notes: context, history, gotchas."
              defaultValue={client?.notes ?? ""}
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
                : "Create client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function NewClientDialog({
  reps,
  canReassign,
}: {
  reps?: RepOption[]
  canReassign?: boolean
} = {}) {
  return (
    <ClientFormDialog mode="create" reps={reps} canReassign={canReassign} />
  )
}

export function EditClientDialog({
  client,
  reps,
  canReassign,
}: {
  client: ClientRow
  reps?: RepOption[]
  canReassign?: boolean
}) {
  return (
    <ClientFormDialog
      mode="edit"
      client={client}
      reps={reps}
      canReassign={canReassign}
    />
  )
}
