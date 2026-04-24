import "server-only"

import type { createAdminClient } from "@/lib/supabase/admin"

type AdminClient = ReturnType<typeof createAdminClient>

/**
 * Canonical task titles. The Stripe webhook uses these strings to find and
 * auto-complete template-seeded tasks when the corresponding real-world event
 * happens (deposit paid, subscription activated). Keep in sync with
 * task-templates.ts. If you rename a template task, rename its key here.
 */
export const TASK_TITLES = {
  sendDepositInvoice: "Send Stripe deposit invoice",
  kickoffCall: "Kickoff call",
} as const

/**
 * Mark the first task on a project matching one of the given titles as done.
 * No-op when no match. Picks the next sort_order in the 'done' column so it
 * drops to the end rather than colliding with existing done tasks.
 */
export async function markProjectTaskDoneByTitle(
  supabase: AdminClient,
  projectId: string,
  title: string,
): Promise<void> {
  const { data: task } = await supabase
    .from("project_tasks")
    .select("id")
    .eq("project_id", projectId)
    .eq("title", title)
    .neq("status", "done")
    .limit(1)
    .maybeSingle()
  if (!task) return

  const { data: last } = await supabase
    .from("project_tasks")
    .select("sort_order")
    .eq("project_id", projectId)
    .eq("status", "done")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  const { error } = await supabase
    .from("project_tasks")
    .update({ status: "done", sort_order: (last?.sort_order ?? -1) + 1 })
    .eq("id", task.id)
  if (error) {
    console.error("[task automation] mark done failed", error)
  }
}

/**
 * Append a one-off task to a project's To Do column. Used by the Stripe
 * webhook on subscription events to materialize recurring work on the board.
 * Idempotency: only creates a task when no To Do task with the same title
 * already exists on the project (so a retried webhook won't double-insert).
 */
export async function appendProjectTask(
  supabase: AdminClient,
  input: {
    projectId: string
    title: string
    description?: string | null
    dueInDays?: number
  },
): Promise<void> {
  const { data: existing } = await supabase
    .from("project_tasks")
    .select("id")
    .eq("project_id", input.projectId)
    .eq("title", input.title)
    .eq("status", "todo")
    .limit(1)
    .maybeSingle()
  if (existing) return

  const { data: last } = await supabase
    .from("project_tasks")
    .select("sort_order")
    .eq("project_id", input.projectId)
    .eq("status", "todo")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  const dueDate =
    input.dueInDays != null
      ? new Date(Date.now() + input.dueInDays * 86_400_000)
          .toISOString()
          .slice(0, 10)
      : null

  const { error } = await supabase.from("project_tasks").insert({
    project_id: input.projectId,
    title: input.title,
    description: input.description ?? null,
    status: "todo",
    sort_order: (last?.sort_order ?? -1) + 1,
    due_date: dueDate,
  })
  if (error) {
    console.error("[task automation] append task failed", error)
  }
}

/** "April 2026" in en-US. */
export function formatPeriodMonth(periodStartIso: string | null): string | null {
  if (!periodStartIso) return null
  const d = new Date(periodStartIso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" })
}
