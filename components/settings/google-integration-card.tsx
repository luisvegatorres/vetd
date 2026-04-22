"use client"

import { Calendar, Mail, Unplug } from "lucide-react"
import { useTransition } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { disconnectGoogleIntegration } from "@/app/(protected)/settings/actions"
import { cn } from "@/lib/utils"

type Props = {
  configured: boolean
  connection: {
    googleEmail: string | null
    scopes: string[]
    lastSyncedAt: string | null
    lastSyncError: string | null
  } | null
  errorReason?: string
}

const fmtDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
})

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly"
const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly"

export function GoogleIntegrationCard({
  configured,
  connection,
  errorReason,
}: Props) {
  const [pending, startTransition] = useTransition()

  if (!configured) {
    return (
      <section className="border border-border/60 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-heading text-lg font-medium">Google Workspace</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Once the company workspace is provisioned, reps will be able to
              connect Calendar + Gmail here so meetings and client emails
              count toward their activity automatically.
            </p>
          </div>
          <Badge
            variant="outline"
            className="bg-muted text-muted-foreground border-transparent uppercase"
          >
            Not configured
          </Badge>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Set <code className="rounded bg-muted px-1">GOOGLE_CLIENT_ID</code>,{" "}
          <code className="rounded bg-muted px-1">GOOGLE_CLIENT_SECRET</code>,
          and <code className="rounded bg-muted px-1">CRON_SECRET</code> in the
          deployment environment to enable this integration.
        </p>
      </section>
    )
  }

  function handleDisconnect() {
    startTransition(async () => {
      const result = await disconnectGoogleIntegration()
      if (result.ok) {
        toast.success("Disconnected Google Workspace")
      } else {
        toast.error(result.error)
      }
    })
  }

  const hasCalendar = connection?.scopes.includes(CALENDAR_SCOPE) ?? false
  const hasGmail = connection?.scopes.includes(GMAIL_SCOPE) ?? false

  return (
    <section className="border border-border/60 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-medium">Google Workspace</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect your company Google account. Meetings from Calendar and
            emails to/from client addresses are synced automatically and count
            toward your activity.
          </p>
        </div>
        {connection ? (
          <Badge
            variant="outline"
            className="border-transparent bg-emerald-500/15 uppercase text-emerald-700 dark:text-emerald-300"
          >
            Connected
          </Badge>
        ) : (
          <Badge variant="outline" className="uppercase">
            Not connected
          </Badge>
        )}
      </div>

      {connection ? (
        <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Account</p>
            <p className="mt-1 truncate font-medium">
              {connection.googleEmail ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Last sync</p>
            <p className="mt-1 font-medium">
              {connection.lastSyncedAt
                ? fmtDate.format(new Date(connection.lastSyncedAt))
                : "Pending first run"}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs uppercase text-muted-foreground">Scopes</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <ScopePill enabled={hasCalendar} icon={<Calendar aria-hidden />}>
                Calendar — meeting detection
              </ScopePill>
              <ScopePill enabled={hasGmail} icon={<Mail aria-hidden />}>
                Gmail — client email detection
              </ScopePill>
            </div>
          </div>
          {connection.lastSyncError ? (
            <p className="text-xs text-destructive sm:col-span-2">
              Last sync error: {connection.lastSyncError}
            </p>
          ) : null}
        </div>
      ) : null}

      {errorReason ? (
        <p className="mt-4 text-sm text-destructive">
          Connection failed: {errorReason}
        </p>
      ) : null}

      <div className="mt-6 flex items-center gap-2">
        {connection ? (
          <>
            <a href="/api/google/oauth/start" className={buttonVariants()}>
              Reconnect
            </a>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleDisconnect}
              disabled={pending}
            >
              <Unplug aria-hidden />
              Disconnect
            </Button>
          </>
        ) : (
          <a href="/api/google/oauth/start" className={buttonVariants()}>
            Connect Google
          </a>
        )}
      </div>
    </section>
  )
}

function ScopePill({
  enabled,
  icon,
  children,
}: {
  enabled: boolean
  icon: React.ReactNode
  children: React.ReactNode
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
