"use client"

import { ExternalLink, Mail, Send } from "lucide-react"
import Link from "next/link"
import * as React from "react"
import { toast } from "sonner"

import { sendOutreachEmail } from "@/app/(protected)/leads/outreach-actions"
import {
  buildOutreachContext,
  resolveOutreach,
} from "@/lib/outreach/tokens"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea"
import type { Database } from "@/lib/supabase/types"
import type { LeadRow } from "./lead-types"

export type OutreachTemplate =
  Database["public"]["Tables"]["outreach_templates"]["Row"]

type Props = {
  lead: LeadRow
  templates: OutreachTemplate[]
  rep: {
    name: string | null
    email: string | null
    title: string | null
  }
}

// Loose synonym map so a typed industry like "Airbnb host" still picks the
// vacation_rental template even though they don't share a substring.
const INDUSTRY_SYNONYMS: Record<string, string[]> = {
  vacation_rental: ["airbnb", "vrbo", "rental", "host", "vacation"],
  restaurant: ["restaurant", "cafe", "café", "bistro", "eatery", "food"],
  fitness: ["gym", "fitness", "studio", "trainer", "yoga", "pilates", "crossfit"],
  professional_services: [
    "lawyer",
    "attorney",
    "law",
    "accountant",
    "cpa",
    "consultant",
    "agency",
  ],
  trades: [
    "hvac",
    "plumb",
    "electric",
    "contractor",
    "construction",
    "landscap",
    "roof",
  ],
}

function pickDefaultTemplate(
  templates: OutreachTemplate[],
  industry: string | null,
): OutreachTemplate | null {
  if (templates.length === 0) return null
  const active = templates.filter((t) => !t.is_archived)
  if (active.length === 0) return null
  if (!industry) return active[0]

  const needle = industry.toLowerCase()

  // Direct substring match against business_type or label first.
  const direct = active.find(
    (t) =>
      needle.includes(t.business_type.toLowerCase()) ||
      t.business_type.toLowerCase().includes(needle) ||
      t.label.toLowerCase().includes(needle),
  )
  if (direct) return direct

  // Fall back to synonym keywords mapped to business_type.
  for (const t of active) {
    const synonyms = INDUSTRY_SYNONYMS[t.business_type]
    if (synonyms?.some((kw) => needle.includes(kw))) return t
  }

  return active[0]
}

const DEFAULT_LINK_TEXT = "Click here"

