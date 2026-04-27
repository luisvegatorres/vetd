"use client"

import * as React from "react"
import { Sparkles } from "lucide-react"
import { toast } from "sonner"

import {
  aiGenerateOutline,
  aiSuggestExcerpt,
  aiSuggestTags,
  aiTranslate,
} from "@/app/(protected)/dashboard/blog/ai-actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ActiveLocale = "en" | "es"

export type AiAssistMenuProps = {
  activeLocale: ActiveLocale
  // Current state from the editor — read on demand when AI actions fire.
  getTitleEn: () => string
  getExcerptEn: () => string
  getBodyEn: () => string
  getActiveBody: () => string
  // Callbacks the editor wires to apply AI output to fields.
  onSetBody: (locale: ActiveLocale, value: string) => void
  onSetExcerpt: (locale: ActiveLocale, value: string) => void
  onSetTitleEs: (value: string) => void
  onSetExcerptEs: (value: string) => void
  onSetBodyEs: (value: string) => void
  onSetTags: (tags: string[]) => void
}

type TranslationDraft = {
  title: string
  excerpt: string
  body: string
} | null

/**
 * Single dropdown entry point for every Gemini-powered drafting helper.
 * Keeping these as menu items (not modals) avoids cluttering the editor
 * surface — the only modal we open is the translation review, where seeing
 * the proposed ES output before overwriting is worth the interrupt.
 */
export function AiAssistMenu(props: AiAssistMenuProps) {
  const [outlineOpen, setOutlineOpen] = React.useState(false)
  const [outlineTopic, setOutlineTopic] = React.useState("")
  const [pending, setPending] = React.useState<string | null>(null)
  const [translationOpen, setTranslationOpen] = React.useState(false)
  const [translation, setTranslation] = React.useState<TranslationDraft>(null)

  function handleResult(label: string, ok: boolean, errorMsg?: string) {
    if (ok) toast.success(`${label} ready`)
    else toast.error(errorMsg ?? `${label} failed`)
  }

  async function runOutline() {
    setOutlineOpen(false)
    setPending("outline")
    try {
      const res = await aiGenerateOutline(outlineTopic, props.activeLocale)
      handleResult("Outline", res.ok, res.ok ? undefined : res.error)
      if (res.ok) {
        const existing = props.getActiveBody().trim()
        const next = existing ? `${existing}\n\n${res.text.trim()}` : res.text.trim()
        props.onSetBody(props.activeLocale, next)
      }
    } finally {
      setPending(null)
      setOutlineTopic("")
    }
  }

  async function runExcerpt() {
    const body = props.getActiveBody()
    if (!body.trim()) {
      toast.error("Write some body content first")
      return
    }
    setPending("excerpt")
    try {
      const res = await aiSuggestExcerpt(body, props.activeLocale)
      handleResult("Excerpt", res.ok, res.ok ? undefined : res.error)
      if (res.ok) props.onSetExcerpt(props.activeLocale, res.text.trim())
    } finally {
      setPending(null)
    }
  }

  async function runTags() {
    const body = props.getActiveBody() || props.getBodyEn()
    if (!body.trim()) {
      toast.error("Write some body content first")
      return
    }
    setPending("tags")
    try {
      const res = await aiSuggestTags(body)
      handleResult("Tags", res.ok, res.ok ? undefined : res.error)
      if (res.ok) props.onSetTags(res.tags)
    } finally {
      setPending(null)
    }
  }

  async function runTranslate() {
    const titleEn = props.getTitleEn().trim()
    const excerptEn = props.getExcerptEn().trim()
    const bodyEn = props.getBodyEn().trim()
    if (!titleEn || !bodyEn) {
      toast.error("English title and body must be set before translating")
      return
    }

    setPending("translate")
    try {
      // Run in parallel — focused per-field prompts keep each translation
      // crisp; one mega-prompt has historically lost markdown structure.
      const [titleRes, excerptRes, bodyRes] = await Promise.all([
        aiTranslate("title", titleEn),
        excerptEn
          ? aiTranslate("excerpt", excerptEn)
          : Promise.resolve({ ok: true as const, text: "" }),
        aiTranslate("body", bodyEn),
      ])

      if (!titleRes.ok) {
        toast.error(titleRes.error)
        return
      }
      if (!excerptRes.ok) {
        toast.error(excerptRes.error)
        return
      }
      if (!bodyRes.ok) {
        toast.error(bodyRes.error)
        return
      }

      setTranslation({
        title: titleRes.text.trim(),
        excerpt: excerptRes.text.trim(),
        body: bodyRes.text.trim(),
      })
      setTranslationOpen(true)
    } finally {
      setPending(null)
    }
  }

  function applyTranslation() {
    if (!translation) return
    props.onSetTitleEs(translation.title)
    props.onSetExcerptEs(translation.excerpt)
    props.onSetBodyEs(translation.body)
    toast.success("Spanish translation applied")
    setTranslation(null)
    setTranslationOpen(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending !== null}
              className="gap-2"
            >
              <Sparkles className="size-3.5" />
              {pending ? "Generating…" : "Draft with AI"}
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>AI helpers</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setOutlineOpen(true)}>
              Generate outline from topic
            </DropdownMenuItem>
            <DropdownMenuItem onClick={runExcerpt}>
              Suggest meta description
            </DropdownMenuItem>
            <DropdownMenuItem onClick={runTags}>
              Suggest tags
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={runTranslate}>
            Translate EN to ES
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={outlineOpen} onOpenChange={setOutlineOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate outline</DialogTitle>
            <DialogDescription>
              Enter a topic. Gemini will draft a markdown outline you can paste
              into the active body.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="ai-outline-topic">Topic</Label>
            <Input
              id="ai-outline-topic"
              value={outlineTopic}
              onChange={(e) => setOutlineTopic(e.target.value)}
              placeholder="e.g. Why small businesses need a custom website"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOutlineOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={runOutline}
              disabled={!outlineTopic.trim()}
            >
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={translationOpen} onOpenChange={setTranslationOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Review Spanish translation</DialogTitle>
            <DialogDescription>
              Applying will overwrite the existing Spanish title, excerpt, and
              body fields.
            </DialogDescription>
          </DialogHeader>
          {translation ? (
            <div className="max-h-[60vh] space-y-4 overflow-auto text-sm">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Title
                </p>
                <p className="mt-1">{translation.title}</p>
              </div>
              {translation.excerpt ? (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    Excerpt
                  </p>
                  <p className="mt-1">{translation.excerpt}</p>
                </div>
              ) : null}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Body
                </p>
                <pre className="mt-1 max-h-72 overflow-auto whitespace-pre-wrap border border-border bg-card p-3 text-xs">
                  {translation.body}
                </pre>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setTranslation(null)
                setTranslationOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={applyTranslation}>
              Apply translation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
