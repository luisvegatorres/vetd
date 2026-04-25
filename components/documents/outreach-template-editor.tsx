"use client"

import { ArrowLeft, Save, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useId, useRef, useState, useTransition } from "react"
import { toast } from "sonner"

import {
  archiveOutreachTemplate,
  createOutreachTemplate,
  restoreOutreachTemplate,
  updateOutreachTemplate,
} from "@/app/(protected)/documents/outreach/actions"
import {
  OutreachBodyEditor,
  type OutreachBodyEditorHandle,
} from "@/components/documents/outreach-body-editor"
import { OutreachInsertMenu } from "@/components/documents/outreach-insert-menu"
import { OutreachTemplatePreview } from "@/components/documents/outreach-template-preview"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Database } from "@/lib/supabase/types"

type OutreachTemplate =
  Database["public"]["Tables"]["outreach_templates"]["Row"]

type Props = {
  template?: OutreachTemplate
}

export function OutreachTemplateEditor({ template }: Props) {
  const router = useRouter()
  const isEditing = Boolean(template)
  const formId = useId()

  const [businessType, setBusinessType] = useState(
    template?.business_type ?? ""
  )
  const [label, setLabel] = useState(template?.label ?? "")
  const [subject, setSubject] = useState(template?.subject ?? "")
  const [body, setBody] = useState(template?.body ?? "")
  const [referenceUrl, setReferenceUrl] = useState(
    template?.reference_url ?? ""
  )
  const [referenceLabel, setReferenceLabel] = useState(
    template?.reference_label ?? ""
  )
  const [sortOrder, setSortOrder] = useState(String(template?.sort_order ?? 0))

  const subjectRef = useRef<HTMLInputElement>(null)
  const bodyEditorRef = useRef<OutreachBodyEditorHandle>(null)
  const [activeField, setActiveField] = useState<"subject" | "body">("body")

  const [isSaving, startSave] = useTransition()
  const [isArchiving, startArchive] = useTransition()

  function insertToken(snippet: string) {
    if (activeField === "body") {
      bodyEditorRef.current?.insertAtCursor(snippet)
      return
    }
    const target = subjectRef.current
    if (!target) {
      setSubject(subject + snippet)
      return
    }
    const start = target.selectionStart ?? subject.length
    const end = target.selectionEnd ?? subject.length
    setSubject(subject.slice(0, start) + snippet + subject.slice(end))
    requestAnimationFrame(() => {
      target.focus()
      const caret = start + snippet.length
      target.setSelectionRange(caret, caret)
    })
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fd = new FormData(event.currentTarget)
    startSave(async () => {
      const result = template
        ? await updateOutreachTemplate(template.id, fd)
        : await createOutreachTemplate(fd)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(isEditing ? "Template updated" : "Template created")
      if (!isEditing) {
        router.push(`/documents/outreach/${result.templateId}`)
      } else {
        router.refresh()
      }
    })
  }

  function handleArchive() {
    if (!template) return
    startArchive(async () => {
      const result = template.is_archived
        ? await restoreOutreachTemplate(template.id)
        : await archiveOutreachTemplate(template.id)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(
        template.is_archived ? "Template restored" : "Template archived"
      )
      router.push("/documents")
      router.refresh()
    })
  }

  return (
    <div className="flex h-[calc(100svh-6.5rem)] flex-col gap-6 md:h-[calc(100svh-8.5rem)]">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          nativeButton={false}
          render={<Link href="/documents" />}
          className="gap-2"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Back to documents
        </Button>
        {isEditing ? (
          <Button
            variant="outline"
            type="button"
            onClick={handleArchive}
            disabled={isArchiving}
            className="gap-2"
          >
            <Trash2 aria-hidden className="size-4" />
            {template?.is_archived ? "Restore" : "Archive"}
          </Button>
        ) : null}
      </div>

      <form
        id={formId}
        onSubmit={handleSubmit}
        className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)]"
      >
        <div className="flex min-h-0 flex-col gap-6">
          <div className="space-y-5 border border-border/60 p-6">
            <div className="space-y-2">
              <Label htmlFor={`${formId}-label`}>Label</Label>
              <Input
                id={`${formId}-label`}
                name="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Vacation Rental Hosts (Airbnb / VRBO)"
                required
                maxLength={120}
              />
              <p className="text-xs text-muted-foreground">
                How this template appears in the picker on the Leads page.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-[2fr_1fr]">
              <div className="space-y-2">
                <Label htmlFor={`${formId}-business_type`}>Business type</Label>
                <Input
                  id={`${formId}-business_type`}
                  name="business_type"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  placeholder="vacation_rental"
                  required
                  maxLength={80}
                />
                <p className="text-xs text-muted-foreground">
                  Lowercase, snake_case. Used to fuzzy-match against a
                  lead&apos;s industry. Common: vacation_rental, restaurant,
                  fitness, professional_services, trades.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${formId}-sort_order`}>Sort order</Label>
                <Input
                  id={`${formId}-sort_order`}
                  name="sort_order"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-5 border border-border/60 p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={`${formId}-subject`}>Subject</Label>
                <div className="flex items-center gap-2">
                  <OutreachInsertMenu onInsert={insertToken} />
                  <Button type="submit" disabled={isSaving} className="gap-2">
                    <Save aria-hidden className="size-4" />
                    {isSaving
                      ? "Saving…"
                      : isEditing
                        ? "Save changes"
                        : "Create template"}
                  </Button>
                </div>
              </div>
              <Input
                ref={subjectRef}
                id={`${formId}-subject`}
                name="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onFocus={() => setActiveField("subject")}
                placeholder="A direct-booking site for {{client.business}}"
                required
                maxLength={200}
              />
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <Label htmlFor={`${formId}-body`}>Body</Label>
              <input type="hidden" name="body" value={body} />
              <OutreachBodyEditor
                ref={bodyEditorRef}
                value={body}
                onValueChange={setBody}
                onFocus={() => setActiveField("body")}
                placeholder="Hi {{client.name_first}}, …"
              />
              <p className="text-xs text-muted-foreground">
                Separate paragraphs with a blank line. Tokens use the same{" "}
                <code>{"{{token}}"}</code> grammar as document templates.{" "}
                <code>{"{{outreach.link_text}}"}</code> renders as a clickable
                link using the reference label below (defaulting to &quot;Click
                here&quot;). Legacy <code>{"{leadFirstName}"}</code>,{" "}
                <code>{"{businessName}"}</code>, and{" "}
                <code>{"{referenceLink}"}</code> still work for older templates.
              </p>
            </div>
          </div>

          <div className="space-y-5 border border-border/60 p-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`${formId}-reference_url`}>Reference URL</Label>
                <Input
                  id={`${formId}-reference_url`}
                  name="reference_url"
                  type="url"
                  value={referenceUrl}
                  onChange={(e) => setReferenceUrl(e.target.value)}
                  placeholder="https://example.com"
                  maxLength={500}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${formId}-reference_label`}>
                  Reference label
                </Label>
                <Input
                  id={`${formId}-reference_label`}
                  name="reference_label"
                  value={referenceLabel}
                  onChange={(e) => setReferenceLabel(e.target.value)}
                  placeholder="Boutique Homes"
                  maxLength={120}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              The default live-site reference for this business type. The
              reference label is the clickable text that appears in the email
              (defaults to &quot;Click here&quot; if blank). Reps can override
              both per send.
            </p>
          </div>
        </div>

        <aside className="flex min-h-0 flex-col overflow-hidden">
          <OutreachTemplatePreview
            subject={subject}
            body={body}
            referenceUrl={referenceUrl}
            referenceLabel={referenceLabel}
          />
        </aside>
      </form>
    </div>
  )
}
