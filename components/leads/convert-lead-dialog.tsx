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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  convertLeadToProject,
  convertLeadToSubscription,
} from "@/app/(protected)/leads/actions"
import type { Database } from "@/lib/supabase/types"

type ProjectProductType =
  Database["public"]["Enums"]["project_product_type"]
type SubscriptionPlan = "presence" | "growth"

const PRODUCT_OPTIONS: Array<{
  value: ProjectProductType
  label: string
  hint: string
}> = [
  {
    value: "business_website",
    label: "Website",
    hint: "One-time website build",
  },
  { value: "mobile_app", label: "Mobile App", hint: "iOS + Android" },
  {
    value: "web_app",
    label: "SaaS Product",
    hint: "Custom SaaS build",
  },
  { value: "ai_integration", label: "AI Integration", hint: "Custom scope" },
]

const PLAN_OPTIONS: Array<{
  value: SubscriptionPlan
  label: string
  rate: number
}> = [
  { value: "presence", label: "Presence", rate: 97 },
  { value: "growth", label: "Growth", rate: 247 },
]

const DEPOSIT_RATE = 0.3

function humanize(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\p{Ll}/gu, (c) => c.toUpperCase())
}

function formatUSD(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function ConvertLeadDialog({ leadId }: { leadId: string }) {
  const router = useRouter()
  const formId = useId()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"subscription" | "project">("subscription")
  const [plan, setPlan] = useState<SubscriptionPlan>("presence")
  const [product, setProduct] =
    useState<ProjectProductType>("business_website")
  const [valueInput, setValueInput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const parsedValue = valueInput === "" ? 0 : Number(valueInput)
  const hasValidValue = Number.isFinite(parsedValue) && parsedValue > 0
  const deposit = useMemo(
    () => (hasValidValue ? Math.round(parsedValue * DEPOSIT_RATE) : 0),
    [hasValidValue, parsedValue],
  )

  function reset() {
    setMode("subscription")
    setPlan("presence")
    setProduct("business_website")
    setValueInput("")
    setError(null)
  }

  function handleOpenChange(next: boolean) {
    if (next) reset()
    setOpen(next)
  }

  function handleSubmit() {
    setError(null)
    if (mode === "subscription") {
      startTransition(async () => {
        const result = await convertLeadToSubscription(leadId, { plan })
        if (result.ok) {
          toast.success("Subscription started")
          setOpen(false)
          router.push(`/clients`)
          router.refresh()
        } else {
          setError(result.error)
        }
      })
      return
    }

    if (!hasValidValue) {
      setError("Enter a project value greater than 0")
      return
    }
    startTransition(async () => {
      const result = await convertLeadToProject(leadId, {
        productType: product,
        value: parsedValue,
      })
      if (result.ok) {
        toast.success("Project created — deposit invoice next")
        setOpen(false)
        router.push(`/pipeline?project=${result.projectId}`)
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
            Pick how the client is paying. Subscriptions start immediately.
            Custom projects require a 30% deposit before work begins.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={mode}
          onValueChange={(v) =>
            setMode((v as "subscription" | "project") ?? "subscription")
          }
        >
          <TabsList className="w-full">
            <TabsTrigger value="subscription" className="flex-1">
              Subscription
            </TabsTrigger>
            <TabsTrigger value="project" className="flex-1">
              Custom project
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subscription" className="mt-6 space-y-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-plan`}>Plan</Label>
              <Select
                value={plan}
                onValueChange={(v) => setPlan(v as SubscriptionPlan)}
              >
                <SelectTrigger id={`${formId}-plan`} className="w-full">
                  <SelectValue>{(value) => humanize(value ?? "")}</SelectValue>
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
            <p className="text-xs text-muted-foreground">
              Growth System — website, hosting, and monthly SEO. Charged
              monthly, no contract. Client status becomes active.
            </p>
          </TabsContent>

          <TabsContent value="project" className="mt-6 space-y-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-product`}>Product</Label>
              <Select
                value={product}
                onValueChange={(v) => setProduct(v as ProjectProductType)}
              >
                <SelectTrigger id={`${formId}-product`} className="w-full">
                  <SelectValue>{(value) => humanize(value ?? "")}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Custom products</SelectLabel>
                    {PRODUCT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {
                  PRODUCT_OPTIONS.find((o) => o.value === product)
                    ?.hint
                }
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-value`}>Project value</Label>
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

            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 divide-x divide-border/60 border border-border/60">
                <div className="flex flex-col items-center px-4 py-4 text-center">
                  <p className="text-overline font-medium uppercase text-muted-foreground">
                    30% deposit
                  </p>
                  <p className="mt-1 font-heading text-2xl font-medium tabular-nums">
                    {hasValidValue ? formatUSD(deposit) : "—"}
                  </p>
                </div>
                <div className="flex flex-col items-center px-4 py-4 text-center">
                  <p className="text-overline font-medium uppercase text-muted-foreground">
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
          </TabsContent>
        </Tabs>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              pending || (mode === "project" && !hasValidValue)
            }
          >
            {pending
              ? "Saving…"
              : mode === "subscription"
                ? "Start subscription"
                : "Create project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
