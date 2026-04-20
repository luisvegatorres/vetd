import { PageHeader } from "@/components/dashboard/page-header"
import { Dot } from "@/components/ui/dot"
import { NewProjectDialog } from "@/components/projects/project-form-dialog"
import { ProjectDetailPanel } from "@/components/projects/project-detail-panel"
import { ProjectsPagination } from "@/components/projects/projects-pagination"
import { ProjectsTable } from "@/components/projects/projects-table"
import { ProjectsTabs } from "@/components/projects/projects-tabs"
import {
  ProjectsFilters,
  ProjectsSearch,
} from "@/components/projects/projects-toolbar"
import {
  isDepositPending,
  PRODUCT_TYPE_LABEL,
  type PaymentStatus,
  type ProjectProductType,
  type ProjectRow,
  type ProjectStage,
  type ProjectTab,
} from "@/components/projects/project-types"
import { createClient } from "@/lib/supabase/server"
import { Constants } from "@/lib/supabase/types"

type Sort = "recent" | "value" | "deadline" | "stage"

const PAGE_SIZE = 10

const STAGE_ORDER: Record<ProjectStage, number> = {
  proposal: 0,
  negotiation: 1,
  active: 2,
  completed: 3,
  cancelled: 4,
}

const VALID_TABS: ProjectTab[] = [
  "all",
  "proposal",
  "negotiation",
  "active",
  "completed",
  "cancelled",
]

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function parseTab(v: string | undefined): ProjectTab {
  return v && (VALID_TABS as string[]).includes(v) ? (v as ProjectTab) : "all"
}

function parseSort(v: string | undefined): Sort {
  if (v === "value" || v === "deadline" || v === "stage") return v
  return "recent"
}

function parseProduct(
  v: string | undefined,
): ProjectProductType | "all" {
  if (!v) return "all"
  const types =
    Constants.public.Enums.project_product_type as readonly string[]
  return types.includes(v) ? (v as ProjectProductType) : "all"
}

function parsePayment(v: string | undefined): PaymentStatus | "all" {
  if (!v) return "all"
  const statuses = Constants.public.Enums.payment_status as readonly string[]
  return statuses.includes(v) ? (v as PaymentStatus) : "all"
}

