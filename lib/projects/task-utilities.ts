import type { Database } from "@/lib/supabase/types"

export type TaskStatus = Database["public"]["Enums"]["task_status"]

export type ProjectTaskRow = {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  sort_order: number
  due_date: string | null
  assignee: { id: string; full_name: string | null } | null
}

export type BoardState = Record<TaskStatus, ProjectTaskRow[]>

export type DueFilter = "all" | "overdue" | "soon" | "week" | "none"

export type DueUrgency = "overdue" | "soon" | "upcoming" | null

export const DUE_FILTER_LABEL: Record<DueFilter, string> = {
  all: "Any due date",
  overdue: "Overdue",
  soon: "Due soon",
  week: "This week",
  none: "No due date",
}

const dueFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
})

export function formatDue(due: string | null): string | null {
  if (!due) return null
  const d = new Date(`${due}T00:00:00`)
  if (Number.isNaN(d.getTime())) return null
  return dueFormatter.format(d).toUpperCase()
}

/** Days between today (local midnight) and the due date. null if no date. */
export function daysUntilDue(due: string | null): number | null {
  if (!due) return null
  const [y, m, d] = due.split("-").map(Number)
  if (!y || !m || !d) return null
  const target = new Date(y, m - 1, d).getTime()
  const now = new Date()
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime()
  return Math.round((target - today) / 86_400_000)
}

export function dueUrgency(due: string | null, done: boolean): DueUrgency {
  if (done) return null
  const daysLeft = daysUntilDue(due)
  if (daysLeft == null) return null
  if (daysLeft < 0) return "overdue"
  if (daysLeft <= 2) return "soon"
  return "upcoming"
}

export function matchesDueFilter(
  due: string | null,
  done: boolean,
  filter: DueFilter,
): boolean {
  if (filter === "all") return true
  if (filter === "none") return due == null
  if (done) return false
  const daysLeft = daysUntilDue(due)
  if (daysLeft == null) return false
  if (filter === "overdue") return daysLeft < 0
  if (filter === "soon") return daysLeft >= 0 && daysLeft <= 2
  if (filter === "week") return daysLeft >= 0 && daysLeft <= 7
  return true
}

export function initials(name: string | null): string {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function groupTasks(tasks: ProjectTaskRow[]): BoardState {
  const state: BoardState = { todo: [], doing: [], review: [], done: [] }
  for (const t of tasks) state[t.status].push(t)
  for (const key of Object.keys(state) as TaskStatus[]) {
    state[key].sort((a, b) => a.sort_order - b.sort_order)
  }
  return state
}

export type BoardAction =
  | { kind: "replace"; next: BoardState }
  | { kind: "add"; status: TaskStatus; task: ProjectTaskRow }
  | { kind: "remove"; taskId: string }

export function boardReducer(state: BoardState, action: BoardAction): BoardState {
  if (action.kind === "replace") return action.next
  if (action.kind === "add") {
    return {
      ...state,
      [action.status]: [...state[action.status], action.task],
    }
  }
  if (action.kind === "remove") {
    const next: BoardState = { todo: [], doing: [], review: [], done: [] }
    for (const key of Object.keys(state) as TaskStatus[]) {
      next[key] = state[key].filter((t) => t.id !== action.taskId)
    }
    return next
  }
  return state
}
