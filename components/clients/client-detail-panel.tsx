import {
  Calendar,
  CalendarClock,
  FolderKanban,
  Mail,
  MousePointerSquareDashed,
  Phone,
  Repeat,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { NewProjectDialog } from "@/components/projects/project-form-dialog"
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { Dot } from "@/components/ui/dot"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { site } from "@/lib/site"
import { ClientStatusBadge } from "./client-status-badge"
import { EditClientDialog, type RepOption } from "./client-form-dialog"
import {
  clientDisplayName,
  deriveClientStatus,
  formatClientNumber,
  formatMonthYear,
  formatUsdShort,
  type ClientRow,
} from "./client-types"

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
    <div className="space-y-2 min-w-0">
      <FieldLabel>{label}</FieldLabel>
      <p className="truncate text-sm">{children}</p>
    </div>
  )
}

function StatBlock({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex-1 space-y-2 px-6 py-6">
      <FieldLabel>{label}</FieldLabel>
      <p className="font-heading text-2xl font-medium leading-none tabular-nums">
        {value}
      </p>
    </div>
  )
}

export function ClientDetailPanel({
  client,
  reps,
  canReassign,
}: {
  client: ClientRow | null
  reps?: RepOption[]
  canReassign?: boolean
}) {
  if (!client) {
    return (
      <Card className="flex min-h-80 flex-col items-center justify-center gap-0 p-10 text-center">
        <MousePointerSquareDashed
          aria-hidden
          className="size-6 text-muted-foreground"
        />
        <h2 className="mt-4 font-heading text-base font-medium">
          No client selected
        </h2>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Pick a row to see contact info, projects, and recurring revenue.
        </p>
      </Card>
    )
  }

  const derived = deriveClientStatus(client)
  const display = clientDisplayName(client)
  const calHref = site.calLink ? `https://cal.com/${site.calLink}` : null

  return (
    <Card className="flex min-h-80 flex-col gap-0 py-0">
      <CardHeader className="flex-col items-start gap-4 p-6">
        <ClientStatusBadge status={derived} />
        <div className="min-w-0 space-y-1">
          <h2 className="truncate font-sans text-xl font-medium leading-tight">
            {display}
          </h2>
          <p className="flex items-center gap-2 truncate text-sm text-muted-foreground">
            {client.industry ?? "Industry not set"}
            <Dot />
            {client.location ?? "Location not set"}
          </p>
        </div>
        <CardAction className="self-start">
          <EditClientDialog
            client={client}
            reps={reps}
            canReassign={canReassign}
          />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col p-0">
        <Separator />
        <div className="flex items-stretch">
          <StatBlock
            label="Lifetime"
            value={
              client.lifetime > 0 ? (
                formatUsdShort(client.lifetime)
              ) : (
                <span className="text-muted-foreground">—</span>
              )
            }
          />
          <Separator orientation="vertical" />
          <StatBlock
            label="MRR"
            value={
              client.mrr > 0 ? (
                formatUsdShort(client.mrr)
              ) : (
                <span className="text-muted-foreground">—</span>
              )
            }
          />
        </div>
        <Separator />

        <div className="grid grid-cols-2 gap-x-6 gap-y-5 px-6 py-6">
          <Field label="Primary Contact">{client.name}</Field>
          <Field label="Rep">
            {client.owner?.full_name ?? (
              <span className="text-muted-foreground">Unassigned</span>
            )}
          </Field>
          <Field label="Email">
            {client.email ? (
              <a
                href={`mailto:${client.email}`}
                className="hover:underline underline-offset-4"
              >
                {client.email}
              </a>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </Field>
          <Field label="Phone">
            {client.phone ?? (
              <span className="text-muted-foreground">—</span>
            )}
          </Field>
        </div>

        <Separator />
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <FieldLabel>Timeline</FieldLabel>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="View client dates"
                  className="size-7"
                />
              }
            >
              <CalendarClock aria-hidden className="size-4" />
            </TooltipTrigger>
            <TooltipContent side="left" className="p-0">
              <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-1 px-3 py-2 text-xs">
                <dt className="uppercase tracking-wide opacity-70">Since</dt>
                <dd className="tabular-nums">
                  {formatMonthYear(client.created_at)}
                </dd>
                <dt className="uppercase tracking-wide opacity-70">
                  Client ID
                </dt>
                <dd className="tabular-nums">
                  {formatClientNumber(client.client_number)}
                </dd>
              </dl>
            </TooltipContent>
          </Tooltip>
        </div>

        <Separator />
        <div className="flex items-center justify-between gap-3 px-6 py-5">
          <div className="flex items-center gap-3">
            <FolderKanban
              aria-hidden
              className="size-4 text-muted-foreground"
            />
            <span className="text-sm font-medium">Projects</span>
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">
            {client.projects.length > 0 ? client.projects.length : "—"}
          </span>
        </div>
        <Separator />
        <div className="flex items-center justify-between gap-3 px-6 py-5">
          <div className="flex items-center gap-3">
            <Repeat aria-hidden className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Recurring</span>
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">
            {client.subscriptions.length > 0
              ? client.subscriptions.length
              : "—"}
          </span>
        </div>
      </CardContent>

      <Separator />
      <CardFooter className="mt-auto flex-col items-stretch gap-2 p-6">
        <NewProjectDialog
          clients={[
            {
              id: client.id,
              name: client.name,
              company: client.company,
            },
          ]}
          reps={(reps ?? []).map((r) => ({ id: r.id, full_name: r.full_name }))}
          lockedClient={{
            id: client.id,
            name: client.name,
            company: client.company,
          }}
        />
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            disabled={!client.phone}
            nativeButton={!client.phone}
            className="gap-2"
            render={
              client.phone ? <a href={`tel:${client.phone}`} /> : undefined
            }
          >
            <Phone aria-hidden /> Call
          </Button>
          <Button
            variant="outline"
            disabled={!client.email}
            nativeButton={!client.email}
            className="gap-2"
            render={
              client.email ? <a href={`mailto:${client.email}`} /> : undefined
            }
          >
            <Mail aria-hidden /> Email
          </Button>
          <Button
            variant="outline"
            disabled={!calHref}
            nativeButton={!calHref}
            className="gap-2"
            render={
              calHref ? (
                <a href={calHref} target="_blank" rel="noopener noreferrer" />
              ) : undefined
            }
          >
            <Calendar aria-hidden /> Meet
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
