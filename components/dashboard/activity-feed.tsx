import {
  CreditCard,
  Mail,
  MessageCircle,
  Phone,
  StickyNote,
  UserPlus,
  Video,
  type LucideIcon,
} from "lucide-react"

import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"
import type { Database } from "@/lib/supabase/types"

type InteractionType = Database["public"]["Enums"]["interaction_type"]

type FeedEvent = {
  id: string
  kind: "interaction" | "payment" | "client"
  at: string
  icon: LucideIcon
  iconTone: "default" | "positive" | "accent"
  title: string
  meta: string
}

const interactionIcons: Record<InteractionType, LucideIcon> = {
  call: Phone,
  email: Mail,
  meeting: Video,
  note: StickyNote,
  follow_up: MessageCircle,
  visit: UserPlus,
}

const fmtMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

function relativeTime(iso: string, now = Date.now()) {
  const diff = now - new Date(iso).getTime()
  const minutes = Math.round(diff / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

export async function ActivityFeed() {
  const supabase = await createClient()

  const [interactionsRes, paymentsRes, clientsRes] = await Promise.all([
    supabase
      .from("interactions")
      .select(
        `
          id,
          type,
          title,
          occurred_at,
          clients ( name ),
          logged_by:profiles!interactions_logged_by_fkey ( full_name )
        `,
      )
      .order("occurred_at", { ascending: false })
      .limit(8),
    supabase
      .from("payments")
      .select(
        `
          id,
          amount,
          currency,
          status,
          created_at,
          projects ( title, clients ( name ) )
        `,
      )
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("clients")
      .select("id, name, source, status, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ])

  const events: FeedEvent[] = []

  for (const row of interactionsRes.data ?? []) {
    const client = Array.isArray(row.clients) ? row.clients[0] : row.clients
    const actor = Array.isArray(row.logged_by)
      ? row.logged_by[0]
      : row.logged_by
    const actorName = actor?.full_name?.split(/\s+/)[0] ?? "Someone"
    events.push({
      id: `i-${row.id}`,
      kind: "interaction",
      at: row.occurred_at,
      icon: interactionIcons[row.type as InteractionType] ?? StickyNote,
      iconTone: "default",
      title: row.title,
      meta: `${actorName} ▪ ${client?.name ?? "Unknown"}`,
    })
  }

  for (const row of paymentsRes.data ?? []) {
    const project = Array.isArray(row.projects) ? row.projects[0] : row.projects
    const client = project
      ? Array.isArray(project.clients)
        ? project.clients[0]
        : project.clients
      : null
    const isPaid = row.status === "paid" || row.status === "succeeded"
    events.push({
      id: `p-${row.id}`,
      kind: "payment",
      at: row.created_at,
      icon: CreditCard,
      iconTone: isPaid ? "positive" : "default",
      title: `${fmtMoney.format(Number(row.amount))} ▪ ${row.status}`,
      meta: `${project?.title ?? "Project"} ▪ ${client?.name ?? "Unknown"}`,
    })
  }

  for (const row of clientsRes.data ?? []) {
    if (row.status !== "lead" && row.status !== "qualified") continue
    events.push({
      id: `c-${row.id}`,
      kind: "client",
      at: row.created_at,
      icon: UserPlus,
      iconTone: "accent",
      title: `New ${row.status === "qualified" ? "qualified lead" : "lead"}`,
      meta: `${row.name} ▪ via ${row.source.replace(/_/g, " ")}`,
    })
  }

  events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  const top = events.slice(0, 10)

  return (
    <Card className="gap-0 py-0">
      <header className="flex items-center justify-between gap-4 border-b border-border/60 p-6">
        <h2 className="font-heading text-lg font-medium tracking-tight">
          Recent activity
        </h2>
        <p className="text-overline font-medium uppercase tracking-ui text-muted-foreground">
          Last {top.length} events
        </p>
      </header>

      {top.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-xs uppercase tracking-ui text-muted-foreground">
          No activity yet
        </div>
      ) : (
        <ol className="divide-y divide-border/60">
          {top.map((event) => (
            <li
              key={event.id}
              className="flex items-start gap-4 px-6 py-4"
            >
              <div
                className={cn(
                  "mt-0.5 flex size-8 shrink-0 items-center justify-center border border-border/60 text-muted-foreground [&_svg]:size-4",
                  event.iconTone === "positive" && "text-emerald-400",
                  event.iconTone === "accent" && "text-foreground",
                )}
                aria-hidden
              >
                <event.icon />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {event.title}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {event.meta}
                </p>
              </div>
              <p className="shrink-0 text-overline font-medium uppercase tracking-ui text-muted-foreground tabular-nums">
                {relativeTime(event.at)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}