function parsePage(v: string | undefined): number {
  const n = Number(v)
  return Number.isInteger(n) && n >= 1 ? n : 1
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string
    project?: string
    q?: string
    product?: string
    rep?: string
    payment?: string
    sort?: string
    page?: string
  }>
}) {
  const sp = await searchParams
  const tab = parseTab(sp.tab)
  const sort = parseSort(sp.sort)
  const product = parseProduct(sp.product)
  const payment = parsePayment(sp.payment)
  const repFilter = sp.rep && UUID_RE.test(sp.rep) ? sp.rep : "all"
  const q = (sp.q ?? "").trim()
  const page = parsePage(sp.page)
  const projectParam =
    sp.project && UUID_RE.test(sp.project) ? sp.project : null

  const supabase = await createClient()

  const [
    projectsRes,
    clientsRes,
    repsRes,
    paymentsRes,
    interactionsRes,
    subscriptionsRes,
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
          `,
      )
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("id, name, company").order("name"),
    supabase
      .from("profiles")
      .select("id, full_name")
      .in("role", ["admin", "editor", "sales_rep"])
      .order("full_name"),
    supabase.from("payments").select("project_id, amount, status"),
    supabase
      .from("interactions")
      .select("project_id, type, created_at, content")
      .not("project_id", "is", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("subscriptions")
      .select("id, project_id, plan, product, monthly_rate, status, started_at")
      .not("project_id", "is", null),
  ])

  if (projectsRes.error) throw projectsRes.error

  const paymentsByProject = new Map<
    string,
    { amount: number; status: string }[]
  >()
  for (const p of paymentsRes.data ?? []) {
    const list = paymentsByProject.get(p.project_id) ?? []
    list.push({ amount: Number(p.amount), status: p.status })
    paymentsByProject.set(p.project_id, list)
  }

  const interactionsByProject = new Map<
    string,
    { type: ProjectRow["interactions"][number]["type"]; created_at: string; summary: string | null }[]
  >()
  for (const it of interactionsRes.data ?? []) {
    if (!it.project_id) continue
    const list = interactionsByProject.get(it.project_id) ?? []
    list.push({
      type: it.type,
      created_at: it.created_at,
      summary: it.content,
    })
    interactionsByProject.set(it.project_id, list)
  }

  const subscriptionByProject = new Map<
    string,
    NonNullable<ProjectRow["subscription"]>
  >()
  for (const s of subscriptionsRes.data ?? []) {
    if (!s.project_id) continue
    subscriptionByProject.set(s.project_id, {
      id: s.id,
      plan: s.plan,
      product: s.product,
      monthly_rate: Number(s.monthly_rate),
      status: s.status,
      started_at: s.started_at,
    })
  }

  const allRows: ProjectRow[] = (projectsRes.data ?? []).map((p) => {
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
      payments: paymentsByProject.get(p.id) ?? [],
      interactions: interactionsByProject.get(p.id) ?? [],
      subscription: subscriptionByProject.get(p.id) ?? null,
    }
  })

  const ql = q.toLowerCase()
  const filteredBase = allRows.filter((r) => {
    if (product !== "all" && r.product_type !== product) return false
    if (payment !== "all" && r.payment_status !== payment) return false
    if (repFilter !== "all" && r.rep?.id !== repFilter) return false
    if (!ql) return true
    const productLabel = r.product_type
      ? PRODUCT_TYPE_LABEL[r.product_type].toLowerCase()
      : ""
    return (
      r.title.toLowerCase().includes(ql) ||
      (r.client?.name ?? "").toLowerCase().includes(ql) ||
      (r.client?.company ?? "").toLowerCase().includes(ql) ||
      productLabel.includes(ql)
    )
  })

  const counts: Record<ProjectTab, number> = {
    all: filteredBase.length,
    proposal: 0,
    negotiation: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
  }
  for (const row of filteredBase) counts[row.stage] += 1

  const tabFiltered =
    tab === "all"
      ? filteredBase
      : filteredBase.filter((r) => r.stage === tab)

  const sorted = [...tabFiltered].sort((a, b) => {
    if (sort === "value") {
      return (b.value ?? 0) - (a.value ?? 0)
    }
    if (sort === "deadline") {
      const av = a.deadline ? new Date(a.deadline).getTime() : Infinity
      const bv = b.deadline ? new Date(b.deadline).getTime() : Infinity
      return av - bv
    }
    if (sort === "stage") {
      return STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage]
    }
    return (
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  })

  const totalFiltered = sorted.length
  const pageCount = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const startIdx = (currentPage - 1) * PAGE_SIZE
  const visibleRows = sorted.slice(startIdx, startIdx + PAGE_SIZE)

  const selectedId =
    projectParam && sorted.some((r) => r.id === projectParam)
      ? projectParam
      : (visibleRows[0]?.id ?? null)

  const selectedProject = selectedId
    ? (allRows.find((r) => r.id === selectedId) ?? null)
    : null

  const activeCount = allRows.filter((r) => r.stage === "active").length
  const depositPendingCount = allRows.filter((r) => isDepositPending(r)).length

  const clientOptions = (clientsRes.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    company: c.company,
  }))
  const repOptions = (repsRes.data ?? []).map((r) => ({
    id: r.id,
    full_name: r.full_name,
  }))

  function buildRowHref(id: string) {
    const next = new URLSearchParams()
    if (tab !== "all") next.set("tab", tab)
    if (product !== "all") next.set("product", product)
    if (payment !== "all") next.set("payment", payment)
    if (repFilter !== "all") next.set("rep", repFilter)
    if (sort !== "recent") next.set("sort", sort)
    if (q) next.set("q", q)
    if (currentPage > 1) next.set("page", String(currentPage))
    next.set("project", id)
    return `/projects?${next.toString()}`
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Projects"
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span>{activeCount} active</span>
            <Dot />
            <span>{depositPendingCount} deposit pending</span>
            <Dot />
            <span>{totalFiltered} showing</span>
          </span>
        }
        action={
          <NewProjectDialog clients={clientOptions} reps={repOptions} />
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex min-h-0 flex-col border border-border/60">
          <div className="flex flex-wrap items-center gap-3 border-b border-border/60 px-4 py-3">
            <ProjectsTabs active={tab} counts={counts} />
            <div className="ml-auto flex items-center gap-2">
              <ProjectsSearch q={q} />
              <ProjectsFilters
                product={product}
                rep={repFilter}
                payment={payment}
                sort={sort}
                reps={repOptions}
              />
            </div>
          </div>
          <ProjectsTable
            rows={visibleRows}
            selectedId={selectedId}
            buildRowHref={buildRowHref}
          />
          <ProjectsPagination
            page={currentPage}
            pageCount={pageCount}
            total={totalFiltered}
            className="mt-auto"
          />
        </div>
        <ProjectDetailPanel
          project={selectedProject}
          clients={clientOptions}
          reps={repOptions}
        />
      </div>
    </div>
  )
}
