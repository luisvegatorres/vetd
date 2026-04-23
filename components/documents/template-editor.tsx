"use client"

import { Sparkles } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useRef, useState, useTransition } from "react"
import { toast } from "sonner"

import { saveTemplate } from "@/app/(protected)/documents/actions"
import { BreadcrumbCurrentPortal } from "@/components/layout/breadcrumb-current-portal"
import {
  BodyCodeEditor,
  type BodyEditorHandle,
} from "@/components/documents/body-code-editor"
import { InsertMenu } from "@/components/documents/insert-menu"
import { TemplatePreview } from "@/components/documents/template-preview"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { Switch } from "@/components/ui/switch"
import { type DocumentBody } from "@/lib/documents/blocks"

type TemplateProps = {
  id: string
  name: string
  kind: string
  body: DocumentBody
  variables: string[]
  isActive: boolean
  version: number
}

const KIND_OPTIONS = [
  { value: "proposal", label: "Proposal" },
  { value: "contract", label: "Contract" },
  { value: "sow", label: "Statement of Work" },
  { value: "nda", label: "NDA" },
  { value: "invoice_terms", label: "Invoice terms" },
] as const

const KIND_LABEL = Object.fromEntries(
  KIND_OPTIONS.map((o) => [o.value, o.label]),
) as Record<string, string>

