import Link from "next/link"
import {
  AlertTriangle,
  CalendarClock,
  Clock,
  ExternalLink,
  Hourglass,
  UserPlus,
  Video,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { getUpcomingBookings } from "@/lib/calcom"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

const fmtTime = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
})

const fmtMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

function timeUntil(iso: string, now = Date.now()) {
  const diff = new Date(iso).getTime() - now
  if (diff <= 0) return "NOW"
  const minutes = Math.round(diff / 60_000)
  if (minutes < 60) return `IN ${minutes}M`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `IN ${hours}H`
  const days = Math.round(hours / 24)
  return `IN ${days}D`
}

function daysAgo(iso: string, now = Date.now()) {
  const ms = now - new Date(iso).getTime()
  return Math.max(0, Math.round(ms / 86_400_000))
}

type AttentionItem = {
  key: string
  href: string
  badge: string
  tone: "warning" | "accent" | "muted"
  title: string
  meta: string[]
  right?: string
  icon: React.ComponentType<{ className?: string }>
}

const toneClass: Record<AttentionItem["tone"], string> = {
  warning: "text-orange-500",
  accent: "text-sky-400",
  muted: "text-muted-foreground",
}

function MetaSep() {
  return (
    <span
      aria-hidden
      className="inline-block size-1 shrink-0 bg-border"
    />
  )
}

