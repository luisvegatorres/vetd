"use client"

import { Pencil, Plus, Sparkles } from "lucide-react"
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
import { DatePicker } from "@/components/ui/date-picker"
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
import { Switch } from "@/components/ui/switch"
import {
  createNewProject,
  updateProject,
} from "@/app/(protected)/projects/actions"
import { financing, websitePlans, type WebsitePlanId } from "@/lib/site"
import { PAYMENT_STATUS_LABEL, PROJECT_STAGE_LABEL } from "@/lib/status-colors"
import {
  PRODUCT_TYPE_LABEL,
  type PaymentStatus,
  type ProjectProductType,
  type ProjectRow,
  type ProjectStage,
} from "./project-types"

type Props =
  | {
      mode: "create"
      clients: { id: string; name: string; company: string | null }[]
      reps: { id: string; full_name: string | null }[]
      lockedClient?: { id: string; name: string; company: string | null }
    }
  | {
      mode: "edit"
      project: ProjectRow
      clients: { id: string; name: string; company: string | null }[]
      reps: { id: string; full_name: string | null }[]
    }

// `negotiation` is hidden from the form — reps only pick between the real
// three pipeline states. Legacy rows in that stage still render their label
// via PROJECT_STAGE_LABEL until they're resolved.
const STAGE_OPTIONS = (
  Object.entries(PROJECT_STAGE_LABEL) as [ProjectStage, string][]
).filter(([value]) => value !== "negotiation")

const PAYMENT_OPTIONS: [PaymentStatus, string][] = [
  ["unpaid", PAYMENT_STATUS_LABEL.unpaid],
  ["link_sent", PAYMENT_STATUS_LABEL.link_sent],
  ["paid", PAYMENT_STATUS_LABEL.paid],
  ["failed", PAYMENT_STATUS_LABEL.failed],
  ["refunded", PAYMENT_STATUS_LABEL.refunded],
]

const PRODUCT_OPTIONS = Object.entries(PRODUCT_TYPE_LABEL) as [
  ProjectProductType,
  string,
][]

function clientOptionLabel(c: {
  name: string
  company: string | null
}): string {
  return c.company ? `${c.company} — ${c.name}` : c.name
}

function detectPlanFromSubscription(
  sub: ProjectRow["subscription"] | undefined
): WebsitePlanId | "none" {
  if (!sub) return "none"
  const match = websitePlans.find(
    (p) => p.label.toLowerCase() === sub.plan.toLowerCase()
  )
  return match?.id ?? "custom"
}

