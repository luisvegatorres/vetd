"use client"

// Live multi-page PDF preview for the template editor. Generates the real
// PDF blob in the browser via @react-pdf/renderer (same paginator as the
// server), loads it with pdfjs, and hands the pages to the shared carousel
// which rasterizes at the display size for crisp output.
// Regeneration is debounced so each keystroke doesn't trigger a full round-trip.

import { useEffect, useMemo, useState } from "react"

import { PdfPageCarousel } from "@/components/documents/pdf-page-carousel"
import { isDocumentBody } from "@/lib/documents/blocks"
import { DocumentPDF } from "@/lib/documents/pdf"
import { loadPdfPages, type PdfPage } from "@/lib/documents/pdfjs-render"
import { buildSampleContext } from "@/lib/documents/sample-context"
import { resolveBody, resolveString } from "@/lib/documents/tokens"
import { site } from "@/lib/site"

const DEBOUNCE_MS = 350

type Status = "idle" | "building" | "ready" | "error"

export function TemplatePreview({
  name,
  body,
}: {
  name: string
  body: string
}) {
  const [pages, setPages] = useState<PdfPage[]>([])
  const [status, setStatus] = useState<Status>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { resolved, parseError } = useMemo(() => {
    try {
      const parsed = JSON.parse(body)
      if (!isDocumentBody(parsed)) {
        return { resolved: null, parseError: "Body is not a valid block array" }
      }
      const ctx = buildSampleContext()
      return {
        resolved: {
          title: resolveString(name || "Untitled", ctx) || "Untitled",
          subtitle: [
            (ctx.client as Record<string, string>)?.business,
            String(ctx.today_long ?? ""),
          ]
            .filter(Boolean)
            .join(" • "),
          body: resolveBody(parsed, ctx),
        },
        parseError: null,
      }
    } catch (err) {
      return {
        resolved: null,
        parseError: err instanceof Error ? err.message : "Invalid JSON",
      }
    }
  }, [name, body])

  useEffect(() => {
    if (!resolved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("error")
      setErrorMessage(parseError)
      return
    }

    const controller = new AbortController()
    setStatus("building")
    setErrorMessage(null)

    let destroy: (() => void) | null = null

    const timer = setTimeout(async () => {
      try {
        const { pdf } = await import("@react-pdf/renderer")
        const blob = await pdf(
          <DocumentPDF
            title={resolved.title}
            brand={site.name}
            subtitle={resolved.subtitle}
            body={resolved.body}
          />,
        ).toBlob()
        if (controller.signal.aborted) return
        const buffer = await blob.arrayBuffer()
        const loaded = await loadPdfPages(
          { kind: "buffer", data: buffer },
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
          err instanceof Error ? err.message : "Failed to render PDF",
        )
      }
    }, DEBOUNCE_MS)

    return () => {
      controller.abort()
      clearTimeout(timer)
      if (destroy) destroy()
    }
  }, [resolved, parseError])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-overline font-medium uppercase text-muted-foreground">
          Live preview
        </p>
        <span className="text-xs text-muted-foreground">
          {status === "building" && "Rendering…"}
          {status === "ready" && "Sample data"}
          {status === "error" && "Error"}
        </span>
      </div>

      {status === "error" ? (
        <div className="flex aspect-[8.5/11] w-full items-center justify-center bg-muted/30 p-4 text-center">
          <p className="text-xs text-destructive-500">
            {errorMessage ?? "Preview unavailable"}
          </p>
        </div>
      ) : (
        <PdfPageCarousel
          pages={pages}
          emptyState={
            <p className="text-xs text-muted-foreground">Rendering preview…</p>
          }
        />
      )}

      <p className="text-xs text-muted-foreground">
        Tokens are resolved against sample client and project data.
      </p>
    </div>
  )
}
