import { ArrowRight, Mail, Phone, UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { claimLead, convertLeadToDeal } from "@/app/(protected)/leads/actions"
import { EditLeadDialog } from "./lead-form-dialog"
import { LeadNotesDialog } from "./lead-notes-dialog"
import { LeadStatusBadge } from "./lead-status-badge"
import {
  SOURCE_LABEL,
  deriveStatus,
  formatAge,
  formatLeadNumber,
  scoreBarColorClass,
  type LeadRow,
} from "./lead-types"
import { cn } from "@/lib/utils"

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <p className="text-overline font-medium uppercase tracking-ui text-muted-foreground">
        {label}
      </p>
      <p className="text-sm">{children}</p>
    </div>
  )
}

export function LeadDetailPanel({ lead }: { lead: LeadRow | null }) {
  if (!lead) {
    return (
      <Card className="flex min-h-80 flex-col items-center justify-center gap-0 p-10 text-center">
        <p className="text-overline font-medium uppercase tracking-ui text-muted-foreground">
          No Lead Selected
        </p>
        <p className="mt-4 max-w-xs text-sm text-muted-foreground">
          Pick a row to see intent, notes, and jump to a quick action.
        </p>
      </Card>
    )
  }

  const derived = deriveStatus(lead)
  const score = lead.score ?? 0

  return (
    <Card className="flex min-h-80 flex-col gap-0 py-0">
      <CardHeader className="items-center p-6">
        <LeadStatusBadge status={derived} />
        <CardAction>
          <EditLeadDialog lead={lead} />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-6 p-6 pt-0">
        <div className="min-w-0">
          <h2 className="truncate font-heading text-2xl font-medium leading-tight tracking-tight">
            {lead.name}
          </h2>
          {lead.company ? (
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {lead.company}
            </p>
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline gap-3">
            <p className="font-heading text-3xl font-medium leading-none tracking-tight tabular-nums">
              {lead.score ?? 0}
            </p>
            <p className="text-overline font-medium uppercase tracking-ui text-muted-foreground">
              Score / 100
            </p>
          </div>
          <div className="h-0.5 bg-border/60" aria-hidden role="presentation">
            <div
              className={cn("h-full", scoreBarColorClass(lead.score))}
              style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
            />
          </div>
        </div>

        <Field label="Intent">{lead.intent ?? "—"}</Field>

        <div className="grid grid-cols-2 gap-6">
          <Field label="Source">{SOURCE_LABEL[lead.source]}</Field>
          <Field label="Age">{formatAge(lead.created_at)} ago</Field>
          <Field label="Budget">{lead.budget ?? "—"}</Field>
          <Field label="Rep">
            {lead.owner?.full_name ?? (
              <span className="text-muted-foreground">Unassigned</span>
            )}
          </Field>
          <LeadNotesDialog notes={lead.notes} />
          <Field label="Lead ID">{formatLeadNumber(lead.lead_number)}</Field>
        </div>
      </CardContent>

      <CardFooter className="mt-auto flex-col items-stretch gap-3 p-6">
        <form action={convertLeadToDeal.bind(null, lead.id)}>
          <Button type="submit" className="w-full gap-2 capitalize">
            <ArrowRight aria-hidden /> Create deal
          </Button>
        </form>
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            disabled={!lead.email}
            nativeButton={!lead.email}
            className="gap-2 capitalize"
            render={lead.email ? <a href={`mailto:${lead.email}`} /> : undefined}
          >
            <Mail aria-hidden /> Email
          </Button>
          <Button
            variant="outline"
            disabled={!lead.phone}
            nativeButton={!lead.phone}
            className="gap-2 capitalize"
            render={lead.phone ? <a href={`tel:${lead.phone}`} /> : undefined}
          >
            <Phone aria-hidden /> Call
          </Button>
          <form action={claimLead.bind(null, lead.id)}>
            <Button
              variant="outline"
              type="submit"
              className="w-full gap-2 capitalize"
            >
              <UserPlus aria-hidden /> Assign
            </Button>
          </form>
        </div>
      </CardFooter>
    </Card>
  )
}
