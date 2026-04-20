import { PageHeader } from "@/components/dashboard/page-header"
import { Dot } from "@/components/ui/dot"
import { PipelineBoard } from "@/components/pipeline/pipeline-board"
import {
  formatUsdShort,
  isDepositPending,
  type ProjectRow,
} from "@/components/projects/project-types"
import { createClient } from "@/lib/supabase/server"

// How far back we show terminal (won/lost) cards. Older deals fade off the
// pipeline so the board stays focused on live opportunities.
const TERMINAL_DAYS = 30

export default async function PipelinePage() {
  const supabase = await createClient()

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - TERMINAL_DAYS)
  const cutoffIso = cutoff.toISOString()

  const { data, error } = await supabase
    .from("projects")
    .select(
      `
        id, title, description, stage, value, currency,
        financing_enabled,
        start_date, deadline, completed_at, commission_rate,
        commission_flat, commission_amount, payment_status,
        stripe_checkout_session_id, paid_at, product_type,
        deposit_rate, deposit_amount, deposit_paid_at, created_at,
        client:clients!projects_client_id_fkey (id, name, company),
        rep:profiles!projects_sold_by_fkey (id, full_name)
      `,
    )
    .or(
      `stage.in.(proposal,negotiation),and(stage.in.(active,completed,cancelled),created_at.gte.${cutoffIso})`,
    )
    .order("created_at", { ascending: false })

  if (error) throw error

  const rows: ProjectRow[] = (data ?? []).map((p) => {
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
      commission_rate:
        p.commission_rate != null ? Number(p.commission_rate) : null,
      commission_flat:
        p.commission_flat != null ? Number(p.commission_flat) : null,
      commission_amount:
        p.commission_amount != null ? Number(p.commission_amount) : null,
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
      subscription: null,
    }
  })

  const liveRows = rows.filter(
    (r) => r.stage === "proposal" || r.stage === "negotiation",
  )
  const liveCount = liveRows.length
  const liveValue = liveRows.reduce((sum, r) => sum + (r.value ?? 0), 0)
  const depositPendingCount = liveRows.filter(isDepositPending).length

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pipeline"
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span>{liveCount} open</span>
            <Dot />
            <span>{formatUsdShort(liveValue)} in play</span>
            <Dot />
            <span>{depositPendingCount} deposit pending</span>
          </span>
        }
      />

      <PipelineBoard projects={rows} />
    </div>
  )
}
