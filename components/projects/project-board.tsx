"use client"

import { Calendar, Plus, Trash2 } from "lucide-react"
import { useEffect, useId, useMemo, useOptimistic, useState, useTransition } from "react"
import { toast } from "sonner"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  closestCorners,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
  TASK_LIBRARY,
  type NamedTaskTemplate,
  type TaskTemplateCategory,
} from "@/lib/projects/task-templates"
import { cn } from "@/lib/utils"
import type { Database } from "@/lib/supabase/types"
import {
  createProjectTask,
  deleteProjectTask,
  reorderProjectTasks,
  updateProjectTask,
} from "@/app/(protected)/projects/[id]/actions"

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

type Rep = { id: string; full_name: string | null }

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "To do" },
  { id: "doing", label: "Doing" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
]

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To do",
  doing: "Doing",
  review: "Review",
  done: "Done",
}

const ALL = "__all__"
const NO_TEMPLATE = "__none__"

const TEMPLATE_CATEGORY_LABEL: Record<TaskTemplateCategory, string> = {
  intake: "Intake",
  build: "Build",
  delivery: "Delivery",
  other: "Other",
}

const TEMPLATE_CATEGORY_ORDER: TaskTemplateCategory[] = [
  "intake",
  "build",
  "delivery",
  "other",
]

function groupedTemplates(): [TaskTemplateCategory, NamedTaskTemplate[]][] {
  const buckets: Record<TaskTemplateCategory, NamedTaskTemplate[]> = {
    intake: [],
    build: [],
    delivery: [],
    other: [],
  }
  for (const t of TASK_LIBRARY) buckets[t.category].push(t)
  return TEMPLATE_CATEGORY_ORDER.filter((k) => buckets[k].length > 0).map(
    (k) => [k, buckets[k]],
  )
}

function templateDueDate(t: NamedTaskTemplate): string {
  if (t.dueInDays == null) return ""
  return new Date(Date.now() + t.dueInDays * 86_400_000)
    .toISOString()
    .slice(0, 10)
}

type DueFilter = "all" | "overdue" | "soon" | "week" | "none"

