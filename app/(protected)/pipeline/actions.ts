"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"

type ProjectStage = Database["public"]["Enums"]["project_stage"]

export type MoveProjectResult = { ok: true } | { ok: false; error: string }

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Stages that are visible in the pipeline. Everything else is terminal and
// either hidden or shown read-only. Legacy `negotiation` rows are still
// draggable so they can be resolved to won/lost.
const DRAGGABLE_FROM: ProjectStage[] = ["proposal", "negotiation"]
const ALLOWED_TARGETS: ProjectStage[] = ["proposal", "active", "cancelled"]

/**
 * Advance a project to a new stage from the pipeline Kanban. Only pre-sale
 * stages are draggable; terminal stages (active/completed/cancelled) stay
 * read-only. The deposit-gate trigger in Postgres enforces that moves to
 * `active` require a paid deposit — we surface that failure as a toast.
 */
export async function moveProjectInPipeline(input: {
  projectId: string
  toStage: ProjectStage
}): Promise<MoveProjectResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  if (!UUID_RE.test(input.projectId)) {
    return { ok: false, error: "Invalid project" }
  }
  if (!ALLOWED_TARGETS.includes(input.toStage)) {
    return { ok: false, error: "Invalid stage" }
  }

  const { data: project, error: loadError } = await supabase
    .from("projects")
    .select("id, stage, client_id, deposit_paid_at, value")
    .eq("id", input.projectId)
    .maybeSingle()
  if (loadError || !project) return { ok: false, error: "Project not found" }

  if (!DRAGGABLE_FROM.includes(project.stage)) {
    return {
      ok: false,
      error: "This deal has left the pipeline — edit it from the project page.",
    }
  }

  if (
    input.toStage === "active" &&
    !project.deposit_paid_at &&
    project.value != null &&
    Number(project.value) > 0
  ) {
    return {
      ok: false,
      error: "Collect the deposit before marking this deal won.",
    }
  }

  const update: {
    stage: ProjectStage
    completed_at?: string | null
  } = { stage: input.toStage }

  const { error } = await supabase
    .from("projects")
    .update(update)
    .eq("id", input.projectId)
  if (error) return { ok: false, error: error.message }

  if (input.toStage === "active" && project.client_id) {
    await supabase
      .from("clients")
      .update({ status: "active_client" })
      .eq("id", project.client_id)
      .in("status", ["lead", "qualified", "archived", "lost"])
  }

  revalidatePath("/pipeline")
  revalidatePath("/projects")
  revalidatePath("/leads")
  revalidatePath("/clients")
  return { ok: true }
}
