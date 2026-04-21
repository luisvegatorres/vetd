import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import type { Database } from "@/lib/supabase/types"

import { taskTemplateFor } from "./task-templates"

type ProductType = Database["public"]["Enums"]["project_product_type"]

/**
 * Seed a new project's Kanban board from the product-type template.
 * No-ops if the project already has tasks, so it's safe to call on any
 * project-create path. Uses the admin client so the system-generated tasks
 * land regardless of whether the creator is admin, editor, or the rep on the
 * deal.
 */
export async function seedProjectTasks(input: {
  projectId: string
  productType: ProductType | null
  createdBy: string | null
}): Promise<void> {
  const admin = createAdminClient()

  const { count } = await admin
    .from("project_tasks")
    .select("id", { count: "exact", head: true })
    .eq("project_id", input.projectId)
  if ((count ?? 0) > 0) return

  const template = taskTemplateFor(input.productType)
  if (template.length === 0) return

  const today = new Date()
  const rows = template.map((t, i) => {
    const due =
      t.dueInDays != null
        ? new Date(today.getTime() + t.dueInDays * 86_400_000)
            .toISOString()
            .slice(0, 10)
        : null
    return {
      project_id: input.projectId,
      title: t.title,
      description: t.description ?? null,
      status: "todo" as const,
      sort_order: i,
      due_date: due,
      created_by: input.createdBy,
    }
  })

  await admin.from("project_tasks").insert(rows)
}
