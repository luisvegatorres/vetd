"use client"

import { ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useId, useMemo, useState, useTransition } from "react"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
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
import { convertLead } from "@/app/(protected)/leads/actions"
import type { Database } from "@/lib/supabase/types"

type ProjectProductType = Database["public"]["Enums"]["project_product_type"]
type SubscriptionPlanId = "presence" | "growth"

const PRODUCT_OPTIONS: Array<{
  value: ProjectProductType
  label: string
}> = [
  { value: "business_website", label: "Website" },
  { value: "mobile_app", label: "Mobile App" },
  { value: "web_app", label: "SaaS Product" },
  { value: "ai_integration", label: "AI Integration" },
]

const PRODUCT_LABEL: Record<ProjectProductType, string> = {
  business_website: "Website",
  mobile_app: "Mobile App",
  web_app: "SaaS Product",
  ai_integration: "AI Integration",
}

const PLAN_OPTIONS: Array<{
  value: SubscriptionPlanId
  label: string
  rate: number
}> = [
  { value: "presence", label: "Presence", rate: 97 },
  { value: "growth", label: "Growth", rate: 247 },
]

const PLAN_LABEL: Record<SubscriptionPlanId, string> = {
  presence: "Presence",
  growth: "Growth",
}

const DEPOSIT_RATE = 0.3

function formatUSD(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount)
}

type RepOption = { id: string; full_name: string | null }

