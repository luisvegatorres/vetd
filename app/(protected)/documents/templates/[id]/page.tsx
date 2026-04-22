import { notFound } from "next/navigation"

import { TemplateEditor } from "@/components/documents/template-editor"
import { isDocumentBody } from "@/lib/documents/blocks"
import { createClient } from "@/lib/supabase/server"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()

  const supabase = await createClient()
  const { data } = await supabase
    .from("document_templates")
    .select("id, name, kind, body, variables, is_active, version")
    .eq("id", id)
    .maybeSingle()

  if (!data) notFound()

  const body = isDocumentBody(data.body) ? data.body : []
  const variables = Array.isArray(data.variables)
    ? (data.variables as string[])
    : []

  return (
    <TemplateEditor
      template={{
        id: data.id,
        name: data.name,
        kind: data.kind,
        body,
        variables,
        isActive: data.is_active,
        version: data.version,
      }}
    />
  )
}