const DUE_FILTER_LABEL: Record<DueFilter, string> = {
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

function formatDue(due: string | null): string | null {
  if (!due) return null
  const d = new Date(`${due}T00:00:00`)
  if (Number.isNaN(d.getTime())) return null
  return dueFormatter.format(d).toUpperCase()
}

type DueUrgency = "overdue" | "soon" | "upcoming" | null

/** Days between today (local midnight) and the due date. null if no date. */
function daysUntilDue(due: string | null): number | null {
  if (!due) return null
  const [y, m, d] = due.split("-").map(Number)
  if (!y || !m || !d) return null
  const target = new Date(y, m - 1, d).getTime()
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  return Math.round((target - today) / 86_400_000)
}

function dueUrgency(due: string | null, done: boolean): DueUrgency {
  if (done) return null
  const daysLeft = daysUntilDue(due)
  if (daysLeft == null) return null
  if (daysLeft < 0) return "overdue"
  if (daysLeft <= 2) return "soon"
  return "upcoming"
}

function matchesDueFilter(
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

function initials(name: string | null): string {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

type BoardState = Record<TaskStatus, ProjectTaskRow[]>

function groupTasks(tasks: ProjectTaskRow[]): BoardState {
  const state: BoardState = { todo: [], doing: [], review: [], done: [] }
  for (const t of tasks) state[t.status].push(t)
  for (const key of Object.keys(state) as TaskStatus[]) {
    state[key].sort((a, b) => a.sort_order - b.sort_order)
  }
  return state
}

type Action =
  | { kind: "replace"; next: BoardState }
  | { kind: "add"; status: TaskStatus; task: ProjectTaskRow }
  | { kind: "remove"; taskId: string }

function reducer(state: BoardState, action: Action): BoardState {
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

type EditorState =
  | { mode: "closed" }
  | { mode: "create"; defaultStatus: TaskStatus }
  | { mode: "edit"; task: ProjectTaskRow }

export function ProjectBoard({
  projectId,
  tasks,
  reps,
  currentUserId,
}: {
  projectId: string
  tasks: ProjectTaskRow[]
  reps: Rep[]
  currentUserId: string | null
}) {
  const initial = useMemo(() => groupTasks(tasks), [tasks])
  const [state, dispatch] = useOptimistic(initial, reducer)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [editor, setEditor] = useState<EditorState>({ mode: "closed" })
  const [assigneeFilter, setAssigneeFilter] = useState<string>(ALL)
  const [dueFilter, setDueFilter] = useState<DueFilter>("all")
  const [, startTransition] = useTransition()
  const dndId = useId()

  const filteredState = useMemo<BoardState>(() => {
    if (assigneeFilter === ALL && dueFilter === "all") return state
    const out: BoardState = { todo: [], doing: [], review: [], done: [] }
    for (const key of Object.keys(state) as TaskStatus[]) {
      out[key] = state[key].filter((t) => {
        if (assigneeFilter !== ALL) {
          if (t.assignee?.id !== assigneeFilter) return false
        }
        return matchesDueFilter(t.due_date, key === "done", dueFilter)
      })
    }
    return out
  }, [state, assigneeFilter, dueFilter])

  const filteredCount =
    filteredState.todo.length +
    filteredState.doing.length +
    filteredState.review.length +
    filteredState.done.length
  const isFiltered = assigneeFilter !== ALL || dueFilter !== "all"

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  )

  const taskIndex = useMemo(() => {
    const map = new Map<string, { task: ProjectTaskRow; status: TaskStatus }>()
    for (const key of Object.keys(state) as TaskStatus[]) {
      for (const task of state[key]) map.set(task.id, { task, status: key })
    }
    return map
  }, [state])

  const totalCount = tasks.length

  function findContainer(id: string): TaskStatus | null {
    if ((COLUMNS as { id: string }[]).some((c) => c.id === id)) {
      return id as TaskStatus
    }
    return taskIndex.get(id)?.status ?? null
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return
    const activeIdStr = String(active.id)
    const overIdStr = String(over.id)
    const from = findContainer(activeIdStr)
    const to = findContainer(overIdStr)
    if (!from || !to || from === to) return

    startTransition(() => {
      const activeItem = state[from].find((t) => t.id === activeIdStr)
      if (!activeItem) return
      const fromList = state[from].filter((t) => t.id !== activeIdStr)
      const toList = [...state[to]]
      const overIndex = toList.findIndex((t) => t.id === overIdStr)
      const insertAt = overIndex >= 0 ? overIndex : toList.length
      toList.splice(insertAt, 0, { ...activeItem, status: to })
      dispatch({
        kind: "replace",
        next: { ...state, [from]: fromList, [to]: toList },
      })
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const activeIdStr = String(active.id)
    const overIdStr = String(over.id)
    const from = taskIndex.get(activeIdStr)?.status
    const to = findContainer(overIdStr)
    if (!from || !to) return

    let nextState = state
    if (from === to) {
      const col = state[from]
      const oldIndex = col.findIndex((t) => t.id === activeIdStr)
      const newIndex = col.findIndex((t) => t.id === overIdStr)
      if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
        nextState = { ...state, [from]: arrayMove(col, oldIndex, newIndex) }
        startTransition(() => {
          dispatch({ kind: "replace", next: nextState })
        })
      }
    }

    const payload = (COLUMNS.map((c) => c.id) as TaskStatus[]).map(
      (status) => ({
        status,
        taskIds: nextState[status].map((t) => t.id),
      }),
    )

    startTransition(async () => {
      const result = await reorderProjectTasks({ projectId, columns: payload })
      if (!result.ok) {
        toast.error(result.error)
      }
    })
  }

  function handleDelete(taskId: string) {
    const snapshot = state
    startTransition(async () => {
      dispatch({ kind: "remove", taskId })
      const result = await deleteProjectTask({ taskId, projectId })
      if (!result.ok) {
        toast.error(result.error)
        dispatch({ kind: "replace", next: snapshot })
      }
    })
  }

  const activeTask = activeId ? taskIndex.get(activeId)?.task ?? null : null

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <p className="text-overline font-medium uppercase text-muted-foreground">
            Board
          </p>
          {totalCount > 0 ? (
            <span className="text-xs tabular-nums text-muted-foreground">
              {isFiltered
                ? `${filteredCount} of ${totalCount}`
                : `${totalCount} ${totalCount === 1 ? "task" : "tasks"}`}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={assigneeFilter}
            onValueChange={(v) => setAssigneeFilter(v ?? ALL)}
          >
            <SelectTrigger size="sm" className="min-w-36">
              <SelectValue>
                {(v) => {
                  if (!v || v === ALL) return "Anyone"
                  return reps.find((r) => r.id === v)?.full_name ?? "Anyone"
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Assignee</SelectLabel>
                <SelectItem value={ALL}>Anyone</SelectItem>
                {reps.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.full_name ?? "Unnamed"}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select
            value={dueFilter}
            onValueChange={(v) => setDueFilter((v as DueFilter) ?? "all")}
          >
            <SelectTrigger size="sm" className="min-w-36">
              <SelectValue>
                {(v) => DUE_FILTER_LABEL[(v as DueFilter) ?? "all"]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Due</SelectLabel>
                {(Object.keys(DUE_FILTER_LABEL) as DueFilter[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {DUE_FILTER_LABEL[k]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {isFiltered ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAssigneeFilter(ALL)
                setDueFilter("all")
              }}
            >
              Clear
            </Button>
          ) : null}
        </div>
      </div>

      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => (
            <BoardColumn
              key={col.id}
              status={col.id}
              label={col.label}
              tasks={filteredState[col.id]}
              onAdd={() =>
                setEditor({ mode: "create", defaultStatus: col.id })
              }
              onOpen={(task) => setEditor({ mode: "edit", task })}
              onDelete={handleDelete}
            />
          ))}
        </div>
        <DragOverlay dropAnimation={null}>
          {activeTask ? <TaskCard task={activeTask} dragging /> : null}
        </DragOverlay>
      </DndContext>

      <TaskDialog
        state={editor}
        projectId={projectId}
        reps={reps}
        currentUserId={currentUserId}
        onClose={() => setEditor({ mode: "closed" })}
        onDelete={handleDelete}
      />
    </section>
  )
}

function BoardColumn({
  status,
  label,
  tasks,
  onAdd,
  onOpen,
  onDelete,
}: {
  status: TaskStatus
  label: string
  tasks: ProjectTaskRow[]
  onAdd: () => void
  onOpen: (task: ProjectTaskRow) => void
  onDelete: (id: string) => void
}) {
  const { setNodeRef, isOver } = useSortable({
    id: status,
    data: { type: "column" },
  })
  const ids = useMemo(() => tasks.map((t) => t.id), [tasks])

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-40 flex-col gap-3 border border-border/60 p-3 transition-colors",
        isOver && "border-border bg-muted/30",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-baseline gap-2">
          <p className="text-overline font-medium uppercase text-muted-foreground">
            {label}
          </p>
          <span className="text-xs tabular-nums text-muted-foreground">
            {tasks.length}
          </span>
        </div>
      </div>

      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onOpen={onOpen}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>

      <Button
        variant="ghost"
        size="sm"
        className="justify-start gap-2 text-muted-foreground hover:text-foreground"
        onClick={onAdd}
      >
        <Plus aria-hidden /> Add task
      </Button>
    </div>
  )
}

function SortableTaskCard({
  task,
  onOpen,
  onDelete,
}: {
  task: ProjectTaskRow
  onOpen: (task: ProjectTaskRow) => void
  onDelete: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: "task" } })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none"
    >
      <TaskCard task={task} onOpen={onOpen} onDelete={onDelete} />
    </div>
  )
}

function TaskCard({
  task,
  onOpen,
  onDelete,
  dragging,
}: {
  task: ProjectTaskRow
  onOpen?: (task: ProjectTaskRow) => void
  onDelete?: (id: string) => void
  dragging?: boolean
}) {
  const due = formatDue(task.due_date)
  const done = task.status === "done"
  const urgency = dueUrgency(task.due_date, done)

  return (
    <div
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={(e) => {
        if (!onOpen) return
        // Let dnd-kit handle drag; only treat as click if no drag movement.
        e.stopPropagation()
        onOpen(task)
      }}
      onKeyDown={(e) => {
        if (!onOpen) return
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onOpen(task)
        }
      }}
      className={cn(
        "group flex flex-col border bg-card p-3 text-sm outline-none focus-visible:border-ring",
        urgency === "overdue"
          ? "border-destructive/60"
          : urgency === "soon"
            ? "border-orange-500/60 dark:border-orange-400/60"
            : "border-border/60",
        dragging && "cursor-grabbing",
        !dragging && "cursor-grab hover:border-border",
      )}
    >
      <div className="flex items-start gap-2">
        <p
          className={cn(
            "flex-1 leading-snug",
            done && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </p>
        {onDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Delete task"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(task.id)
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            className="size-6 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
          >
            <Trash2 aria-hidden />
          </Button>
        ) : null}
      </div>
      {task.description ? (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {task.description}
        </p>
      ) : null}
      {due || task.assignee ? (
        <div className="mt-4 flex items-center justify-between gap-2">
          {due ? (
            <Badge variant="outline" className="tabular-nums">
              <Calendar aria-hidden />
              {due}
            </Badge>
          ) : (
            <span />
          )}
          {task.assignee ? (
            <span
              className="inline-flex size-5 items-center justify-center bg-muted text-xs font-medium uppercase text-muted-foreground"
              title={task.assignee.full_name ?? ""}
            >
              {initials(task.assignee.full_name)}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function TaskDialog({
  state,
  projectId,
  reps,
  currentUserId,
  onClose,
  onDelete,
}: {
  state: EditorState
  projectId: string
  reps: Rep[]
  currentUserId: string | null
  onClose: () => void
  onDelete: (id: string) => void
}) {
  const open = state.mode !== "closed"
  const editing = state.mode === "edit"

  // Default assignee is the current user (rep-self-assign) when they're in the
  // reps list; otherwise the first rep; otherwise "" (form won't submit until
  // they pick one — required).
  const defaultAssignee =
    currentUserId && reps.some((r) => r.id === currentUserId)
      ? currentUserId
      : (reps[0]?.id ?? "")

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<TaskStatus>("todo")
  const [dueDate, setDueDate] = useState<string>("")
  const [assignee, setAssignee] = useState<string>("")
  const [templateId, setTemplateId] = useState<string>(NO_TEMPLATE)
  const [isPending, startTransition] = useTransition()

  const templateGroups = useMemo(() => groupedTemplates(), [])

  // Sync form fields when the dialog opens / target task changes.
  useEffect(() => {
    if (state.mode === "closed") return
    if (state.mode === "create") {
      setTitle("")
      setDescription("")
      setStatus(state.defaultStatus)
      setDueDate("")
      setAssignee(defaultAssignee)
      setTemplateId(NO_TEMPLATE)
    } else {
      setTitle(state.task.title)
      setDescription(state.task.description ?? "")
      setStatus(state.task.status)
      setDueDate(state.task.due_date ?? "")
      // Fall back to the current user for legacy tasks that predate the
      // "assignee required" rule.
      setAssignee(state.task.assignee?.id ?? defaultAssignee)
    }
  }, [state, defaultAssignee])

  function applyTemplate(id: string) {
    setTemplateId(id)
    if (id === NO_TEMPLATE) return
    const template = TASK_LIBRARY.find((t) => t.id === id)
    if (!template) return
    setTitle(template.title)
    setDescription(template.description ?? "")
    setDueDate(templateDueDate(template))
  }

  function handleOpenChange(next: boolean) {
    if (!next && !isPending) onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = title.trim()
    if (!value) {
      toast.error("Title is required")
      return
    }
    if (!assignee) {
      toast.error("Pick an assignee")
      return
    }
    const assignedTo = assignee
    const due = dueDate || null

    startTransition(async () => {
      if (state.mode === "create") {
        const result = await createProjectTask({
          projectId,
          title: value,
          description: description || null,
          status,
          dueDate: due,
          assignedTo,
        })
        if (result.ok) {
          toast.success("Task added")
          onClose()
        } else {
          toast.error(result.error)
        }
      } else if (state.mode === "edit") {
        const result = await updateProjectTask({
          taskId: state.task.id,
          projectId,
          title: value,
          description: description || null,
          status,
          dueDate: due,
          assignedTo,
        })
        if (result.ok) {
          toast.success("Task updated")
          onClose()
        } else {
          toast.error(result.error)
        }
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit task" : "New task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editing ? (
            <div className="space-y-2">
              <Label htmlFor="task-template">Template</Label>
              <Select
                value={templateId}
                onValueChange={(v) => applyTemplate(v ?? NO_TEMPLATE)}
                disabled={isPending}
              >
                <SelectTrigger id="task-template" className="w-full">
                  <SelectValue>
                    {(v) => {
                      if (!v || v === NO_TEMPLATE) return "Start from blank"
                      return (
                        TASK_LIBRARY.find((t) => t.id === v)?.label ??
                        "Start from blank"
                      )
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Template</SelectLabel>
                    <SelectItem value={NO_TEMPLATE}>Start from blank</SelectItem>
                  </SelectGroup>
                  {templateGroups.map(([category, items]) => (
                    <SelectGroup key={category}>
                      <SelectLabel>
                        {TEMPLATE_CATEGORY_LABEL[category]}
                      </SelectLabel>
                      {items.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add context, acceptance criteria, links…"
              rows={3}
              disabled={isPending}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="task-status">Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as TaskStatus)}
                disabled={isPending}
              >
                <SelectTrigger id="task-status" className="w-full">
                  <SelectValue>
                    {(v) => STATUS_LABEL[v as TaskStatus] ?? ""}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Column</SelectLabel>
                    {COLUMNS.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due">Due date</Label>
              <DatePicker
                id="task-due"
                value={dueDate}
                onValueChange={setDueDate}
                placeholder="No due date"
                disabled={isPending}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="task-assignee">Assignee</Label>
              <Select
                value={assignee}
                onValueChange={(v) => setAssignee(v ?? "")}
                disabled={isPending}
              >
                <SelectTrigger id="task-assignee" className="w-full">
                  <SelectValue>
                    {(v) => {
                      if (!v) return "Pick an assignee"
                      const rep = reps.find((r) => r.id === v)
                      return rep?.full_name ?? "Pick an assignee"
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Rep</SelectLabel>
                    {reps.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.full_name ?? "Unnamed"}
                        {r.id === currentUserId ? " (me)" : ""}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="justify-between sm:justify-between">
            {editing && state.mode === "edit" ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-2 text-destructive hover:text-destructive"
                onClick={() => {
                  onDelete(state.task.id)
                  onClose()
                }}
                disabled={isPending}
              >
                <Trash2 aria-hidden /> Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <DialogClose render={<Button variant="outline" type="button" />}>
                Cancel
              </DialogClose>
              <Button type="submit" disabled={isPending} className="gap-2">
                {isPending ? (
                  <>
                    <Spinner />
                    Saving…
                  </>
                ) : editing ? (
                  "Save"
                ) : (
                  "Add task"
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
