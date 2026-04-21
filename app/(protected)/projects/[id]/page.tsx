import { notFound } from "next/navigation"

import {
  ProjectDetailView,
  type SubscriptionInvoiceRow,
} from "@/components/projects/project-detail-view"
import type { ProjectTaskRow } from "@/components/projects/project-board"
import type { ProjectRow } from "@/components/projects/project-types"
import { createClient } from "@/lib/supabase/server"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()

  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const currentUserId = authData.user?.id ?? null

  const [
    projectRes,
    clientsRes,
    repsRes,
    paymentsRes,
    interactionsRes,
    subscriptionRes,
    tasksRes,
  ] = await Promise.all([
    supabase
      .from("projects")
      .select(
        `
          id, title, description, stage, value, currency,
          financing_enabled,
          start_date, deadline, completed_at, commission_rate,
          commission_flat, commission_amount, payment_status, stripe_checkout_session_id,
          paid_at, product_type, deposit_rate, deposit_amount,
          deposit_paid_at, created_at,
          client:clients!projects_client_id_fkey (id, name, company),
          rep:profiles!projects_sold_by_fkey (id, full_name)
        `
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("clients").select("id, name, company").order("name"),
    supabase
      .from("profiles")
      .select("id, full_name")
      .in("role", ["admin", "editor", "sales_rep"])
      .order("full_name"),
    supabase.from("payments").select("amount, status").eq("project_id", id),
    supabase
      .from("interactions")
      .select("type, created_at, content")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("subscriptions")
      .select(
        "id, plan, product, monthly_rate, status, started_at, stripe_subscription_id"
      )
      .eq("project_id", id)
      .maybeSingle(),
    supabase
      .from("project_tasks")
      .select(
        `
          id, title, description, status, sort_order, due_date,
          assignee:profiles!project_tasks_assigned_to_fkey (id, full_name)
        `
      )
      .eq("project_id", id)
      .order("status")
      .order("sort_order"),
  ])

  if (projectRes.error) throw projectRes.error
  if (!projectRes.data) notFound()

  const invoicesRes = subscriptionRes.data
    ? await supabase
        .from("subscription_invoices")
        .select(
          "id, amount_paid, currency, status, billing_reason, period_start, period_end, paid_at, created_at"
        )
        .eq("subscription_id", subscriptionRes.data.id)
        .order("created_at", { ascending: false })
    : null

  const p = projectRes.data
  const clientObj = Array.isArray(p.client) ? p.client[0] : p.client
  const repObj = Array.isArray(p.rep) ? p.rep[0] : p.rep

  const project: ProjectRow = {
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
    deposit_amount: p.deposit_amount != null ? Number(p.deposit_amount) : null,
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
    payments: (paymentsRes.data ?? []).map((r) => ({
      amount: Number(r.amount),
      status: r.status,
    })),
    interactions: (interactionsRes.data ?? []).map((r) => ({
      type: r.type,
      created_at: r.created_at,
      summary: r.content,
    })),
    subscription: subscriptionRes.data
      ? {
          id: subscriptionRes.data.id,
          plan: subscriptionRes.data.plan,
          product: subscriptionRes.data.product,
          monthly_rate: Number(subscriptionRes.data.monthly_rate),
          status: subscriptionRes.data.status,
          started_at: subscriptionRes.data.started_at,
          stripe_subscription_id: subscriptionRes.data.stripe_subscription_id,
          payment_count: invoicesRes?.data?.length ?? 0,
          paid_payment_count:
            invoicesRes?.data?.filter((r) => r.status === "paid").length ?? 0,
          paid_total: (invoicesRes?.data ?? []).reduce(
            (sum, r) =>
              r.status === "paid" ? sum + Number(r.amount_paid) : sum,
            0
          ),
        }
      : null,
  }

  const clientOptions = (clientsRes.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    company: c.company,
  }))
  const repOptions = (repsRes.data ?? []).map((r) => ({
    id: r.id,
    full_name: r.full_name,
  }))

  const invoices: SubscriptionInvoiceRow[] = (invoicesRes?.data ?? []).map(
    (r) => ({
      id: r.id,
      amount_paid: Number(r.amount_paid),
      currency: r.currency,
      status: r.status,
      billing_reason: r.billing_reason,
      period_start: r.period_start,
      period_end: r.period_end,
      paid_at: r.paid_at,
      created_at: r.created_at,
    })
  )

  const tasks: ProjectTaskRow[] = (tasksRes.data ?? []).map((t) => {
    const assigneeObj = Array.isArray(t.assignee) ? t.assignee[0] : t.assignee
    return {
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      sort_order: t.sort_order,
      due_date: t.due_date,
      assignee: assigneeObj
        ? { id: assigneeObj.id, full_name: assigneeObj.full_name }
        : null,
    }
  })

  return (
    <ProjectDetailView
      project={project}
      clients={clientOptions}
      reps={repOptions}
      invoices={invoices}
      tasks={tasks}
      currentUserId={currentUserId}
    />
  )
}