function ProjectFormDialog(props: Props) {
  const isEdit = props.mode === "edit"
  const project = isEdit ? props.project : null
  const lockedClient =
    !isEdit && props.mode === "create" ? props.lockedClient : undefined
  const fixedClient = isEdit ? (project?.client ?? null) : (lockedClient ?? null)
  const formId = useId()

  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const [productType, setProductType] = useState<ProjectProductType | "">(
    project?.product_type ?? ""
  )
  const [valueStr, setValueStr] = useState<string>(
    project?.value != null ? String(project.value) : ""
  )
  const [financingEnabled, setFinancingEnabled] = useState<boolean>(
    project?.financing_enabled ?? false
  )
  const [planId, setPlanId] = useState<WebsitePlanId | "none">(
    detectPlanFromSubscription(project?.subscription ?? null)
  )
  const [customMonthlyRate, setCustomMonthlyRate] = useState<string>(
    project?.subscription &&
      detectPlanFromSubscription(project.subscription) === "custom"
      ? String(project.subscription.monthly_rate)
      : ""
  )
  function handleOpenChange(next: boolean) {
    if (next) {
      setError(null)
      setProductType(project?.product_type ?? "")
      setValueStr(project?.value != null ? String(project.value) : "")
      setFinancingEnabled(project?.financing_enabled ?? false)
      setPlanId(detectPlanFromSubscription(project?.subscription ?? null))
      setCustomMonthlyRate(
        project?.subscription &&
          detectPlanFromSubscription(project.subscription) === "custom"
          ? String(project.subscription.monthly_rate)
          : ""
      )
    }
    setOpen(next)
  }

  const clientMap = new Map(props.clients.map((c) => [c.id, c]))

  const numericValue = Number(valueStr)
  const isWebsite = productType === "business_website"
  const valueEligibleForFinancing =
    !isWebsite &&
    Number.isFinite(numericValue) &&
    numericValue >= financing.minAmount

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
              <Plus aria-hidden /> New project
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit project" : "New project"}</DialogTitle>
        </DialogHeader>
        <form
          id={formId}
          className="-mx-6 flex max-h-[65vh] flex-col gap-5 overflow-y-auto px-6 py-1"
          action={(formData) => {
            setError(null)
            startTransition(async () => {
              const result = isEdit
                ? await updateProject(project!.id, formData)
                : await createNewProject(formData)
              if (result.ok) {
                toast.success(isEdit ? "Project updated" : "Project created")
                setOpen(false)
                router.refresh()
              } else {
                setError(result.error)
              }
            })
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor={`${formId}-title`}>Title</Label>
              <InputGroup>
                <InputGroupInput
                  id={`${formId}-title`}
                  name="title"
                  required
                  placeholder="Project name"
                  defaultValue={project?.title ?? ""}
                />
                {/* TODO: wire up AI-generated title suggestion */}
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-xs"
                    aria-label="Suggest title"
                  >
                    <Sparkles aria-hidden />
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor={`${formId}-client`}>Client</Label>
              {fixedClient ? (
                <>
                  <input
                    type="hidden"
                    name="client_id"
                    value={fixedClient.id}
                  />
                  <div
                    id={`${formId}-client`}
                    className="flex h-9 items-center border border-input bg-muted px-3 text-sm text-muted-foreground"
                    aria-readonly="true"
                  >
                    {clientOptionLabel(fixedClient)}
                  </div>
                </>
              ) : (
                <Select
                  name="client_id"
                  defaultValue={project?.client?.id ?? undefined}
                >
                  <SelectTrigger id={`${formId}-client`} className="w-full">
                    <SelectValue placeholder="Select a client">
                      {(value) => {
                        if (!value) return ""
                        const c = clientMap.get(value)
                        return c ? clientOptionLabel(c) : ""
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Client</SelectLabel>
                      {props.clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {clientOptionLabel(c)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-product`}>Product type</Label>
              <Select
                name="product_type"
                value={productType}
                onValueChange={(v) => {
                  setProductType(v as ProjectProductType)
                  if (v !== "business_website") setPlanId("none")
                }}
              >
                <SelectTrigger id={`${formId}-product`} className="w-full">
                  <SelectValue placeholder="Select a product">
                    {(value) =>
                      value
                        ? (PRODUCT_TYPE_LABEL[value as ProjectProductType] ??
                          "")
                        : ""
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Product</SelectLabel>
                    {PRODUCT_OPTIONS.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-stage`}>Stage</Label>
              <Select name="stage" defaultValue={project?.stage ?? "proposal"}>
                <SelectTrigger id={`${formId}-stage`} className="w-full">
                  <SelectValue>
                    {(value) =>
                      value
                        ? (PROJECT_STAGE_LABEL[value as ProjectStage] ?? "")
                        : ""
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Stage</SelectLabel>
                    {STAGE_OPTIONS.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-value`}>One-time value</Label>
              <InputGroup>
                <InputGroupAddon>$</InputGroupAddon>
                <InputGroupInput
                  id={`${formId}-value`}
                  name="value"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={valueStr}
                  disabled={isWebsite}
                  onChange={(e) => {
                    setValueStr(e.target.value)
                    const n = Number(e.target.value)
                    if (
                      financingEnabled &&
                      (!Number.isFinite(n) || n < financing.minAmount)
                    ) {
                      setFinancingEnabled(false)
                    }
                  }}
                />
              </InputGroup>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-deposit-rate`}>Deposit %</Label>
              <InputGroup>
                <InputGroupInput
                  id={`${formId}-deposit-rate`}
                  name="deposit_rate"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="100"
                  step="1"
                  placeholder="30"
                  defaultValue={project?.deposit_rate ?? 30}
                  disabled={isWebsite}
                />
                <InputGroupAddon align="inline-end">%</InputGroupAddon>
              </InputGroup>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-payment`}>One-time payment</Label>
              <Select
                name="payment_status"
                defaultValue={project?.payment_status ?? "unpaid"}
                disabled={isWebsite}
              >
                <SelectTrigger id={`${formId}-payment`} className="w-full">
                  <SelectValue>
                    {(value) =>
                      value
                        ? ((PAYMENT_STATUS_LABEL as Record<string, string>)[
                            value
                          ] ?? "")
                        : ""
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>One-time payment</SelectLabel>
                    {PAYMENT_OPTIONS.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-rep`}>Rep</Label>
              <Select
                name="sold_by"
                defaultValue={project?.rep?.id ?? undefined}
              >
                <SelectTrigger id={`${formId}-rep`} className="w-full">
                  <SelectValue placeholder="Unassigned">
                    {(value) => {
                      if (!value) return ""
                      const r = props.reps.find((x) => x.id === value)
                      return r?.full_name ?? "Unassigned"
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Rep</SelectLabel>
                    {props.reps.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.full_name ?? "Unnamed rep"}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-start`}>Start date</Label>
              <DatePicker
                id={`${formId}-start`}
                name="start_date"
                defaultValue={project?.start_date ?? ""}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-deadline`}>Deadline</Label>
              <DatePicker
                id={`${formId}-deadline`}
                name="deadline"
                defaultValue={project?.deadline ?? ""}
              />
            </div>
          </div>

          {valueEligibleForFinancing ? (
            <div className="flex items-center justify-between gap-4 border border-border/60 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">Offer financing</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {financing.depositRate}% down, 70% over {financing.months}{" "}
                  months at {financing.financingFeeRate}%.
                </p>
              </div>
              <Switch
                name="financing_enabled"
                checked={financingEnabled}
                onCheckedChange={setFinancingEnabled}
                aria-label="Offer financing"
              />
            </div>
          ) : (
            <input
              type="hidden"
              name="financing_enabled"
              value={financingEnabled ? "on" : ""}
            />
          )}

          {isWebsite ? (
            <div className="flex flex-col gap-3 border border-border/60 p-4">
              <div>
                <p className="text-sm font-medium">Recurring plan</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Websites commonly ship with an ongoing monthly plan. Leave as
                  None for one-time only.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div
                  className={`flex flex-col gap-2 ${planId === "custom" ? "" : "sm:col-span-2"}`}
                >
                  <Label htmlFor={`${formId}-plan`}>Plan</Label>
                  <Select
                    name="website_plan"
                    value={planId}
                    onValueChange={(v) =>
                      setPlanId(v as WebsitePlanId | "none")
                    }
                  >
                    <SelectTrigger id={`${formId}-plan`} className="w-full">
                      <SelectValue>
                        {(value) => {
                          if (!value || value === "none") return "None"
                          const p = websitePlans.find((x) => x.id === value)
                          return p?.label ?? "None"
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Plan</SelectLabel>
                        <SelectItem value="none">None</SelectItem>
                        {websitePlans.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.label}
                            {p.monthlyRate != null
                              ? ` — $${p.monthlyRate}/mo`
                              : ""}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                {planId === "custom" ? (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`${formId}-custom-rate`}>
                      Monthly rate
                    </Label>
                    <InputGroup>
                      <InputGroupAddon>$</InputGroupAddon>
                      <InputGroupInput
                        id={`${formId}-custom-rate`}
                        name="website_plan_rate"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={customMonthlyRate}
                        onChange={(e) => setCustomMonthlyRate(e.target.value)}
                      />
                      <InputGroupAddon align="inline-end">/mo</InputGroupAddon>
                    </InputGroup>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor={`${formId}-description`}>Description</Label>
            <InputGroup>
              <InputGroupTextarea
                id={`${formId}-description`}
                name="description"
                rows={3}
                placeholder="Scope, deliverables, internal notes."
                defaultValue={project?.description ?? ""}
              />
              {/* TODO: wire up AI-generated description suggestion */}
              <InputGroupAddon align="block-end" className="justify-end">
                <InputGroupButton size="icon-xs" aria-label="Suggest description">
                  <Sparkles aria-hidden />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </form>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button form={formId} type="submit" disabled={pending}>
            {pending
              ? isEdit
                ? "Saving…"
                : "Creating…"
              : isEdit
                ? "Save changes"
                : "Create project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function NewProjectDialog({
  clients,
  reps,
  lockedClient,
}: {
  clients: { id: string; name: string; company: string | null }[]
  reps: { id: string; full_name: string | null }[]
  lockedClient?: { id: string; name: string; company: string | null }
}) {
  return (
    <ProjectFormDialog
      mode="create"
      clients={clients}
      reps={reps}
      lockedClient={lockedClient}
    />
  )
}

export function EditProjectDialog({
  project,
  clients,
  reps,
}: {
  project: ProjectRow
  clients: { id: string; name: string; company: string | null }[]
  reps: { id: string; full_name: string | null }[]
}) {
  return (
    <ProjectFormDialog
      mode="edit"
      project={project}
      clients={clients}
      reps={reps}
    />
  )
}