export function TemplateEditor({ template }: { template?: TemplateProps }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isEdit = Boolean(template)
  const initialKind = template?.kind ?? "proposal"

  const initialBody = useMemo(
    () =>
      JSON.stringify(
        template?.body ?? STARTER_BODY_BY_KIND[initialKind] ?? DEFAULT_BODY,
        null,
        2,
      ),
    [template?.body, initialKind],
  )

  const [name, setName] = useState(
    template?.name ?? STARTER_NAME_BY_KIND[initialKind] ?? "",
  )
  const [kind, setKind] = useState<string>(initialKind)
  const [isActive, setIsActive] = useState(template?.isActive ?? true)
  const [body, setBody] = useState(initialBody)
  const editorRef = useRef<BodyEditorHandle | null>(null)

  function handleKindChange(next: string) {
    setKind(next)
    // On NEW templates, swap body + name to the starter for this kind so the
    // user gets relevant scaffolding (and tokens) the moment they pick a
    // kind. On edits, don't clobber the user's template.
    if (isEdit) return
    const starterBody = STARTER_BODY_BY_KIND[next]
    if (starterBody) setBody(JSON.stringify(starterBody, null, 2))
    const starterName = STARTER_NAME_BY_KIND[next]
    if (starterName) setName(starterName)
  }

  function handleSubmit(formData: FormData) {
    setError(null)
    if (template?.id) formData.set("template_id", template.id)
    formData.set("name", name)
    formData.set("kind", kind)
    formData.set("body", body)
    if (isActive) formData.set("is_active", "on")

    startTransition(async () => {
      const res = await saveTemplate(formData)
      if (!res.ok) {
        setError(res.error)
        toast.error(res.error)
        return
      }
      toast.success(isEdit ? "Template saved" : "Template created")
      if (!isEdit) router.push(`/documents/templates/${res.templateId}`)
      else router.refresh()
    })
  }

  return (
    <div className="flex h-[calc(100svh-6.5rem)] flex-col gap-6 md:h-[calc(100svh-8.5rem)]">
      <BreadcrumbCurrentPortal>
        {isEdit ? template!.name : "New template"}
      </BreadcrumbCurrentPortal>

      <form
        action={handleSubmit}
        className="grid min-h-0 flex-1 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]"
      >
        <Card className="flex flex-col overflow-hidden">
          <CardContent className="flex flex-1 flex-col gap-6 overflow-hidden">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project Proposal — {{client.business}}"
              required
            />
            <p className="text-xs text-muted-foreground">
              Tokens like <code>{"{{client.business}}"}</code> are allowed in the
              name — they resolve at render time.
            </p>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="body">Body (structured blocks as JSON)</Label>
              <div className="flex items-center gap-2">
                <InsertMenu editorRef={editorRef} />
                {/* TODO: wire up AI-generated body suggestion */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label="Suggest body with AI"
                >
                  <Sparkles aria-hidden />
                  Suggest
                </Button>
              </div>
            </div>
            <BodyCodeEditor
              ref={editorRef}
              id="body"
              value={body}
              onValueChange={setBody}
            />
            <p className="text-xs text-muted-foreground">
              Array of blocks — <code>heading</code>, <code>paragraph</code>,{" "}
              <code>bullets</code>, <code>kv</code>, <code>divider</code>,{" "}
              <code>spacer</code>, <code>signature</code>.
            </p>
          </div>

          {error ? (
            <p className="text-sm text-destructive-500">{error}</p>
          ) : null}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Create template"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              nativeButton={false}
              render={<Link href="/documents" />}
            >
              Cancel
            </Button>
          </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col overflow-hidden">
          <CardContent className="flex-1 space-y-6 overflow-y-auto">
          <div className="flex flex-col gap-2">
            <Label htmlFor="kind">Kind</Label>
            <Select
              value={kind}
              onValueChange={(v) => handleKindChange(v ?? "proposal")}
            >
              <SelectTrigger id="kind" className="w-full">
                <SelectValue placeholder="Select a kind">
                  {(value) =>
                    value ? (KIND_LABEL[value as string] ?? "") : ""
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Kind</SelectLabel>
                  {KIND_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">
                Reps can use this template to generate documents.
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <TemplatePreview name={name} body={body} />
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

const DEFAULT_BODY: DocumentBody = [
  { type: "heading", level: 1, text: "Untitled" },
  {
    type: "paragraph",
    text: "Prepared for {{client.business}} on {{today_long}}.",
  },
]

const STARTER_NAME_BY_KIND: Record<string, string> = {
  proposal: "Project Proposal",
  contract: "Services Agreement",
  sow: "Statement of Work",
  nda: "Mutual NDA",
  invoice_terms: "Invoice Terms",
}

// Starter scaffolds per kind — dropped into the body when the user picks a
// kind on a NEW template. Intentionally minimal: real content lives in the
// seeded templates or whatever the user writes next.
const STARTER_BODY_BY_KIND: Record<string, DocumentBody> = {
  proposal: [
    { type: "heading", level: 1, text: "Project Proposal" },
    {
      type: "paragraph",
      text: "Prepared for {{client.business}} on {{today_long}}.",
    },
    { type: "heading", level: 2, text: "Scope" },
    { type: "paragraph", text: "{{project.title}} — {{project.description}}" },
    { type: "heading", level: 2, text: "Investment" },
    {
      type: "kv",
      items: [
        { label: "Project total", value: "{{project.value}}" },
        { label: "Deposit", value: "{{project.deposit_amount}}" },
      ],
    },
  ],
  contract: [
    { type: "heading", level: 1, text: "Services Agreement" },
    {
      type: "paragraph",
      text: "Entered into on {{today_long}} between {{company.name}} and {{client.business}}.",
    },
    { type: "heading", level: 2, text: "1. Engagement" },
    { type: "paragraph", text: "{{project.title}} — {{project.description}}" },
    { type: "heading", level: 2, text: "2. Fees" },
    {
      type: "paragraph",
      text: "Total {{project.value}}. Deposit {{project.deposit_amount}} due on signing.",
    },
    { type: "divider" },
    { type: "signature", label: "Client — {{client.name}}" },
    { type: "signature", label: "Provider — {{company.name}}" },
  ],
  sow: [
    { type: "heading", level: 1, text: "Statement of Work" },
    {
      type: "paragraph",
      text: "For {{client.business}} — {{project.title}} ({{today_long}}).",
    },
    { type: "heading", level: 2, text: "Deliverables" },
    { type: "bullets", items: ["…"] },
    { type: "heading", level: 2, text: "Timeline" },
    {
      type: "kv",
      items: [
        { label: "Start", value: "{{project.start_date}}" },
        { label: "Delivery", value: "{{project.deadline}}" },
      ],
    },
  ],
  nda: [
    { type: "heading", level: 1, text: "Mutual Non-Disclosure Agreement" },
    {
      type: "paragraph",
      text: "Entered into on {{today_long}} between {{company.name}} and {{client.business}} (\"Parties\").",
    },
    { type: "heading", level: 2, text: "1. Confidential Information" },
    {
      type: "paragraph",
      text: "Each Party agrees to keep confidential any non-public information shared by the other, and to use it solely to evaluate or perform work under {{project.title}}.",
    },
    { type: "heading", level: 2, text: "2. Term" },
    {
      type: "paragraph",
      text: "This Agreement begins on {{today_long}} and remains in force for two (2) years from that date.",
    },
    { type: "divider" },
    { type: "signature", label: "{{client.business}} — {{client.name}}" },
    { type: "signature", label: "{{company.name}}" },
  ],
  invoice_terms: [
    { type: "heading", level: 1, text: "Invoice Terms" },
    {
      type: "paragraph",
      text: "Applies to invoices issued to {{client.business}} under {{project.title}}.",
    },
    { type: "heading", level: 2, text: "Payment" },
    {
      type: "paragraph",
      text: "Invoices are due net 14. Late balances accrue 1.5% per month.",
    },
  ],
}
