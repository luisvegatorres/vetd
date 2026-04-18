"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export async function convertLeadToDeal(clientId: string) {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error("Not authenticated")

  const { data: lead, error: leadError } = await supabase
    .from("clients")
    .select("name, company, intent")
    .eq("id", clientId)
    .single()
  if (leadError || !lead) throw new Error(leadError?.message ?? "Lead not found")

  const title =
    lead.intent?.trim() ||
    [lead.company, lead.name].filter(Boolean).join(" · ") ||
    "New deal"

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      client_id: clientId,
      title,
      stage: "proposal",
      sold_by: auth.user.id,
    })
    .select("id")
    .single()
  if (projectError || !project)
    throw new Error(projectError?.message ?? "Failed to create project")

  await supabase
    .from("clients")
    .update({ status: "qualified" })
    .eq("id", clientId)

  revalidatePath("/leads")
  revalidatePath("/pipeline")
  redirect(`/pipeline?project=${project.id}`)
}

export async function claimLead(clientId: string) {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error("Not authenticated")

  const { error } = await supabase
    .from("clients")
    .update({ assigned_to: auth.user.id })
    .eq("id", clientId)
  if (error) throw new Error(error.message)

  revalidatePath("/leads")
}
