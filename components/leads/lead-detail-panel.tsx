import { ArrowRight, Mail, Phone, UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { claimLead, convertLeadToDeal } from "@/app/(protected)/leads/actions"
import { LeadStatusBadge } from "./lead-status-badge"
import {
  SOURCE_LABEL,
  avatarColor,
  deriveStatus,
  formatAge,
  formatLeadNumber,
  initials,
  type LeadRow,
} from "./lead-types"

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="text-overline font-medium uppercase tracking-ui text-muted-foreground">
        / {label}
      </p>
      <p className="mt-2 text-sm">{children}</p>
    </div>
  )
}

export function LeadDetailPanel({ lead }: { lead: LeadRow | null }) {
  if (!lead) {
    return (
      <aside className="flex min-h-80 flex-col items-center justify-center border border-border/60 bg-card p-10 text-center">
        <p className="text-overline font-medium uppercase tracking-ui text-muted-foreground">
          / No Lead Selected
        </p>
        <p className="mt-4 max-w-xs text-sm text-muted-foreground">
          Pick a row to see intent, notes, and jump to a quick action.
        </p>
      </aside>
    )
  }

  const derived = deriveStatus(lead)

  return (
    <aside className="flex min-h-80 flex-col border border-border/60 bg-card">
      <header className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
        <p className="text-overline font-medium uppercase tracking-ui text-muted-foreground">
          / {formatLeadNumber(lead.lead_number)}
        </p>
        <LeadStatusBadge status={derived} />
      </header>

      <div className="space-y-6 px-5 py-5">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "flex size-9 items-center justify-center text-xs font-medium uppercase tracking-ui text-white",
              avatarColor(lead.id),
            )}
          >
            {initials(lead.name)}
          </span>
          <div className="min-w-0">
            <p className="text-overline font-medium uppercase tracking-ui text-muted-foreground">
              / Lead
            </p>
            <h2 className="mt-1 truncate font-heading text-2xl font-medium tracking-tight">
              {lead.name}
            </h2>
            {lead.company ? (
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {lead.company}
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <div className="flex items-end gap-3">
            <span className="font-heading text-4xl font-medium leading-none tracking-tight tabular-nums">
              {lead.score ?? "—"}
            </span>
            <span className="pb-1 text-overline font-medium uppercase tracking-ui text-muted-foreground">
              Score / 100
            </span>
          </div>
          <div className="mt-3 h-1 w-full bg-muted">
            <div
              className="h-full bg-primary"
              style={{
                width: `${Math.max(0, Math.min(100, lead.score ?? 0))}%`,
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-border/60 pt-5">
          <Field label="Intent">{lead.intent ?? "—"}</Field>
          <Field label="Source">{SOURCE_LABEL[lead.source]}</Field>
          <Field label="Budget">{lead.budget ?? "—"}</Field>
          <Field label="Age">{formatAge(lead.created_at)} ago</Field>
          <Field label="Owner">
            {lead.owner?.full_name ?? (
              <span className="text-muted-foreground">Unassigned</span>
            )}
          </Field>
          <Field label="ID">{formatLeadNumber(lead.lead_number)}</Field>
        </div>

        {lead.notes ? (
          <div className="border-t border-border/60 pt-5">
            <p className="text-overline font-medium uppercase tracking-ui text-muted-foreground">
              / Notes
            </p>
            <p className="mt-2 text-sm leading-relaxed">{lead.notes}</p>
          </div>
        ) : null}
      </div>

      <div className="mt-auto border-t border-border/60">
        <form action={convertLeadToDeal.bind(null, lead.id)}>
          <Button type="submit" className="h-11 w-full uppercase tracking-ui">
            <ArrowRight aria-hidden /> Convert to deal
          </Button>
        </form>
        <div className="grid grid-cols-3 divide-x divide-border/60 border-t border-border/60">
          <Button
            variant="ghost"
            size="default"
            disabled={!lead.email}
            nativeButton={!lead.email}
            className="h-11 rounded-none uppercase tracking-ui"
            render={
              lead.email ? <a href={`mailto:${lead.email}`} /> : undefined
            }
          >
            <Mail aria-hidden /> Email
          </Button>
          <Button
            variant="ghost"
            size="default"
            disabled={!lead.phone}
            nativeButton={!lead.phone}
            className="h-11 rounded-none uppercase tracking-ui"
            render={lead.phone ? <a href={`tel:${lead.phone}`} /> : undefined}
          >
            <Phone aria-hidden /> Call
          </Button>
          <form action={claimLead.bind(null, lead.id)} className="contents">
            <Button
              variant="ghost"
              size="default"
              type="submit"
              className="h-11 rounded-none uppercase tracking-ui"
            >
              <UserPlus aria-hidden /> Assign
            </Button>
          </form>
        </div>
      </div>
    </aside>
  )
}
