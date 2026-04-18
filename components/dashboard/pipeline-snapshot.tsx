import Link from "next/link"
import { ArrowUpRight, MessageSquarePlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"
import type { Database } from "@/lib/supabase/types"

type Stage = Database["public"]["Enums"]["project_stage"]

const PIPELINE_STAGES: Stage[] = ["proposal", "negotiation", "active"]

const stageLabel: Record<Stage, string> = {
  proposal: "Proposal",
  negotiation: "Negotiation",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
}

const stageToneClass: Record<Stage, string> = {
  proposal: "text-primary",
  negotiation: "text-indigo-400",
  active: "text-emerald-400",
  completed: "text-muted-foreground",
  cancelled: "text-muted-foreground",
}

const stageBarClass: Record<Stage, string> = {
  proposal: "bg-primary",
  negotiation: "bg-indigo-400",
  active: "bg-emerald-400",
  completed: "bg-muted-foreground",
  cancelled: "bg-muted-foreground",
}

const fmtCompact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
})

function money(n: number) {
  return `$${fmtCompact.format(n)}`
}

function daysAgo(iso: string | null, now = Date.now()) {
  if (!iso) return null
  const ms = now - new Date(iso).getTime()
  return Math.max(0, Math.round(ms / 86_400_000))
}

export async function PipelineSnapshot() {
  const supabase = await createClient()

  const [projectsRes, opportunitiesRes] = await Promise.all([
    supabase
      .from("projects")
      .select("stage, value")
      .in("stage", PIPELINE_STAGES),
    supabase
      .from("projects")
      .select(
        `
          id,
          title,
          stage,
          value,
          client_id,
          clients ( name )
        `,
      )
      .in("stage", PIPELINE_STAGES)
      .order("value", { ascending: false, nullsFirst: false })
      .limit(5),
  ])

  const stageTotals: Record<Stage, { count: number; value: number }> = {
    proposal: { count: 0, value: 0 },
    negotiation: { count: 0, value: 0 },
    active: { count: 0, value: 0 },
    completed: { count: 0, value: 0 },
    cancelled: { count: 0, value: 0 },
  }

  for (const row of projectsRes.data ?? []) {
    const stage = row.stage as Stage
    stageTotals[stage].count += 1
    stageTotals[stage].value += Number(row.value ?? 0)
  }

  const totalValue = PIPELINE_STAGES.reduce(
    (sum, s) => sum + stageTotals[s].value,
    0,
  )

  const opportunities = opportunitiesRes.data ?? []
  const clientIds = Array.from(
    new Set(opportunities.map((o) => o.client_id).filter(Boolean) as string[]),
  )

  let lastTouchByClient = new Map<string, string>()
  if (clientIds.length > 0) {
    const { data: touches } = await supabase
      .from("interactions")
      .select("client_id, occurred_at")
      .in("client_id", clientIds)
      .order("occurred_at", { ascending: false })

    for (const row of touches ?? []) {
      if (!lastTouchByClient.has(row.client_id)) {
        lastTouchByClient.set(row.client_id, row.occurred_at)
      }
    }
  }

  return (
    <section className="border border-border/60 bg-card">
      <header className="flex items-center justify-between gap-4 border-b border-border/60 p-6">
        <h2 className="font-heading text-lg font-medium tracking-tight">
          Pipeline &amp; opportunities
        </h2>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/pipeline" />}
        >
          <ArrowUpRight />
          Open pipeline
        </Button>
      </header>

      <div className="grid grid-cols-3 divide-x divide-border/60 border-b border-border/60">
        {PIPELINE_STAGES.map((stage) => {
          const { count, value } = stageTotals[stage]
          const share = totalValue > 0 ? value / totalValue : 0
          return (
            <div key={stage} className="flex flex-col gap-3 p-6">
              <p className="text-overline font-medium uppercase tracking-ui text-muted-foreground">
                {stageLabel[stage]}
              </p>
              <div className="flex items-baseline gap-2">
                <p className="font-heading text-2xl font-medium tracking-tight tabular-nums">
                  {count}
                </p>
                <p className="text-sm text-muted-foreground tabular-nums">
                  {money(value)}
                </p>
              </div>
              <div
                className="h-0.5 bg-border/60"
                aria-hidden
                role="presentation"
              >
                <div
                  className={cn("h-full", stageBarClass[stage])}
                  style={{ width: `${Math.round(share * 100)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-baseline justify-between px-6 pt-5">
        <p className="text-overline font-medium uppercase tracking-ui text-muted-foreground">
          {money(totalValue)} open
        </p>
        <p className="text-overline font-medium uppercase tracking-ui text-muted-foreground">
          By value
        </p>
      </div>

      {opportunities.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-xs uppercase tracking-ui text-muted-foreground">
          No open deals
        </div>
      ) : (
        <ol className="mt-2 flex flex-col divide-y divide-border/60">
          {opportunities.map((o) => {
            const client = Array.isArray(o.clients) ? o.clients[0] : o.clients
            const touch = o.client_id
              ? daysAgo(lastTouchByClient.get(o.client_id) ?? null)
              : null
            const stale = touch != null && touch >= 7
            return (
              <li
                key={o.id}
                className="group flex items-center gap-4 px-6 py-4"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/projects/${o.id}`}
                    className="block hover:underline underline-offset-4"
                  >
                    <p className="truncate text-sm font-medium text-foreground">
                      {o.title}
                    </p>
                  </Link>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span
                      className={cn(
                        "text-overline font-medium uppercase tracking-ui leading-none",
                        stageToneClass[o.stage as Stage],
                      )}
                    >
                      {stageLabel[o.stage as Stage]}
                    </span>
                    <span
                      aria-hidden
                      className="inline-block size-1 shrink-0 bg-border"
                    />
                    <span>{client?.name ?? "Unknown"}</span>
                    <span
                      aria-hidden
                      className="inline-block size-1 shrink-0 bg-border"
                    />
                    <span
                      className={cn(
                        "tabular-nums",
                        stale && "text-orange-500",
                      )}
                    >
                      {touch == null
                        ? "No touches yet"
                        : touch === 0
                          ? "Touched today"
                          : `Last touch ${touch}d ago`}
                    </span>
                  </p>
                </div>
                <p className="shrink-0 text-sm font-medium tabular-nums text-foreground">
                  ${fmtCompact.format(Number(o.value ?? 0))}
                </p>
                <Button
                  size="icon-sm"
                  variant="outline"
                  nativeButton={false}
                  aria-label="Log interaction"
                  render={
                    <Link
                      href={`/clients${o.client_id ? `?log=${o.client_id}` : "?log=1"}`}
                    />
                  }
                >
                  <MessageSquarePlus />
                </Button>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