export function ConvertLeadDialog({
  leadId,
  reps,
  defaultRepId,
}: {
  leadId: string
  reps: RepOption[]
  defaultRepId: string | null
}) {
  const router = useRouter()
  const formId = useId()
  const [open, setOpen] = useState(false)

  const [product, setProduct] = useState<ProjectProductType>("business_website")

  const [planEnabled, setPlanEnabled] = useState(true)
  const [plan, setPlan] = useState<SubscriptionPlanId>("presence")

  const [buildEnabled, setBuildEnabled] = useState(false)
  const [valueInput, setValueInput] = useState("")

  const initialRepId =
    defaultRepId && reps.some((r) => r.id === defaultRepId)
      ? defaultRepId
      : reps.length === 1
        ? reps[0].id
        : ""
  const [repId, setRepId] = useState<string>(initialRepId)

  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const parsedValue = valueInput === "" ? 0 : Number(valueInput)
  const hasValidValue = Number.isFinite(parsedValue) && parsedValue > 0
  const deposit = useMemo(
    () => (hasValidValue ? Math.round(parsedValue * DEPOSIT_RATE) : 0),
    [hasValidValue, parsedValue]
  )

  function reset() {
    setProduct("business_website")
    setPlanEnabled(true)
    setPlan("presence")
    setBuildEnabled(false)
    setValueInput("")
    setRepId(initialRepId)
    setError(null)
  }

  function handleOpenChange(next: boolean) {
    if (next) reset()
    setOpen(next)
  }

  function handleProductChange(next: ProjectProductType) {
    setProduct(next)
    // Smart defaults: website leans recurring, others lean one-time build.
    if (next === "business_website") {
      setPlanEnabled(true)
      setBuildEnabled(false)
    } else {
      setPlanEnabled(false)
      setBuildEnabled(true)
    }
  }

  const canSubmit =
    (planEnabled || buildEnabled) &&
    (!buildEnabled || hasValidValue) &&
    repId !== ""

  function handleSubmit() {
    setError(null)
    if (!repId) {
      setError("Pick a sales rep for this deal")
      return
    }
    if (!planEnabled && !buildEnabled) {
      setError("Pick a monthly plan, a one-time build, or both")
      return
    }
    if (buildEnabled && !hasValidValue) {
      setError("Enter a one-time value greater than 0")
      return
    }

    startTransition(async () => {
      const result = await convertLead(leadId, {
        productType: product,
        soldBy: repId,
        build: buildEnabled ? { value: parsedValue } : null,
        plan: planEnabled ? { id: plan } : null,
      })
      if (result.ok) {
        toast.success(
          buildEnabled
            ? "Project created. Deposit invoice next."
            : "Project created. Subscription active."
        )
        setOpen(false)
        if (buildEnabled) {
          router.push(`/pipeline?project=${result.projectId}`)
        } else {
          router.push(`/clients`)
        }
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button className="w-full gap-2 capitalize">
            <ArrowRight aria-hidden /> Convert
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Convert lead</DialogTitle>
          <DialogDescription>
            Turn this lead into a project. Add a monthly plan, a one-time build,
            or both.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${formId}-rep`}>Rep</Label>
            <Select value={repId} onValueChange={(v) => setRepId(v ?? "")}>
              <SelectTrigger id={`${formId}-rep`} className="w-full">
                <SelectValue placeholder="Pick a sales rep">
                  {(value) => {
                    if (!value) return ""
                    const r = reps.find((x) => x.id === value)
                    return r?.full_name ?? "Unnamed rep"
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Rep</SelectLabel>
                  {reps.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      No active reps
                    </SelectItem>
                  ) : (
                    reps.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.full_name ?? "Unnamed rep"}
                      </SelectItem>
                    ))
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Commissions and Stripe metadata are tied to this rep.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`${formId}-product`}>Product</Label>
            <Select
              value={product}
              onValueChange={(v) =>
                handleProductChange(v as ProjectProductType)
              }
            >
              <SelectTrigger id={`${formId}-product`} className="w-full">
                <SelectValue>
                  {(value) =>
                    value ? PRODUCT_LABEL[value as ProjectProductType] : ""
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Products</SelectLabel>
                  {PRODUCT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="border border-border/60">
            <div className="flex items-center justify-between gap-4 px-4 py-4">
              <div className="flex flex-col gap-1">
                <Label
                  htmlFor={`${formId}-plan-toggle`}
                  className="text-sm font-medium"
                >
                  Monthly plan
                </Label>
                <p className="text-xs text-muted-foreground">
                  Recurring engagement. Client becomes active immediately.
                </p>
              </div>
              <Switch
                id={`${formId}-plan-toggle`}
                checked={planEnabled}
                onCheckedChange={setPlanEnabled}
              />
            </div>
            {planEnabled ? (
              <div className="border-t border-border/60 px-4 py-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`${formId}-plan`}>Plan</Label>
                  <Select
                    value={plan}
                    onValueChange={(v) => setPlan(v as SubscriptionPlanId)}
                  >
                    <SelectTrigger id={`${formId}-plan`} className="w-full">
                      <SelectValue>
                        {(value) =>
                          value ? PLAN_LABEL[value as SubscriptionPlanId] : ""
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Growth System plans</SelectLabel>
                        {PLAN_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label} — ${option.rate}/mo
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : null}
          </div>

          <div className="border border-border/60">
            <div className="flex items-center justify-between gap-4 px-4 py-4">
              <div className="flex flex-col gap-1">
                <Label
                  htmlFor={`${formId}-build-toggle`}
                  className="text-sm font-medium"
                >
                  One-time build
                </Label>
                <p className="text-xs text-muted-foreground">
                  Fixed-scope project. 30% deposit before work begins.
                </p>
              </div>
              <Switch
                id={`${formId}-build-toggle`}
                checked={buildEnabled}
                onCheckedChange={setBuildEnabled}
              />
            </div>
            {buildEnabled ? (
              <div className="space-y-4 border-t border-border/60 px-4 py-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`${formId}-value`}>One-time value</Label>
                  <InputGroup>
                    <InputGroupAddon>
                      <InputGroupText>$</InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput
                      id={`${formId}-value`}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="8000"
                      value={valueInput}
                      onChange={(e) =>
                        setValueInput(e.target.value.replace(/\D/g, ""))
                      }
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupText>USD</InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                </div>
                <div className="grid grid-cols-2 divide-x divide-border/60 border border-border/60">
                  <div className="flex flex-col items-center px-4 py-4 text-center">
                    <p className="text-overline font-medium text-muted-foreground uppercase">
                      30% deposit
                    </p>
                    <p className="mt-1 font-heading text-2xl font-medium tabular-nums">
                      {hasValidValue ? formatUSD(deposit) : "—"}
                    </p>
                  </div>
                  <div className="flex flex-col items-center px-4 py-4 text-center">
                    <p className="text-overline font-medium text-muted-foreground uppercase">
                      Remaining
                    </p>
                    <p className="mt-1 font-heading text-2xl font-medium tabular-nums">
                      {hasValidValue ? formatUSD(parsedValue - deposit) : "—"}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Deal starts in Proposal. It cannot move to Active until the
                  deposit clears.
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={pending || !canSubmit}
          >
            {pending ? "Saving…" : "Convert"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
