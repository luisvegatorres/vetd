import { notFound, redirect } from "next/navigation"

import { OutreachTemplateEditor } from "@/components/documents/outreach-template-editor"
import { createClient } from "@/lib/supabase/server"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function EditOutreachTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect(`/auth/login?next=/documents/outreach/${id}`)

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle()

  if (profile?.role !== "admin" && profile?.role !== "editor") {
    redirect("/documents")
  }

  const { data: template } = await supabase
    .from("outreach_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (!template) notFound()

  return <OutreachTemplateEditor template={template} />
}
