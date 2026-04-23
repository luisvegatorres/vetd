"use client"

import { useTransition } from "react"
import { Check, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { activateRecurringPlan } from "@/app/(protected)/projects/actions"
import type { ProjectRow } from "./project-types"

type Props = {
  project: Pick<
    ProjectRow,
    "id" | "value" | "stage" | "payment_status" | "deposit_paid_at"
  > & {
    subscription: NonNullable<ProjectRow["subscription"]>
  }
}

type Gate = { ok: true } | { ok: false; reason: string }

function evaluateGates(project: Props["project"]): Gate {
  const isPriced = project.value != null && project.value > 0
  if (isPriced && !project.deposit_paid_at) {
    return { ok: false, reason: "Collect the deposit first" }
  }
  if (isPriced && project.payment_status !== "paid") {
    return { ok: false, reason: "Collect the remaining balance first" }
  }
  if (isPriced && project.stage !== "completed") {
    return { ok: false, reason: "Mark the project completed first" }
  }
  return { ok: true }
}

export function ActivateRecurringPlanBanner({ project }: Props) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const gate = evaluateGates(project)

  return (
    <Item variant="muted">
      <ItemMedia variant="icon">
        <Clock aria-hidden className="text-muted-foreground" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>
          Recurring plan is pending — billing starts when you activate it.
        </ItemTitle>
        <ItemDescription>
          {gate.ok
            ? "Project is delivered and paid. Ready to start billing."
            : `${gate.reason}.`}
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button
          size="sm"
          disabled={!gate.ok || pending}
          onClick={() => {
            startTransition(async () => {
              const result = await activateRecurringPlan(project.id)
              if (result.ok) {
                toast.success("Plan activated — first bill runs today")
                router.refresh()
              } else {
                toast.error(result.error)
              }
            })
          }}
        >
          <Check aria-hidden /> Activate plan
        </Button>
      </ItemActions>
    </Item>
  )
}
