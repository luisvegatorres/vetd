import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type IntegrationStatus =
  | "connected"
  | "not-connected"
  | "not-configured"
  | "error"

type MetaRow = {
  label: string
  value: ReactNode
  span?: "half" | "full"
}

type Capability = {
  enabled: boolean
  icon: ReactNode
  label: string
}

type Props = {
  title: string
  description: string
  status: IntegrationStatus
  meta?: MetaRow[]
  capabilities?: Capability[]
  error?: string | null
  footer?: ReactNode
  actions?: ReactNode
}

const STATUS_COPY: Record<IntegrationStatus, string> = {
  connected: "Connected",
  "not-connected": "Not connected",
  "not-configured": "Not configured",
  error: "Error",
}

export function IntegrationCard({
  title,
  description,
  status,
  meta,
  capabilities,
  error,
  footer,
  actions,
}: Props) {
  return (
    <section className="border border-border/60 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-medium">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      {meta && meta.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          {meta.map((row, idx) => (
            <div
              key={`${row.label}-${idx}`}
              className={row.span === "full" ? "sm:col-span-2" : undefined}
            >
              <p className="text-xs uppercase text-muted-foreground">
                {row.label}
              </p>
              <div className="mt-1 truncate font-medium">{row.value}</div>
            </div>
          ))}
          {capabilities && capabilities.length > 0 ? (
            <div className="sm:col-span-2">
              <p className="text-xs uppercase text-muted-foreground">
                Capabilities
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {capabilities.map((cap, idx) => (
                  <CapabilityPill key={idx} enabled={cap.enabled} icon={cap.icon}>
                    {cap.label}
                  </CapabilityPill>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 text-sm text-destructive">{error}</p>
      ) : null}

      {footer ? (
        <p className="mt-4 text-xs text-muted-foreground">{footer}</p>
      ) : null}

      {actions ? (
        <div className="mt-6 flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </section>
  )
}

function StatusBadge({ status }: { status: IntegrationStatus }) {
  if (status === "connected") {
    return (
      <Badge
        variant="outline"
        className="border-transparent bg-emerald-500/15 uppercase text-emerald-700 dark:text-emerald-300"
      >
        {STATUS_COPY.connected}
      </Badge>
    )
  }
  if (status === "error") {
    return (
      <Badge
        variant="outline"
        className="border-transparent bg-destructive/15 uppercase text-destructive"
      >
        {STATUS_COPY.error}
      </Badge>
    )
  }
  if (status === "not-configured") {
    return (
      <Badge
        variant="outline"
        className="bg-muted text-muted-foreground border-transparent uppercase"
      >
        {STATUS_COPY["not-configured"]}
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="uppercase">
      {STATUS_COPY["not-connected"]}
    </Badge>
  )
}

type TileProps = {
  title: string
  status: IntegrationStatus
  icon: ReactNode
  detail: string
  href?: string | null
  hint?: string | null
}

export function IntegrationTile({
  title,
  status,
  icon,
  detail,
  href,
  hint,
}: TileProps) {
  return (
    <section className="flex h-full flex-col gap-3 border border-border/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-muted-foreground [&>svg]:size-4">{icon}</span>
          <h3 className="font-heading text-sm font-medium">{title}</h3>
        </div>
        <StatusDot status={status} />
      </div>

      <div className="min-w-0 text-xs">
        <p className="truncate font-medium">{detail}</p>
        {hint ? (
          <p className="mt-1 truncate text-muted-foreground">{hint}</p>
        ) : null}
      </div>

      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="mt-auto text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Open dashboard →
        </a>
      ) : null}
    </section>
  )
}

function StatusDot({ status }: { status: IntegrationStatus }) {
  const tone =
    status === "connected"
      ? "bg-emerald-500"
      : status === "error"
        ? "bg-destructive"
        : status === "not-configured"
          ? "bg-muted-foreground/40"
          : "bg-muted-foreground/60"
  return (
    <span
      title={STATUS_COPY[status]}
      aria-label={STATUS_COPY[status]}
      className={cn("mt-1 size-2 shrink-0 rounded-full", tone)}
    />
  )
}

function CapabilityPill({
  enabled,
  icon,
  children,
}: {
  enabled: boolean
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 border-transparent uppercase",
        enabled
          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
          : "bg-muted text-muted-foreground",
      )}
    >
      {icon}
      {children}
    </Badge>
  )
}
