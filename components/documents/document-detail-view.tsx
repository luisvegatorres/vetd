"use client"

// Detail page for a generated document. Owns the view/edit mode toggle:
//   - View mode (default): stored PDF preview + metadata sidebar.
//   - Edit mode: JSON body code editor + live preview that renders the
//     currently-edited body against the document's original context snapshot.
//
// Edited bodies are persisted to documents.data._edits.body via a server
// action; the PDF in storage is overwritten. "Regenerate from template"
// drops edits and re-renders from the current template body.

import {
  Check,
  Download,
  MailCheck,
  Pencil,
  RefreshCw,
  X,
} from "lucide-react"
import Link from "next/link"
import { useRef, useState, useTransition } from "react"
import { toast } from "sonner"

import {
  getDownloadUrlAction,
  regenerateDocumentAction,
  updateDocumentBodyAction,
  updateDocumentStatus,
} from "@/app/(protected)/documents/actions"
import {
  BodyCodeEditor,
  type BodyEditorHandle,
} from "@/components/documents/body-code-editor"
import { InsertMenu } from "@/components/documents/insert-menu"
import { StoredPdfPreview } from "@/components/documents/stored-pdf-preview"
import { TemplatePreview } from "@/components/documents/template-preview"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  signed: "Signed",
  void: "Void",
}

