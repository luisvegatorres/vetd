"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { FileText } from "lucide-react"
import { toast } from "sonner"

import {
  generateDocumentAction,
  getDownloadUrlAction,
} from "@/app/(protected)/documents/actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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

type TemplateOption = {
  id: string
  name: string
  kind: string
}

export function GenerateDocumentDialog({
  clientId,
  projectId,
  templates,
}: {
  clientId: string
  projectId?: string | null
  templates: TemplateOption[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [templateId, setTemplateId] = useState<string>(
    templates[0]?.id ?? "",
  )
  const [pending, startTransition] = useTransition()

  const hasTemplates = templates.length > 0

  function handleGenerate() {
    if (!templateId) return
    startTransition(async () => {
      const res = await generateDocumentAction({
        templateId,
        clientId,
        projectId: projectId ?? null,
      })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Document generated")
      setOpen(false)
      const dl = await getDownloadUrlAction(res.documentId)
      if (dl.ok) window.open(dl.url, "_blank")
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <FileText aria-hidden className="size-4" />
            Generate document
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate document</DialogTitle>
        </DialogHeader>

        {hasTemplates ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="template">Template</Label>
            <Select
              value={templateId}
              onValueChange={(v) => setTemplateId(v ?? "")}
            >
              <SelectTrigger id="template" className="w-full">
                <SelectValue placeholder="Pick a template">
                  {(value) => {
                    const match = templates.find((t) => t.id === value)
                    return match ? match.name : ""
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Templates</SelectLabel>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Client and project data is merged into the template at render
              time. The PDF opens in a new tab after generation.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No active templates yet. Create one from the Documents page.
          </p>
        )}

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={pending || !templateId || !hasTemplates}
          >
            {pending ? "Generating…" : "Generate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
