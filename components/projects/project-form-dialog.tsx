"use client"

import { Pencil, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"
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
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  createNewProject,
  updateProject,
} from "@/app/(protected)/projects/actions"
import {
  financing,
  subscriptionPlans,
  websitePlans,
  type WebsitePlanId,
} from "@/lib/site"

const CUSTOM_PLAN_FLAT_COMMISSION = 150

function bundledSigningBonus(planId: WebsitePlanId | "none"): number {
  if (planId === "presence") return subscriptionPlans.presence.signingBonus
  if (planId === "growth") return subscriptionPlans.growth.signingBonus
  return CUSTOM_PLAN_FLAT_COMMISSION
}
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
  const [commissionMode, setCommissionMode] = useState<"rate" | "flat">(
    project?.commission_flat != null ? "flat" : "rate"
  )
  const [commissionRateStr, setCommissionRateStr] = useState<string>(
    project?.commission_rate != null ? String(project.commission_rate) : ""
  )
  const [commissionFlatStr, setCommissionFlatStr] = useState<string>(
    project?.commission_flat != null ? String(project.commission_flat) : ""
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
      setCommissionMode(project?.commission_flat != null ? "flat" : "rate")
      setCommissionRateStr(
        project?.commission_rate != null ? String(project.commission_rate) : ""
      )
      setCommissionFlatStr(
        project?.commission_flat != null ? String(project.commission_flat) : ""
      )
    }
    setOpen(next)
  }

  const clientMap = new Map(props.clients.map((c) => [c.id, c]))

  const numericValue = Number(valueStr)
  const valueEligibleForFinancing =
    Number.isFinite(numericValue) && numericValue >= financing.minAmount
  const isWebsite = productType === "business_website"
  const valueIsZero = valueStr === "" || numericValue === 0
  const websiteBundledRecurring = isWebsite && planId !== "none" && valueIsZero

  // Bundled website + recurring plan at $0 value: pre-fill the rep's flat
  // commission with the selected plan's signing bonus ($100 / $250 / $150
  // fallback for Custom). Rep can still override or switch back to rate mode.
  const bundledBonus = bundledSigningBonus(planId)
  // Adjust state during render on transitions (enter bundled mode or change
  // plan while bundled) instead of in an effect. Re-renders bail out when the
  // "flat" mode and prefilled value are already applied, so this is a no-op
  // in the steady state. See https://react.dev/learn/you-might-not-need-an-effect#adjusting-state-based-on-other-state
  const bundledPlanKey = websiteBundledRecurring ? planId : null
  const [prevBundledPlanKey, setPrevBundledPlanKey] =
    React.useState(bundledPlanKey)
  if (prevBundledPlanKey !== bundledPlanKey) {
    setPrevBundledPlanKey(bundledPlanKey)
    if (bundledPlanKey !== null) {
      setCommissionMode("flat")
      setCommissionFlatStr((prev) => (prev ? prev : String(bundledBonus)))
    }
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
          className="-mx-6 flex max-h-[65vh] flex-col gap-5 overflow-y-auto px-6"
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
              <Input
                id={`${formId}-title`}
                name="title"
                required
                placeholder="Project name"
                defaultValue={project?.title ?? ""}
              />
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
                />
                <InputGroupAddon align="inline-end">%</InputGroupAddon>
              </InputGroup>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-commission`}>Commission</Label>
              {commissionMode === "rate" ? (
                <InputGroup>
                  <InputGroupInput
                    id={`${formId}-commission`}
                    name="commission_rate"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="100"
                    step="1"
                    placeholder="30"
                    value={commissionRateStr}
                    onChange={(e) => setCommissionRateStr(e.target.value)}
                  />
                  <InputGroupAddon align="inline-end">%</InputGroupAddon>
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton onClick={() => setCommissionMode("flat")}>
                      Use $
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              ) : (
                <InputGroup>
                  <InputGroupAddon>$</InputGroupAddon>
                  <InputGroupInput
                    id={`${formId}-commission`}
                    name="commission_flat"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder={String(bundledBonus)}
                    value={commissionFlatStr}
                    onChange={(e) => setCommissionFlatStr(e.target.value)}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton onClick={() => setCommissionMode("rate")}>
                      Use %
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-payment`}>One-time payment</Label>
              <Select
                name="payment_status"
                defaultValue={project?.payment_status ?? "unpaid"}
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

            <div className="flex flex-col gap-2 sm:col-span-2">
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
                <div className="flex flex-col gap-2">
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
            <Textarea
              id={`${formId}-description`}
              name="description"
              rows={3}
              placeholder="Scope, deliverables, internal notes."
              defaultValue={project?.description ?? ""}
            />
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