function fmt(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export type DocumentDetailProps = {
  id: string
  title: string
  status: string
  hasPdf: boolean
  templateLinked: boolean
  /** Already-resolved body string (JSON) used to seed the editor. */
  initialBody: string
  /** Origin of the current body: edited per-doc or freshly resolved from template. */
  bodySource: "edited" | "template"
  createdAt: string | null
  sentAt: string | null
  signedAt: string | null
  client: { id: string; label: string } | null
  project: { id: string; label: string } | null
  template: { id: string; label: string } | null
}

export function DocumentDetailView({ doc }: { doc: DocumentDetailProps }) {
  const [mode, setMode] = useState<"view" | "edit">("view")
  const [body, setBody] = useState(doc.initialBody)
  const [savedRevision, setSavedRevision] = useState(0)
  const editorRef = useRef<BodyEditorHandle | null>(null)
  const [actionPending, startAction] = useTransition()
  const [savePending, startSave] = useTransition()

  function handleDownload() {
    startAction(async () => {
      const res = await getDownloadUrlAction(doc.id)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      window.open(res.url, "_blank")
    })
  }

  function handleMarkSent() {
    startAction(async () => {
      const res = await updateDocumentStatus(doc.id, "sent")
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Marked as sent")
    })
  }

  function handleMarkSigned() {
    startAction(async () => {
      const res = await updateDocumentStatus(doc.id, "signed")
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Marked as signed")
    })
  }

  function handleRegenerate() {
    if (
      !confirm(
        "Regenerate this document from the latest template? Any per-doc edits will be discarded.",
      )
    )
      return
    startAction(async () => {
      const res = await regenerateDocumentAction(doc.id)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Regenerated from template")
      setSavedRevision((r) => r + 1)
    })
  }

  function handleSaveEdits() {
    startSave(async () => {
      const res = await updateDocumentBodyAction(doc.id, body)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Document updated")
      setSavedRevision((r) => r + 1)
      setMode("view")
    })
  }

  function handleCancelEdits() {
    setBody(doc.initialBody)
    setMode("view")
  }

  const statusBadgeClass = doc.status === "signed"
    ? "border-emerald-500/60 text-emerald-600 dark:text-emerald-400"
    : doc.status === "sent"
      ? "border-sky-500/60 text-sky-600 dark:text-sky-400"
      : doc.status === "void"
        ? "border-muted-foreground/40 text-muted-foreground"
        : "border-amber-500/60 text-amber-600 dark:text-amber-400"

  return (
    <div className="flex h-[calc(100svh-6.5rem)] flex-col gap-6 md:h-[calc(100svh-8.5rem)]">
      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge variant="outline" className={`uppercase ${statusBadgeClass}`}>
          {STATUS_LABEL[doc.status] ?? doc.status}
        </Badge>

        <div className="flex flex-wrap items-center gap-2">
          {mode === "view" ? (
            <>
              {doc.hasPdf ? (
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  disabled={actionPending}
                >
                  <Download aria-hidden className="size-4" />
                  Download PDF
                </Button>
              ) : null}
              {doc.status === "draft" ? (
                <Button
                  variant="outline"
                  onClick={handleMarkSent}
                  disabled={actionPending}
                >
                  <MailCheck aria-hidden className="size-4" />
                  Mark sent
                </Button>
              ) : null}
              {doc.status !== "signed" && doc.status !== "void" ? (
                <Button
                  variant="outline"
                  onClick={handleMarkSigned}
                  disabled={actionPending}
                >
                  <Check aria-hidden className="size-4" />
                  Mark signed
                </Button>
              ) : null}
              {doc.templateLinked ? (
                <Button
                  variant="outline"
                  onClick={handleRegenerate}
                  disabled={actionPending}
                >
                  <RefreshCw aria-hidden className="size-4" />
                  Regenerate
                </Button>
              ) : null}
              <Button onClick={() => setMode("edit")} disabled={actionPending}>
                <Pencil aria-hidden className="size-4" />
                Edit
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleCancelEdits}
                disabled={savePending}
              >
                <X aria-hidden className="size-4" />
                Cancel
              </Button>
              <Button onClick={handleSaveEdits} disabled={savePending}>
                <Check aria-hidden className="size-4" />
                {savePending ? "Saving…" : "Save changes"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      {mode === "view" ? (
        <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <Card className="flex flex-col overflow-hidden">
            <CardContent className="flex-1 overflow-y-auto">
              <StoredPdfPreview
                documentId={doc.id}
                revalidateKey={savedRevision}
              />
            </CardContent>
          </Card>

          <Card className="flex flex-col overflow-hidden">
            <CardContent className="flex-1 space-y-6 overflow-y-auto">
              <DetailRow label="Client">
                {doc.client ? (
                  <Link
                    href={`/clients/${doc.client.id}`}
                    className="hover:underline"
                  >
                    {doc.client.label}
                  </Link>
                ) : (
                  "—"
                )}
              </DetailRow>
              <DetailRow label="Project">
                {doc.project ? (
                  <Link
                    href={`/projects/${doc.project.id}`}
                    className="hover:underline"
                  >
                    {doc.project.label}
                  </Link>
                ) : (
                  "—"
                )}
              </DetailRow>
              <DetailRow label="Template">
                {doc.template ? (
                  <Link
                    href={`/documents/templates/${doc.template.id}`}
                    className="hover:underline"
                  >
                    {doc.template.label}
                  </Link>
                ) : (
                  "— (template deleted)"
                )}
              </DetailRow>
              <DetailRow label="Created">{fmt(doc.createdAt)}</DetailRow>
              <DetailRow label="Sent">{fmt(doc.sentAt)}</DetailRow>
              <DetailRow label="Signed">{fmt(doc.signedAt)}</DetailRow>
              <DetailRow label="Body source">
                <span className="text-muted-foreground">
                  {doc.bodySource === "edited"
                    ? "Customized for this document"
                    : "Current template"}
                </span>
              </DetailRow>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <Card className="flex flex-col overflow-hidden">
            <CardContent className="flex flex-1 flex-col gap-6 overflow-hidden">
              <div className="flex min-h-0 flex-1 flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="doc-body">Body (structured blocks as JSON)</Label>
                  <InsertMenu editorRef={editorRef} />
                </div>
                <BodyCodeEditor
                  ref={editorRef}
                  id="doc-body"
                  value={body}
                  onValueChange={setBody}
                />
                <p className="text-xs text-muted-foreground">
                  Edits apply to this document only. Regenerate to restore the
                  template version.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col overflow-hidden">
            <CardContent className="flex-1 space-y-6 overflow-y-auto">
              <TemplatePreview name={doc.title} body={body} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function DetailRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/40 pb-3 last:border-b-0 last:pb-0">
      <dt className="text-overline font-medium uppercase text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}