export function OutreachEmailDialog({ lead, templates, rep }: Props) {
  const activeTemplates = React.useMemo(
    () => templates.filter((t) => !t.is_archived),
    [templates],
  )

  const defaultTemplate = React.useMemo(
    () => pickDefaultTemplate(templates, lead.industry),
    [templates, lead.industry],
  )

  function seedFromTemplate(t: OutreachTemplate) {
    const refUrl = t.reference_url ?? ""
    const linkText = t.reference_label?.trim() || DEFAULT_LINK_TEXT
    const ctx = buildOutreachContext({
      leadName: lead.name,
      leadCompany: lead.company,
      leadEmail: lead.email,
      linkText,
      rep,
    })
    return {
      subject: resolveOutreach(t.subject, ctx),
      body: resolveOutreach(t.body, ctx),
      referenceUrl: refUrl,
      linkText,
    }
  }

  const initialSeed = defaultTemplate
    ? seedFromTemplate(defaultTemplate)
    : {
        subject: "",
        body: "",
        referenceUrl: "",
        linkText: DEFAULT_LINK_TEXT,
      }

  const [open, setOpen] = React.useState(false)
  const [templateId, setTemplateId] = React.useState<string>(
    defaultTemplate?.id ?? "",
  )
  const [subject, setSubject] = React.useState(initialSeed.subject)
  const [body, setBody] = React.useState(initialSeed.body)
  const [referenceUrl, setReferenceUrl] = React.useState(
    initialSeed.referenceUrl,
  )
  const [linkText, setLinkText] = React.useState(initialSeed.linkText)
  const [subjectDirty, setSubjectDirty] = React.useState(false)
  const [bodyDirty, setBodyDirty] = React.useState(false)
  const [referenceDirty, setReferenceDirty] = React.useState(false)
  const [linkTextDirty, setLinkTextDirty] = React.useState(false)
  const [isSending, setIsSending] = React.useState(false)

  // Tracks which link text is currently baked into subject/body. When the
  // user changes the Link text input, this lets us find/replace the old
  // text for the new one at send time without re-substituting on every
  // keystroke.
  const appliedLinkTextRef = React.useRef(initialSeed.linkText)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    // Re-seed fields each time the dialog opens. The lead may have been
    // edited (e.g. industry filled in) since the last open; this picks up
    // the freshest defaults without requiring a full page reload.
    if (next && defaultTemplate) {
      const seed = seedFromTemplate(defaultTemplate)
      setTemplateId(defaultTemplate.id)
      setSubject(seed.subject)
      setBody(seed.body)
      setReferenceUrl(seed.referenceUrl)
      setLinkText(seed.linkText)
      setSubjectDirty(false)
      setBodyDirty(false)
      setReferenceDirty(false)
      setLinkTextDirty(false)
      appliedLinkTextRef.current = seed.linkText
    }
  }

  function applyTemplateRespectingDirt(t: OutreachTemplate) {
    const newLinkText = linkTextDirty
      ? linkText
      : (t.reference_label?.trim() || DEFAULT_LINK_TEXT)
    const ctx = buildOutreachContext({
      leadName: lead.name,
      leadCompany: lead.company,
      leadEmail: lead.email,
      linkText: newLinkText,
      rep,
    })

    if (!subjectDirty) setSubject(resolveOutreach(t.subject, ctx))
    if (!bodyDirty) setBody(resolveOutreach(t.body, ctx))
    if (!referenceDirty) setReferenceUrl(t.reference_url ?? "")
    if (!linkTextDirty) setLinkText(newLinkText)
    appliedLinkTextRef.current = newLinkText
  }

  function handleTemplateChange(id: string) {
    setTemplateId(id)
    const t = activeTemplates.find((x) => x.id === id)
    if (t) applyTemplateRespectingDirt(t)
  }

  function handleResetToTemplate() {
    const t = activeTemplates.find((x) => x.id === templateId)
    if (!t) return
    const seed = seedFromTemplate(t)
    setSubject(seed.subject)
    setBody(seed.body)
    setReferenceUrl(seed.referenceUrl)
    setLinkText(seed.linkText)
    setSubjectDirty(false)
    setBodyDirty(false)
    setReferenceDirty(false)
    setLinkTextDirty(false)
    appliedLinkTextRef.current = seed.linkText
    toast.success("Reset to template defaults")
  }

  async function handleSend() {
    if (!lead.email) return
    if (!templateId) {
      toast.error("Pick a template first")
      return
    }
    if (!subject.trim()) {
      toast.error("Subject can't be empty")
      return
    }
    if (!body.trim()) {
      toast.error("Body can't be empty")
      return
    }

    // If the user changed the link text after the template was seeded, swap
    // the old text for the new one in subject/body so the server can find
    // and linkify the right phrase.
    const newLinkText = linkText.trim() || DEFAULT_LINK_TEXT
    const oldLinkText = appliedLinkTextRef.current
    let outgoingSubject = subject.trim()
    let outgoingBody = body.trim()
    if (oldLinkText && oldLinkText !== newLinkText) {
      outgoingSubject = outgoingSubject.replaceAll(oldLinkText, newLinkText)
      outgoingBody = outgoingBody.replaceAll(oldLinkText, newLinkText)
    }

    setIsSending(true)
    try {
      const result = await sendOutreachEmail({
        leadId: lead.id,
        templateId,
        subject: outgoingSubject,
        body: outgoingBody,
        referenceUrl: referenceUrl.trim() || null,
        linkText: newLinkText,
      })

      if (!result.ok) {
        if (result.code === "scope_missing") {
          toast.error("Reconnect Google to send outreach", {
            description: result.error,
            action: {
              label: "Reconnect",
              onClick: () => {
                window.location.href = "/api/google/oauth/start"
              },
            },
          })
          return
        }
        toast.error(result.error)
        return
      }

      toast.success(`Email sent to ${lead.name}`)
      setOpen(false)
    } finally {
      setIsSending(false)
    }
  }

  const dirty =
    subjectDirty || bodyDirty || referenceDirty || linkTextDirty
  const noTemplates = activeTemplates.length === 0
  const disabled = !lead.email

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            disabled={disabled}
            className="gap-2 capitalize"
          >
            <Mail aria-hidden /> Email
          </Button>
        }
      />
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Send outreach to {lead.name}</DialogTitle>
          <DialogDescription>
            From your Gmail · To {lead.email}
          </DialogDescription>
        </DialogHeader>

        {noTemplates ? (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              No outreach templates have been created yet.
            </p>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/documents/outreach/new" />}
              className="gap-2"
              onClick={() => setOpen(false)}
            >
              <ExternalLink aria-hidden className="size-4" />
              Create one in Documents
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Template</Label>
              <Select
                value={templateId}
                onValueChange={(v) => {
                  if (v) handleTemplateChange(v)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pick a template">
                    {(value) =>
                      (value &&
                        activeTemplates.find((t) => t.id === value)?.label) ??
                      "Pick a template"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Templates</SelectLabel>
                    {activeTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {dirty ? (
                <button
                  type="button"
                  onClick={handleResetToTemplate}
                  className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                >
                  Reset to template defaults
                </button>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="outreach-subject">Subject</Label>
              <Input
                id="outreach-subject"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value)
                  setSubjectDirty(true)
                }}
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="outreach-body">Body</Label>
              <Textarea
                id="outreach-body"
                value={body}
                onChange={(e) => {
                  setBody(e.target.value)
                  setBodyDirty(true)
                }}
                rows={10}
                className="font-sans text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Paragraphs separated by a blank line. Any occurrence of the
                link text below renders as a clickable link to the
                reference URL.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_220px]">
              <div className="space-y-2">
                <Label htmlFor="outreach-ref">Reference URL</Label>
                <Input
                  id="outreach-ref"
                  type="url"
                  value={referenceUrl}
                  onChange={(e) => {
                    setReferenceUrl(e.target.value)
                    setReferenceDirty(true)
                  }}
                  placeholder="https://example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="outreach-link-text">Link text</Label>
                <Input
                  id="outreach-link-text"
                  value={linkText}
                  onChange={(e) => {
                    setLinkText(e.target.value)
                    setLinkTextDirty(true)
                  }}
                  placeholder={DEFAULT_LINK_TEXT}
                  maxLength={120}
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <DialogClose
            render={
              <Button variant="ghost" disabled={isSending}>
                Cancel
              </Button>
            }
          />
          {!noTemplates ? (
            <Button
              onClick={handleSend}
              disabled={disabled || isSending}
              className="gap-2"
            >
              <Send aria-hidden className="size-4" />
              {isSending ? "Sending…" : "Send"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
