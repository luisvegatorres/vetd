"use client"

import { useId, useMemo, useOptimistic, useState, useTransition } from "react"
import { toast } from "sonner"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  closestCorners,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { cn } from "@/lib/utils"
import { formatUsdShort, type ProjectRow } from "@/components/projects/project-types"
import type { Database } from "@/lib/supabase/types"
import { moveProjectInPipeline } from "@/app/(protected)/pipeline/actions"
import { PipelineCard } from "./pipeline-card"

type ProjectStage = Database["public"]["Enums"]["project_stage"]
type PipelineColumnId = "proposal" | "won" | "lost"

type ColumnConfig = {
  id: PipelineColumnId
  label: string
  targetStage: ProjectStage
  readOnly?: boolean
}

const COLUMNS: ColumnConfig[] = [
  { id: "proposal", label: "Proposal", targetStage: "proposal" },
  { id: "won", label: "Won", targetStage: "active" },
  { id: "lost", label: "Lost", targetStage: "cancelled", readOnly: true },
]

function columnForProject(p: ProjectRow): PipelineColumnId | null {
  if (p.stage === "proposal" || p.stage === "negotiation") return "proposal"
  if (p.stage === "active" || p.stage === "completed") return "won"
  if (p.stage === "cancelled") return "lost"
  return null
}

type BoardState = Record<PipelineColumnId, ProjectRow[]>

function groupProjects(rows: ProjectRow[]): BoardState {
  const state: BoardState = {
    proposal: [],
    won: [],
    lost: [],
  }
  for (const row of rows) {
    const col = columnForProject(row)
    if (col) state[col].push(row)
  }
  for (const key of Object.keys(state) as PipelineColumnId[]) {
    state[key].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
  }
  return state
}

type Action =
  | { kind: "move"; projectId: string; toColumn: PipelineColumnId }
  | { kind: "replace"; next: BoardState }

function reducer(state: BoardState, action: Action): BoardState {
  if (action.kind === "replace") return action.next
  const next: BoardState = {
    proposal: [...state.proposal],
    won: [...state.won],
    lost: [...state.lost],
  }
  let moved: ProjectRow | null = null
  for (const key of Object.keys(next) as PipelineColumnId[]) {
    const idx = next[key].findIndex((p) => p.id === action.projectId)
    if (idx >= 0) {
      moved = next[key][idx]
      next[key] = next[key].filter((_, i) => i !== idx)
      break
    }
  }
  if (!moved) return state
  next[action.toColumn] = [moved, ...next[action.toColumn]]
  return next
}

export function PipelineBoard({ projects }: { projects: ProjectRow[] }) {
  const initial = useMemo(() => groupProjects(projects), [projects])
  const [state, dispatch] = useOptimistic(initial, reducer)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const dndId = useId()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const projectIndex = useMemo(() => {
    const map = new Map<
      string,
      { project: ProjectRow; column: PipelineColumnId }
    >()
    for (const key of Object.keys(state) as PipelineColumnId[]) {
      for (const project of state[key]) map.set(project.id, { project, column: key })
    }
    return map
  }, [state])

  function findColumn(id: string): PipelineColumnId | null {
    if ((COLUMNS as { id: string }[]).some((c) => c.id === id)) {
      return id as PipelineColumnId
    }
    return projectIndex.get(id)?.column ?? null
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const activeIdStr = String(active.id)
    const overIdStr = String(over.id)
    const from = projectIndex.get(activeIdStr)?.column
    const to = findColumn(overIdStr)
    if (!from || !to || from === to) return

    const column = COLUMNS.find((c) => c.id === to)
    if (!column) return

    if (from === "won" || from === "lost") {
      toast.error(
        "This deal has left the pipeline — edit it from the project page.",
      )
      return
    }

    const snapshot = state
    const project = projectIndex.get(activeIdStr)?.project
    if (!project) return

    // Optimistic move first so the UI feels snappy.
    startTransition(async () => {
      dispatch({ kind: "move", projectId: activeIdStr, toColumn: to })
      const result = await moveProjectInPipeline({
        projectId: activeIdStr,
        toStage: column.targetStage,
      })
      if (!result.ok) {
        toast.error(result.error)
        dispatch({ kind: "replace", next: snapshot })
      } else if (column.id === "won") {
        toast.success(`${project.client?.company ?? project.client?.name ?? "Deal"} won`)
      }
    })
  }

  const activeProject = activeId
    ? (projectIndex.get(activeId)?.project ?? null)
    : null

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => (
          <PipelineColumn key={col.id} column={col} projects={state[col.id]} />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeProject ? <PipelineCard project={activeProject} dragging /> : null}
      </DragOverlay>
    </DndContext>
  )
}

function PipelineColumn({
  column,
  projects,
}: {
  column: ColumnConfig
  projects: ProjectRow[]
}) {
  const { setNodeRef, isOver } = useSortable({
    id: column.id,
    data: { type: "column" },
  })
  const ids = useMemo(() => projects.map((p) => p.id), [projects])
  const totalValue = projects.reduce(
    (sum, p) => sum + (p.value ? Number(p.value) : 0),
    0,
  )

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-40 flex-col gap-3 border border-border/60 p-3 transition-colors",
        isOver && "border-border bg-muted/30",
      )}
    >
      <div className="flex items-baseline justify-between gap-2 px-1">
        <div className="flex items-baseline gap-2">
          <p className="text-overline font-medium uppercase tracking-wide text-muted-foreground">
            {column.label}
          </p>
          <span className="text-overline font-medium tabular-nums text-muted-foreground">
            {projects.length}
          </span>
        </div>
        {totalValue > 0 ? (
          <span className="text-overline font-medium uppercase tracking-wide tabular-nums text-muted-foreground">
            {formatUsdShort(totalValue)}
          </span>
        ) : null}
      </div>

      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {projects.map((project) => (
            <SortablePipelineCard
              key={project.id}
              project={project}
              readOnly={column.readOnly}
            />
          ))}
          {projects.length === 0 ? (
            <p className="border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
              Drop a deal here
            </p>
          ) : null}
        </div>
      </SortableContext>
    </div>
  )
}

function SortablePipelineCard({
  project,
  readOnly,
}: {
  project: ProjectRow
  readOnly?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: project.id,
    data: { type: "project" },
    disabled: readOnly,
  })

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
      className={readOnly ? undefined : "touch-none"}
    >
      <PipelineCard project={project} readOnly={readOnly} />
    </div>
  )
}
