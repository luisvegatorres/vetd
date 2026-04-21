import { Mail, Phone } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ConvertLeadDialog } from "./convert-lead-dialog"
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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-overline font-medium uppercase text-muted-foreground">
      {children}
    </p>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0 space-y-2">
      <FieldLabel>{label}</FieldLabel>
      <p className="truncate text-sm">{children}</p>
    </div>
  )
}

type RepOption = { id: string; full_name: string | null }

export function LeadDetailPanel({
  lead,
  reps,
  currentUserId,
  currentUserIsRep,
}: {
  lead: LeadRow | null
  reps: RepOption[]
  currentUserId: string | null
  currentUserIsRep: boolean
}) {
  if (!lead) {
    return (
      <Card className="flex min-h-80 flex-col items-center justify-center gap-0 p-10 text-center">
        <p className="text-overline font-medium uppercase text-muted-foreground">
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

  // Prefer the lead's existing owner; fall back to the current user when they
  // are a rep so self-conversions don't leave the deal unassigned.
  const defaultRepId =
    lead.owner?.id ?? (currentUserIsRep ? currentUserId : null)

  return (
    <Card className="flex min-h-80 flex-col gap-0 py-0">
      <CardHeader className="flex-col items-start gap-4 p-6">
        <LeadStatusBadge status={derived} />
        <div className="min-w-0 space-y-1">
          <h2 className="truncate font-heading text-xl font-medium leading-tight">
            {lead.name}
          </h2>
          <p
            className={cn(
              "truncate text-sm text-muted-foreground",
              !lead.company && "italic",
            )}
          >
            {lead.company ?? "No business listed"}
          </p>
        </div>
        <CardAction className="self-start">
          <EditLeadDialog lead={lead} />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col p-0">
        <Separator />
        <div className="space-y-3 px-6 py-6">
          <div className="flex items-baseline justify-between gap-3">
            <div className="flex items-baseline gap-3">
              <p className="font-heading text-2xl font-medium leading-none tabular-nums">
                {lead.score ?? 0}
              </p>
              <FieldLabel>Score / 100</FieldLabel>
            </div>
          </div>
          <div className="h-0.5 bg-border/60" aria-hidden role="presentation">
            <div
              className={cn("h-full", scoreBarColorClass(lead.score))}
              style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
            />
          </div>
        </div>

        <Separator />
        <div className="space-y-3 px-6 py-6">
          <FieldLabel>Intent</FieldLabel>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {lead.intent ?? "—"}
          </p>
        </div>

        <Separator />
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 px-6 py-6">
          <Field label="Source">{SOURCE_LABEL[lead.source]}</Field>
          <Field label="Budget">{lead.budget ?? "—"}</Field>
          <Field label="Rep">
            {lead.owner?.full_name ?? (
              <span className="text-muted-foreground">Unassigned</span>
            )}
          </Field>
          <LeadNotesDialog notes={lead.notes} />
        </div>

        <Separator />
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 px-6 py-6">
          <Field label="Age">
            <span className="tabular-nums">
              {formatAge(lead.created_at)} ago
            </span>
          </Field>
          <Field label="Lead ID">
            <span className="tabular-nums">
              {formatLeadNumber(lead.lead_number)}
            </span>
          </Field>
        </div>
      </CardContent>

      <Separator />
      <CardFooter className="mt-auto flex-col items-stretch gap-2 p-6">
        <ConvertLeadDialog
          leadId={lead.id}
          reps={reps}
          defaultRepId={defaultRepId}
        />
        <div className="grid grid-cols-2 gap-2">
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
        </div>
      </CardFooter>
    </Card>
  )
}
