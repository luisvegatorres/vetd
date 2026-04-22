import { PipelineBoard } from "@/components/pipeline/pipeline-board"
import {
  PipelineRangeTabs,
  type PipelineRange,
} from "@/components/pipeline/pipeline-range-tabs"
import { type ProjectRow } from "@/components/projects/project-types"
import { createClient } from "@/lib/supabase/server"

// Loose SQL bound — any terminal deal created within the last 2 years can land
// on the board. The user-facing filter below narrows further by effective won
// date, so this only exists to keep the query from scanning the whole table as
// the CRM ages.
const SQL_TERMINAL_DAYS = 730

function parseRange(value: string | undefined): PipelineRange {
  if (value === "30d" || value === "quarter") return value
  return "month"
}

function terminalCutoff(range: PipelineRange): Date {
  const now = new Date()
  if (range === "30d") {
    const d = new Date(now)
    d.setDate(d.getDate() - 30)
    return d
  }
  if (range === "quarter") {
    const q = Math.floor(now.getMonth() / 3) * 3
    return new Date(now.getFullYear(), q, 1)
  }
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

function effectiveWonAt(row: {
  paid_at: string | null
  deposit_paid_at: string | null
  completed_at: string | null
  created_at: string
}): Date {
  const iso = row.paid_at ?? row.deposit_paid_at ?? row.completed_at ?? row.created_at
  return new Date(iso)
}

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const sp = await searchParams
  const range = parseRange(sp.range)

  const supabase = await createClient()

  const sqlCutoff = new Date()
  sqlCutoff.setDate(sqlCutoff.getDate() - SQL_TERMINAL_DAYS)
  const sqlCutoffIso = sqlCutoff.toISOString()

  const { data, error } = await supabase
    .from("projects")
    .select(
      `
        id, title, description, stage, value, currency,
        financing_enabled,
        start_date, deadline, completed_at,
        payment_status,
        stripe_checkout_session_id, paid_at, product_type,
        deposit_rate, deposit_amount, deposit_paid_at, created_at,
        client:clients!projects_client_id_fkey (id, name, company),
        rep:profiles!projects_sold_by_fkey (id, full_name)
      `,
    )
    .or(
      `stage.in.(proposal,negotiation),and(stage.in.(active,completed,cancelled),created_at.gte.${sqlCutoffIso})`,
    )
    .order("created_at", { ascending: false })

  if (error) throw error

  const uiCutoff = terminalCutoff(range)

  const visible = (data ?? []).filter((p) => {
    if (p.stage === "proposal" || p.stage === "negotiation") return true
    return effectiveWonAt(p) >= uiCutoff
  })

  const projectIds = visible.map((p) => p.id)
  const subscriptionsRes =
    projectIds.length > 0
      ? await supabase
          .from("subscriptions")
          .select(
            "id, project_id, plan, product, monthly_rate, status, started_at, stripe_subscription_id",
          )
          .in("project_id", projectIds)
      : null

  if (subscriptionsRes?.error) throw subscriptionsRes.error

  const subscriptionByProject = new Map<
    string,
    NonNullable<ProjectRow["subscription"]>
  >()
  for (const s of subscriptionsRes?.data ?? []) {
    if (!s.project_id) continue
    subscriptionByProject.set(s.project_id, {
      id: s.id,
      plan: s.plan,
      product: s.product,
      monthly_rate: Number(s.monthly_rate),
      status: s.status,
      started_at: s.started_at,
      stripe_subscription_id: s.stripe_subscription_id,
      payment_count: 0,
      paid_payment_count: 0,
      paid_total: 0,
    })
  }

  const rows: ProjectRow[] = visible
    .map((p) => {
      const clientObj = Array.isArray(p.client) ? p.client[0] : p.client
      const repObj = Array.isArray(p.rep) ? p.rep[0] : p.rep
      return {
        id: p.id,
        title: p.title,
        description: p.description,
        stage: p.stage,
        value: p.value != null ? Number(p.value) : null,
        currency: p.currency,
        financing_enabled: p.financing_enabled,
        start_date: p.start_date,
        deadline: p.deadline,
        completed_at: p.completed_at,
        payment_status: p.payment_status,
        stripe_checkout_session_id: p.stripe_checkout_session_id,
        paid_at: p.paid_at,
        product_type: p.product_type,
        deposit_rate: Number(p.deposit_rate),
        deposit_amount:
          p.deposit_amount != null ? Number(p.deposit_amount) : null,
        deposit_paid_at: p.deposit_paid_at,
        created_at: p.created_at,
        client: clientObj
          ? {
              id: clientObj.id,
              name: clientObj.name,
              company: clientObj.company,
            }
          : null,
        rep: repObj ? { id: repObj.id, full_name: repObj.full_name } : null,
        payments: [],
        interactions: [],
        subscription: subscriptionByProject.get(p.id) ?? null,
      }
    })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <PipelineRangeTabs active={range} />
      </div>

      <PipelineBoard projects={rows} />
    </div>
  )
}