export async function TodaysFocus() {
  const supabase = await createClient()
  const nowIso = new Date().toISOString()
  const staleCutoff = new Date(Date.now() - 7 * 86_400_000).toISOString()
  const stuckCutoff = new Date(Date.now() - 14 * 86_400_000).toISOString()

  const [bookings, overdueRes, staleLeadsRes, stuckDealsRes] =
    await Promise.all([
      getUpcomingBookings(3),
      supabase
        .from("projects")
        .select(`id, title, value, deadline, clients ( name )`)
        .in("payment_status", ["unpaid", "link_sent"])
        .lt("deadline", nowIso)
        .order("deadline", { ascending: true })
        .limit(4),
      supabase
        .from("clients")
        .select(`id, name, status, created_at`)
        .in("status", ["lead", "qualified"])
        .lt("created_at", staleCutoff)
        .order("created_at", { ascending: true })
        .limit(3),
      supabase
        .from("projects")
        .select(`id, title, stage, updated_at, clients ( name )`)
        .in("stage", ["proposal", "negotiation"])
        .lt("updated_at", stuckCutoff)
        .order("updated_at", { ascending: true })
        .limit(3),
    ])

  const nextBooking = bookings[0] ?? null

  const nextLastInteraction = nextBooking?.clientId
    ? (
        await supabase
          .from("interactions")
          .select("title, type, occurred_at")
          .eq("client_id", nextBooking.clientId)
          .lt("occurred_at", nowIso)
          .order("occurred_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      ).data
    : null

  const attention: AttentionItem[] = []

  for (const row of overdueRes.data ?? []) {
    const client = Array.isArray(row.clients) ? row.clients[0] : row.clients
    attention.push({
      key: `overdue-${row.id}`,
      href: `/projects/${row.id}`,
      badge: "Overdue",
      tone: "warning",
      icon: AlertTriangle,
      title: row.title,
      meta: [client?.name ?? "Unknown", fmtMoney.format(Number(row.value ?? 0))],
      right: row.deadline ? `${daysAgo(row.deadline)}d late` : undefined,
    })
  }

  for (const row of staleLeadsRes.data ?? []) {
    attention.push({
      key: `lead-${row.id}`,
      href: `/leads`,
      badge: "Stale lead",
      tone: "accent",
      icon: UserPlus,
      title: row.name,
      meta: [row.status === "qualified" ? "Qualified" : "Lead", "no touch"],
      right: `${daysAgo(row.created_at)}d`,
    })
  }

  for (const row of stuckDealsRes.data ?? []) {
    const client = Array.isArray(row.clients) ? row.clients[0] : row.clients
    attention.push({
      key: `stuck-${row.id}`,
      href: `/projects/${row.id}`,
      badge: "Stuck",
      tone: "muted",
      icon: Hourglass,
      title: row.title,
      meta: [client?.name ?? "Unknown", `in ${row.stage}`],
      right: `${daysAgo(row.updated_at)}d`,
    })
  }

  const topAttention = attention.slice(0, 5)

  return (
    <section className="flex flex-col border border-border/60 bg-card">
      <header className="flex items-center justify-between gap-4 border-b border-border/60 p-6">
        <h2 className="font-heading text-lg font-medium tracking-tight">
          Today&apos;s focus
        </h2>
      </header>

      <div className="flex flex-col divide-y divide-border/60">
        <NextUp
          booking={nextBooking}
          lastInteraction={
            nextLastInteraction
              ? {
                  title: nextLastInteraction.title,
                  type: nextLastInteraction.type,
                  daysAgo: daysAgo(nextLastInteraction.occurred_at),
                }
              : null
          }
          upcomingCount={bookings.length}
        />

        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-baseline justify-between">
            <p className="text-overline font-medium uppercase tracking-ui text-muted-foreground">
              Needs attention · {topAttention.length}
            </p>
          </div>

          {topAttention.length === 0 ? (
            <p className="text-xs uppercase tracking-ui text-muted-foreground">
              Nothing pressing — nice.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border/60 -mx-6">
              {topAttention.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="flex items-start gap-3 px-6 py-3 hover:bg-muted/40"
                  >
                    <span
                      className={cn(
                        "mt-0.5 inline-flex size-6 shrink-0 items-center justify-center border border-border/60 [&_svg]:size-3",
                        toneClass[item.tone],
                      )}
                      aria-hidden
                    >
                      <item.icon />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {item.title}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <span
                          className={cn(
                            "text-overline font-medium uppercase tracking-ui leading-none",
                            toneClass[item.tone],
                          )}
                        >
                          {item.badge}
                        </span>
                        {item.meta.map((part, i) => (
                          <span
                            key={i}
                            className="flex items-center gap-2"
                          >
                            <MetaSep />
                            <span>{part}</span>
                          </span>
                        ))}
                      </p>
                    </div>
                    {item.right ? (
                      <p className="shrink-0 text-overline font-medium uppercase tracking-ui text-muted-foreground tabular-nums">
                        {item.right}
                      </p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}

function NextUp({
  booking,
  lastInteraction,
  upcomingCount,
}: {
  booking: {
    id: string
    title: string
    startsAt: string
    joinUrl: string | null
    attendee: { name: string }
  } | null
  lastInteraction: {
    title: string
    type: string
    daysAgo: number
  } | null
  upcomingCount: number
}) {
  if (!booking) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <p className="inline-flex items-center gap-2 text-overline font-medium uppercase tracking-ui text-muted-foreground">
          <CalendarClock className="size-3" aria-hidden />
          Next up
        </p>
        <p className="text-sm text-muted-foreground">
          No upcoming meetings on the calendar.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-baseline justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-overline font-medium uppercase tracking-ui text-muted-foreground">
          <CalendarClock className="size-3" aria-hidden />
          Next up
        </p>
        <p className="text-overline font-medium uppercase tracking-ui text-primary tabular-nums">
          {timeUntil(booking.startsAt)}
        </p>
      </div>

      <div>
        <p className="font-heading text-xl font-medium tracking-tight">
          {booking.title}
        </p>
        <p className="mt-2 inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3" aria-hidden />
            {fmtTime.format(new Date(booking.startsAt))}
          </span>
          <span
            aria-hidden
            className="inline-block size-1 shrink-0 bg-border"
          />
          <span>{booking.attendee.name}</span>
        </p>
      </div>

      {lastInteraction ? (
        <div className="border-l-2 border-border/60 pl-3">
          <p className="text-overline font-medium uppercase tracking-ui text-muted-foreground">
            Last touch · {lastInteraction.daysAgo}d ago
          </p>
          <p className="mt-1 truncate text-sm text-foreground">
            {lastInteraction.title}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          nativeButton={!booking.joinUrl}
          disabled={!booking.joinUrl}
          render={
            booking.joinUrl ? (
              <a href={booking.joinUrl} target="_blank" rel="noreferrer" />
            ) : undefined
          }
        >
          <Video />
          Join meeting
        </Button>
        {upcomingCount > 1 ? (
          <Button
            size="sm"
            variant="outline"
            nativeButton={false}
            render={<Link href="/clients" />}
          >
            <ExternalLink />
            {upcomingCount - 1} more upcoming
          </Button>
        ) : null}
      </div>
    </div>
  )
}
