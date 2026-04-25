import { redirect } from "next/navigation"

import { OutreachTemplateEditor } from "@/components/documents/outreach-template-editor"
import { createClient } from "@/lib/supabase/server"

export default async function NewOutreachTemplatePage() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect("/auth/login?next=/documents/outreach/new")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle()

  if (profile?.role !== "admin" && profile?.role !== "editor") {
    redirect("/documents")
  }

  return <OutreachTemplateEditor />
}
