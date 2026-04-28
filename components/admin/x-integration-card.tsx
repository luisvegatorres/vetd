"use client"

import Link from "next/link"
import {
  CheckCircle2,
  ExternalLink,
  Image as ImageIcon,
  PenLine,
  Send,
  Sparkles,
  Unplug,
} from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import {
  disconnectXIntegration,
  testXConnection,
  type XTestResult,
} from "@/app/(protected)/admin/integrations/actions"
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

const USERS_SCOPE = "users.read"
const TWEET_SCOPE = "tweet.write"
const MEDIA_SCOPE = "media.write"
const OFFLINE_SCOPE = "offline.access"

export function XIntegrationCard({
  configured,
  connection,
  errorReason,
}: Props) {
  const [pending, startTransition] = useTransition()
  const [testing, startTesting] = useTransition()
  const [testResult, setTestResult] = useState<XTestResult | null>(null)

  if (!configured) {
    return (
      <section className="border border-border/60 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-heading text-lg font-medium">X</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Connect vetd&apos;s X account to publish text posts with optional
              images.
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-transparent bg-muted text-muted-foreground uppercase"
          >
            Not configured
          </Badge>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Set <code className="rounded bg-muted px-1">X_CLIENT_ID</code> and{" "}
          <code className="rounded bg-muted px-1">X_CLIENT_SECRET</code> in the
          deployment environment to enable this integration. The callback URL is{" "}
          <code className="rounded bg-muted px-1">/api/x/oauth/callback</code>.
        </p>
      </section>
    )
  }

  function handleDisconnect() {
    startTransition(async () => {
      const result = await disconnectXIntegration()
      if (result.ok) {
        toast.success("Disconnected X")
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleTest() {
    startTesting(async () => {
      const result = await testXConnection()
      setTestResult(result)
      if (result.ok) {
        toast.success(`Live: @${result.profile.username}`)
      } else {
        toast.error(`Test failed: ${result.error}`)
      }
    })
  }

  const hasUsers = connection?.scopes.includes(USERS_SCOPE) ?? false
  const hasTweet = connection?.scopes.includes(TWEET_SCOPE) ?? false
  const hasMedia = connection?.scopes.includes(MEDIA_SCOPE) ?? false
  const hasOffline = connection?.scopes.includes(OFFLINE_SCOPE) ?? false
  const canPublish = hasTweet && hasMedia

  return (
    <section className="border border-border/60 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-medium">X</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            One org-wide account. Access tokens are refreshed with OAuth 2.0
            offline access before publishing.
          </p>
        </div>
        {connection ? (
          <Badge
            variant="outline"
            className="border-transparent bg-emerald-500/15 text-emerald-700 uppercase dark:text-emerald-300"
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
            <p className="text-xs text-muted-foreground uppercase">Account</p>
            <p className="mt-1 truncate font-medium">
              {connection.username
                ? `@${connection.username}`
                : connection.accountId}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">
              Token expires
            </p>
            <p className="mt-1 font-medium">
              {fmtDate.format(new Date(connection.tokenExpiresAt))}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">
              Last refreshed
            </p>
            <p className="mt-1 font-medium">
              {connection.lastRefreshedAt
                ? fmtDate.format(new Date(connection.lastRefreshedAt))
                : "Never"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">Connected</p>
            <p className="mt-1 font-medium">
              {fmtDate.format(new Date(connection.connectedAt))}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-muted-foreground uppercase">Scopes</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <ScopePill enabled={hasUsers} icon={<CheckCircle2 aria-hidden />}>
                Profile
              </ScopePill>
              <ScopePill enabled={hasTweet} icon={<Send aria-hidden />}>
                Publish posts
              </ScopePill>
              <ScopePill enabled={hasMedia} icon={<ImageIcon aria-hidden />}>
                Upload media
              </ScopePill>
              <ScopePill
                enabled={hasOffline}
                icon={<CheckCircle2 aria-hidden />}
              >
                Refresh token
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

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {connection ? (
          <>
            {canPublish ? (
              <>
                <Link
                  href="/admin/integrations/x/drafts"
                  className={cn(buttonVariants(), "gap-2")}
                >
                  <Sparkles aria-hidden />
                  Drafts
                </Link>
                <Link
                  href="/admin/integrations/x/post"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "gap-2",
                  )}
                >
                  <PenLine aria-hidden />
                  Compose
                </Link>
              </>
            ) : null}
            <Link
              href="/api/x/oauth/start"
              className={buttonVariants({ variant: "outline" })}
              prefetch={false}
            >
              Reconnect
            </Link>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleTest}
              disabled={testing}
            >
              <CheckCircle2 aria-hidden />
              {testing ? "Testing..." : "Test connection"}
            </Button>
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
          <Link
            href="/api/x/oauth/start"
            className={buttonVariants()}
            prefetch={false}
          >
            Connect X
          </Link>
        )}
      </div>

      {testResult?.ok ? (
        <div className="mt-4 border border-border/60 p-4">
          <p className="text-xs text-muted-foreground uppercase">
            Live data from X
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">Account ID</dt>
            <dd className="font-mono text-xs">{testResult.profile.id}</dd>
            <dt className="text-muted-foreground">Name</dt>
            <dd>{testResult.profile.name}</dd>
            <dt className="text-muted-foreground">Username</dt>
            <dd>
              <a
                href={`https://x.com/${testResult.profile.username}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:underline"
              >
                @{testResult.profile.username}
                <ExternalLink className="size-3" aria-hidden />
              </a>
            </dd>
          </dl>
        </div>
      ) : null}
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
          : "bg-muted text-muted-foreground"
      )}
    >
      {icon}
      {children}
    </Badge>
  )
}
