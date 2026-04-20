"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { Constants, type Database } from "@/lib/supabase/types"

type TaskStatus = Database["public"]["Enums"]["task_status"]

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const TASK_STATUSES = Constants.public.Enums.task_status as readonly string[]

export type TaskActionResult = { ok: true } | { ok: false; error: string }

function parseStatus(raw: string): TaskStatus {
  return TASK_STATUSES.includes(raw) ? (raw as TaskStatus) : "todo"
}

export async function createProjectTask(input: {
  projectId: string
  title: string
  description?: string | null
  status?: string
  dueDate?: string | null
  assignedTo?: string | null
}): Promise<TaskActionResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  if (!UUID_RE.test(input.projectId)) {
    return { ok: false, error: "Invalid project" }
  }
  const title = input.title.trim()
  if (!title) return { ok: false, error: "Title is required" }

  const status = parseStatus(input.status ?? "todo")

  // Place at end of the target column.
  const { data: last } = await supabase
    .from("project_tasks")
    .select("sort_order")
    .eq("project_id", input.projectId)
    .eq("status", status)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  const sortOrder = (last?.sort_order ?? -1) + 1

  const assignedTo =
    input.assignedTo && UUID_RE.test(input.assignedTo)
      ? input.assignedTo
      : null

  const { error } = await supabase.from("project_tasks").insert({
    project_id: input.projectId,
    title,
    description: input.description?.trim() || null,
    status,
    sort_order: sortOrder,
    due_date: input.dueDate || null,
    assigned_to: assignedTo,
    created_by: auth.user.id,
  })

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/projects/${input.projectId}`)
  return { ok: true }
}

export async function updateProjectTask(input: {
  taskId: string
  projectId: string
  title?: string
  description?: string | null
  status?: string
  dueDate?: string | null
  assignedTo?: string | null
}): Promise<TaskActionResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  if (!UUID_RE.test(input.taskId) || !UUID_RE.test(input.projectId)) {
    return { ok: false, error: "Invalid id" }
  }

  const patch: Database["public"]["Tables"]["project_tasks"]["Update"] = {}
  if (input.title !== undefined) {
    const t = input.title.trim()
    if (!t) return { ok: false, error: "Title is required" }
    patch.title = t
  }
  if (input.description !== undefined) {
    patch.description = input.description?.trim() || null
  }
  if (input.dueDate !== undefined) {
    patch.due_date = input.dueDate || null
  }
  if (input.assignedTo !== undefined) {
    patch.assigned_to =
      input.assignedTo && UUID_RE.test(input.assignedTo)
        ? input.assignedTo
        : null
  }
  if (input.status !== undefined) {
    const nextStatus = parseStatus(input.status)
    patch.status = nextStatus
    // Put it at the end of the new column so existing ordering is preserved.
    const { data: last } = await supabase
      .from("project_tasks")
      .select("sort_order")
      .eq("project_id", input.projectId)
      .eq("status", nextStatus)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle()
    patch.sort_order = (last?.sort_order ?? -1) + 1
  }

  const { error } = await supabase
    .from("project_tasks")
    .update(patch)
    .eq("id", input.taskId)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/projects/${input.projectId}`)
  return { ok: true }
}

export async function deleteProjectTask(input: {
  taskId: string
  projectId: string
}): Promise<TaskActionResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  if (!UUID_RE.test(input.taskId)) {
    return { ok: false, error: "Invalid id" }
  }

  const { error } = await supabase
    .from("project_tasks")
    .delete()
    .eq("id", input.taskId)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/projects/${input.projectId}`)
  return { ok: true }
}

/**
 * Reorder tasks after a drag. The client sends the full new ordering per
 * affected column, and we re-number sort_order and set the destination status
 * in a single batch. Simpler than delta logic and collision-free.
 */
export async function reorderProjectTasks(input: {
  projectId: string
  columns: {
    status: string
    taskIds: string[]
  }[]
}): Promise<TaskActionResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  if (!UUID_RE.test(input.projectId)) {
    return { ok: false, error: "Invalid project" }
  }

  const updates: PromiseLike<{ error: unknown }>[] = []
  for (const col of input.columns) {
    const status = parseStatus(col.status)
    col.taskIds.forEach((taskId, index) => {
      if (!UUID_RE.test(taskId)) return
      updates.push(
        supabase
          .from("project_tasks")
          .update({ status, sort_order: index })
          .eq("id", taskId)
          .eq("project_id", input.projectId),
      )
    })
  }

  const results = await Promise.all(updates)
  const firstError = results.find((r) => r.error)
  if (firstError?.error) {
    const msg =
      typeof firstError.error === "object" &&
      firstError.error &&
      "message" in firstError.error
        ? String((firstError.error as { message: unknown }).message)
        : "Failed to reorder tasks"
    return { ok: false, error: msg }
  }

  revalidatePath(`/projects/${input.projectId}`)
  return { ok: true }
}
