"use client"

import { MapPin, Pencil, Phone, Plus, Sparkles } from "lucide-react"
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
  InputGroupButton,
  InputGroupInput,
  InputGroupTextarea,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { createLead, updateLead } from "@/app/(protected)/leads/actions"
import {
  SOURCE_LABEL,
  type ClientSource,
  type LeadKind,
  type LeadRow,
} from "@/components/leads/lead-types"
import { INDUSTRY_OPTIONS } from "@/lib/industries"

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

function instagramHandle(raw: string | null | undefined) {
  if (!raw) return ""
  const trimmed = raw.trim()
  const urlMatch = trimmed.match(
    /^@?(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9._]+)/i,
  )
  if (urlMatch) return urlMatch[1].slice(0, 30)
  const handleMatch = trimmed.match(/^@?([A-Za-z0-9._]+)$/)
  if (handleMatch) return handleMatch[1].slice(0, 30)
  return ""
}

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

type ControlledProps = {
  open: boolean
  onOpenChange: (next: boolean) => void
}

type Props =
  | ({ mode: "create"; defaultKind?: LeadKind } & Partial<ControlledProps>)
  | ({ mode: "edit"; lead: LeadRow; hideTrigger?: boolean } & Partial<ControlledProps>)

function LeadFormDialog(props: Props) {
  const isEdit = props.mode === "edit"
  const lead = isEdit ? props.lead : null
  const initialKind: LeadKind = isEdit
    ? props.lead.kind
    : (props.defaultKind ?? "lead")
  const hideTrigger = isEdit ? props.hideTrigger === true : false
  const formId = useId()

  const isControlled = props.open !== undefined
  const [internalOpen, setInternalOpen] = useState(false)
  const open = isControlled ? (props.open as boolean) : internalOpen
  const [error, setError] = useState<string | null>(null)
  const [phone, setPhone] = useState(() => phoneDigits(lead?.phone))
  const [igHandle, setIgHandle] = useState(() => instagramHandle(lead?.social_url))
  const [kind, setKind] = useState<LeadKind>(initialKind)
  const isProspect = kind === "prospect"
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  // Reset local state whenever the dialog opens (so edit picks up the latest lead).
  function handleOpenChange(next: boolean) {
    if (next) {
      setError(null)
      setPhone(phoneDigits(lead?.phone))
      setIgHandle(instagramHandle(lead?.social_url))
      setKind(initialKind)
    }
    if (isControlled) props.onOpenChange?.(next)
    else setInternalOpen(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {hideTrigger ? null : (
        <DialogTrigger
          render={
            isEdit ? (
              <Button variant="outline" size="sm" className="gap-2 capitalize">
                <Pencil aria-hidden /> Edit
              </Button>
            ) : (
              <Button className="gap-2 capitalize">
                <Plus aria-hidden />{" "}
                {initialKind === "prospect" ? "New prospect" : "New lead"}
              </Button>
            )
          }
        />
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? isProspect
                ? "Edit prospect"
                : "Edit lead"
              : isProspect
                ? "New prospect"
                : "New lead"}
          </DialogTitle>
        </DialogHeader>
        {isEdit ? null : (
          <Tabs
            value={kind}
            onValueChange={(v) => {
              if (v === "lead" || v === "prospect") setKind(v)
            }}
          >
            <TabsList className="w-full">
              <TabsTrigger value="lead" className="text-overline uppercase">
                Lead
              </TabsTrigger>
              <TabsTrigger value="prospect" className="text-overline uppercase">
                Prospect
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
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
                toast.success(
                  isEdit
                    ? isProspect
                      ? "Prospect updated"
                      : "Lead updated"
                    : isProspect
                      ? "Prospect created"
                      : "Lead created",
                )
                handleOpenChange(false)
                if (!isEdit) {
                  setPhone("")
                  setIgHandle("")
                }
                router.refresh()
              } else {
                setError(result.error)
              }
            })
          }}
        >
          <input type="hidden" name="kind" value={kind} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-name`}>Name</Label>
              <NameInput
                id={`${formId}-name`}
                name="name"
                placeholder="Leave blank if unknown"
                defaultValue={
                  lead?.name && lead.name !== "N/A" ? lead.name : ""
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-company`}>Business</Label>
              <BusinessInput
                id={`${formId}-company`}
                name="company"
                defaultValue={lead?.company ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-email`}>Email</Label>
              <EmailInput
                id={`${formId}-email`}
                name="email"
                placeholder="name@company.com"
                defaultValue={lead?.email ?? ""}
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
            {isProspect ? null : (
              <>
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
                        <SelectLabel>Source</SelectLabel>
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
                  <Select
                    name="budget"
                    defaultValue={lead?.budget ?? undefined}
                  >
                    <SelectTrigger
                      id={`${formId}-budget`}
                      className="w-full"
                    >
                      <SelectValue placeholder="Select a range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Budget range</SelectLabel>
                        {BUDGET_OPTIONS.map((value) => (
                          <SelectItem key={value} value={value}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor={`${formId}-industry`}>Industry</Label>
              <Select
                name="industry"
                defaultValue={lead?.industry ?? undefined}
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
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${formId}-address`}>Address</Label>
            <InputGroup>
              <InputGroupAddon>
                <MapPin aria-hidden />
              </InputGroupAddon>
              <InputGroupInput
                id={`${formId}-address`}
                name="address"
                autoComplete="street-address"
                placeholder="123 Main St, City, State ZIP"
                defaultValue={lead?.address ?? ""}
              />
            </InputGroup>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${formId}-social`}>Instagram</Label>
            <InputGroup>
              <InputGroupAddon>
                <span className="text-muted-foreground">instagram.com/</span>
              </InputGroupAddon>
              <InputGroupInput
                id={`${formId}-social`}
                name="social_url"
                inputMode="text"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="handle"
                maxLength={30}
                value={igHandle}
                onChange={(e) => setIgHandle(instagramHandle(e.target.value))}
              />
            </InputGroup>
          </div>
          {isProspect ? null : (
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-intent`}>Intent</Label>
              <InputGroup>
                <InputGroupTextarea
                  id={`${formId}-intent`}
                  name="intent"
                  rows={3}
                  placeholder="What are they trying to do?"
                  defaultValue={lead?.intent ?? ""}
                />
                {/* TODO: wire up AI-generated intent suggestion */}
                <InputGroupAddon align="block-end" className="justify-end">
                  <InputGroupButton size="icon-xs" aria-label="Suggest intent">
                    <Sparkles aria-hidden />
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${formId}-notes`}>Notes</Label>
            <Textarea
              id={`${formId}-notes`}
              name="notes"
              rows={3}
              placeholder="Internal notes: context, next steps, gotchas."
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
                : isProspect
                  ? "Create prospect"
                  : "Create lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function NewEntryDialog({
  defaultKind = "lead",
}: {
  defaultKind?: LeadKind
} = {}) {
  return <LeadFormDialog mode="create" defaultKind={defaultKind} />
}

export function EditLeadDialog({ lead }: { lead: LeadRow }) {
  return <LeadFormDialog mode="edit" lead={lead} />
}

export function ControlledEditLeadDialog({
  lead,
  open,
  onOpenChange,
}: {
  lead: LeadRow
  open: boolean
  onOpenChange: (next: boolean) => void
}) {
  return (
    <LeadFormDialog
      mode="edit"
      lead={lead}
      open={open}
      onOpenChange={onOpenChange}
      hideTrigger
    />
  )
}
