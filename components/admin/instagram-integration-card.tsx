"use client"

import { Image as ImageIcon, Send, Unplug } from "lucide-react"
import { useTransition } from "react"
import { toast } from "sonner"

import { disconnectInstagramIntegration } from "@/app/(protected)/admin/integrations/actions"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = {
  configured: boolean
  connection: {
    username: string | null
    accountId: string
    scopes: string[]
    tokenExpiresAt: string
    lastRefreshedAt: string | null
    connectedAt: string
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

const BASIC_SCOPE = "instagram_business_basic"
const PUBLISH_SCOPE = "instagram_business_content_publish"

export function InstagramIntegrationCard({
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
            <h2 className="font-heading text-lg font-medium">Instagram</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Connect vetd&apos;s Business or Creator account to read profile
              and media data, and publish posts programmatically.
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
          Set <code className="rounded bg-muted px-1">INSTAGRAM_APP_ID</code>{" "}
          and{" "}
          <code className="rounded bg-muted px-1">INSTAGRAM_APP_SECRET</code> in
          the deployment environment to enable this integration. The IDs come
          from Meta dashboard, Instagram, API setup with Instagram Login (not
          the top-level Meta App ID).
        </p>
      </section>
    )
  }

  function handleDisconnect() {
    startTransition(async () => {
      const result = await disconnectInstagramIntegration()
      if (result.ok) {
        toast.success("Disconnected Instagram")
      } else {
        toast.error(result.error)
      }
    })
  }

  const hasBasic = connection?.scopes.includes(BASIC_SCOPE) ?? false
  const hasPublish = connection?.scopes.includes(PUBLISH_SCOPE) ?? false

  return (
    <section className="border border-border/60 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-medium">Instagram</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            One Business or Creator account, shared across the org. Tokens
            refresh weekly via cron and stay valid for 60 days from each
            refresh.
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
              {connection.username ? `@${connection.username}` : connection.accountId}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">
              Token expires
            </p>
            <p className="mt-1 font-medium">
              {fmtDate.format(new Date(connection.tokenExpiresAt))}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">
              Last refreshed
            </p>
            <p className="mt-1 font-medium">
              {connection.lastRefreshedAt
                ? fmtDate.format(new Date(connection.lastRefreshedAt))
                : "Never"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Connected</p>
            <p className="mt-1 font-medium">
              {fmtDate.format(new Date(connection.connectedAt))}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs uppercase text-muted-foreground">Scopes</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <ScopePill enabled={hasBasic} icon={<ImageIcon aria-hidden />}>
                Profile and media
              </ScopePill>
              <ScopePill enabled={hasPublish} icon={<Send aria-hidden />}>
                Publish posts
              </ScopePill>
            </div>
          </div>
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
            <a href="/api/instagram/oauth/start" className={buttonVariants()}>
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
          <a href="/api/instagram/oauth/start" className={buttonVariants()}>
            Connect Instagram
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
