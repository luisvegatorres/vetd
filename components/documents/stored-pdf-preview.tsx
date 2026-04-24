"use client"

// Renders the stored PDF for a generated document. Fetches a short-lived
// signed URL via the server action, loads the PDF with pdfjs, and hands the
// pages to the shared carousel (which rasterizes on-demand at the display
// size for crisp output).

import { useEffect, useState } from "react"

import { getDownloadUrlAction } from "@/app/(protected)/documents/actions"
import { PdfPageCarousel } from "@/components/documents/pdf-page-carousel"
import { loadPdfPages, type PdfPage } from "@/lib/documents/pdfjs-render"

type Status = "loading" | "ready" | "error"

export function StoredPdfPreview({
  documentId,
  revalidateKey,
}: {
  documentId: string
  /** Bump to force a reload (e.g. after an edit or regenerate). */
  revalidateKey?: string | number
}) {
  const [pages, setPages] = useState<PdfPage[]>([])
  const [status, setStatus] = useState<Status>("loading")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    // Reset preview state when the document or revalidate key changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus("loading")
    setErrorMessage(null)

    let destroy: (() => void) | null = null

    ;(async () => {
      try {
        const signed = await getDownloadUrlAction(documentId)
        if (!signed.ok) throw new Error(signed.error)
        if (controller.signal.aborted) return
        const loaded = await loadPdfPages(
          { kind: "url", url: signed.url },
          { signal: controller.signal },
        )
        if (controller.signal.aborted) {
          loaded.destroy()
          return
        }
        destroy = loaded.destroy
        setPages(loaded.pages)
        setStatus("ready")
      } catch (err) {
        if (controller.signal.aborted) return
        setStatus("error")
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to load PDF",
        )
      }
    })()

    return () => {
      controller.abort()
      if (destroy) destroy()
    }
  }, [documentId, revalidateKey])

  if (status === "error") {
    return (
      <div className="flex aspect-[8.5/11] w-full items-center justify-center bg-muted/30 p-4 text-center">
        <p className="text-xs text-destructive-500">
          {errorMessage ?? "Preview unavailable"}
        </p>
      </div>
    )
  }

  return (
    <PdfPageCarousel
      pages={pages}
      emptyState={
        <p className="text-xs text-muted-foreground">Loading PDF…</p>
      }
    />
  )
}
