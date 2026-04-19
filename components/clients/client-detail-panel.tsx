import {
  Calendar,
  ChevronRight,
  CreditCard,
  FolderKanban,
  Mail,
  Plus,
  Repeat,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Dot } from "@/components/ui/dot"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Separator } from "@/components/ui/separator"
import { site } from "@/lib/site"
import { cn } from "@/lib/utils"
import {
  paymentStatusBadgeClass,
  paymentStatusLabel,
  projectStageTone,
} from "@/lib/status-colors"
import { ClientStatusBadge } from "./client-status-badge"
import { EditClientDialog } from "./client-form-dialog"
import {
  clientDisplayName,
  deriveClientStatus,
  formatClientNumber,
  formatMonthYear,
  formatUsdFull,
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
    <div className="flex-1 space-y-2 px-6 py-5">
      <FieldLabel>{label}</FieldLabel>
      <p className="font-heading text-2xl font-medium leading-none tabular-nums">
        {value}
      </p>
    </div>
  )
}

export function ClientDetailPanel({ client }: { client: ClientRow | null }) {
  if (!client) {
    return (
      <Card className="flex min-h-80 flex-col items-center justify-center gap-0 p-10 text-center">
        <p className="text-overline font-medium uppercase text-muted-foreground">
          No Client Selected
        </p>
        <p className="mt-4 max-w-xs text-sm text-muted-foreground">
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
      <CardHeader className="items-center p-6">
        <ClientStatusBadge status={derived} />
        <CardAction>
          <EditClientDialog client={client} />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-6 p-0 pb-6">
        <div className="min-w-0 px-6">
          <h2 className="truncate font-heading text-2xl font-medium leading-tight">
            {display}
          </h2>
          <p className="mt-1 flex items-center gap-2 truncate text-sm text-muted-foreground">
            {client.industry ?? "Industry not set"}
            <Dot />
            {client.location ?? "Location not set"}
          </p>
        </div>

        <div>
          <Separator />
          <div className="flex">
            <StatBlock
              label="Lifetime"
              value={formatUsdFull(client.lifetime)}
            />
            <Separator orientation="vertical" />
            <StatBlock
              label="MRR"
              value={
                client.mrr > 0 ? formatUsdFull(client.mrr) : (
                  <span className="text-muted-foreground">—</span>
                )
              }
            />
            <Separator orientation="vertical" />
            <StatBlock label="Projects" value={client.projects.length} />
          </div>
          <Separator />
        </div>

        <div className="grid grid-cols-2 gap-6 px-6">
          <Field label="Primary Contact">{client.name}</Field>
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
          <Field label="Rep">
            {client.owner?.full_name ?? (
              <span className="text-muted-foreground">Unassigned</span>
            )}
          </Field>
          <Field label="Client Since">
            {formatMonthYear(client.created_at)}
          </Field>
          <Field label="Phone">
            {client.phone ?? (
              <span className="text-muted-foreground">—</span>
            )}
          </Field>
          <Field label="Client ID">
            {formatClientNumber(client.client_number)}
          </Field>
        </div>

        <div className="flex flex-col gap-2 px-6">
          <Dialog>
            <DialogTrigger
              nativeButton={false}
              render={
                <Item
                  variant="outline"
                  size="sm"
                  className="cursor-pointer hover:bg-muted"
                />
              }
            >
              <ItemMedia variant="icon">
                <FolderKanban />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Projects</ItemTitle>
                <ItemDescription>
                  Deal stages, values, and payment status
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <span className="tabular-nums text-muted-foreground">
                  {client.projects.length}
                </span>
                <ChevronRight aria-hidden className="size-4" />
              </ItemActions>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Projects — {display}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {client.projects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No projects yet.
                  </p>
                ) : (
                  client.projects.map((p) => {
                    const tone = projectStageTone(p.stage)
                    return (
                      <div
                        key={p.id}
                        className="flex items-start justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {p.title}
                          </p>
                          <p className="mt-2 truncate text-overline font-medium uppercase text-muted-foreground">
                            <span className={tone.text}>{tone.label}</span>
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm tabular-nums">
                            {p.value != null
                              ? formatUsdShort(Number(p.value))
                              : "—"}
                          </p>
                          <Badge
                            variant="outline"
                            className={cn(
                              "mt-2 border-transparent uppercase",
                              paymentStatusBadgeClass(p.payment_status),
                            )}
                          >
                            {paymentStatusLabel(p.payment_status)}
                          </Badge>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger
              nativeButton={false}
              render={
                <Item
                  variant="outline"
                  size="sm"
                  className="cursor-pointer hover:bg-muted"
                />
              }
            >
              <ItemMedia variant="icon">
                <Repeat />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Recurring</ItemTitle>
                <ItemDescription>
                  Active subscriptions and monthly rate
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <span className="tabular-nums text-muted-foreground">
                  {client.subscriptions.length}
                </span>
                <ChevronRight aria-hidden className="size-4" />
              </ItemActions>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Recurring — {display}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {client.subscriptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No recurring engagements yet.
                  </p>
                ) : (
                  client.subscriptions.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-start justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {s.product}
                        </p>
                        <p className="mt-2 truncate text-overline font-medium uppercase text-muted-foreground">
                          {s.plan} <Dot /> Since{" "}
                          {formatMonthYear(s.started_at)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right text-sm tabular-nums">
                        {formatUsdShort(Number(s.monthly_rate))}
                        <span className="text-xs text-muted-foreground">
                          /mo
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>

      <CardFooter className="mt-auto flex-col items-stretch gap-3 p-6">
        <Button className="gap-2" disabled>
          <Plus aria-hidden /> New Project for {display}
        </Button>
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            disabled={!client.email}
            nativeButton={!client.email}
            className="gap-2 capitalize"
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
            className="gap-2 capitalize"
            render={
              calHref ? (
                <a href={calHref} target="_blank" rel="noopener noreferrer" />
              ) : undefined
            }
          >
            <Calendar aria-hidden /> Meet
          </Button>
          <Button
            variant="outline"
            disabled
            nativeButton
            className="gap-2 capitalize"
          >
            <CreditCard aria-hidden /> Stripe
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
