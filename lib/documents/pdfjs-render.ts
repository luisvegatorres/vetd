// Browser helper for loading a PDF (ArrayBuffer or URL) via pdfjs-dist and
// exposing each page as a render thunk the UI can invoke at arbitrary scales.
//
// Rationale: rasterizing once to a data URL at a fixed scale looks fine at
// that size but pixelates when the container is wider or the display is
// retina. Exposing per-page render fns lets the carousel render directly to
// its on-screen canvas at devicePixelRatio × containerWidth, so the preview
// stays crisp at any size, same fidelity as a native PDF viewer.

let workerConfigured = false

export type PdfSource =
  | { kind: "buffer"; data: ArrayBuffer }
  | { kind: "url"; url: string }

export type PdfPage = {
  /** Width in PDF points (unscaled). Useful for computing aspect ratio. */
  widthPt: number
  heightPt: number
  /** Render into the given canvas at the given device-pixel scale. */
  render: (canvas: HTMLCanvasElement, scale: number) => Promise<void>
}

export type LoadedPdf = {
  pages: PdfPage[]
  /** Call when the consumer is done; tears down pdfjs's internal worker refs. */
  destroy: () => void
}

export async function loadPdfPages(
  source: PdfSource,
  opts?: { signal?: AbortSignal },
): Promise<LoadedPdf> {
  const pdfjs = await import("pdfjs-dist")

  if (!workerConfigured) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString()
    workerConfigured = true
  }

  const signal = opts?.signal
  const doc = await pdfjs.getDocument(
    source.kind === "buffer" ? { data: source.data } : { url: source.url },
  ).promise

  if (signal?.aborted) {
    doc.destroy()
    throw new DOMException("Aborted", "AbortError")
  }

  let destroyed = false
  const liveTasks = new Set<{ cancel: () => void }>()

  const pages: PdfPage[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const baseViewport = page.getViewport({ scale: 1 })
    let renderTask: { cancel: () => void; promise: Promise<void> } | null = null
    pages.push({
      widthPt: baseViewport.width,
      heightPt: baseViewport.height,
      render: async (canvas, scale) => {
        // React strict-mode can re-run a parent effect cleanup (which destroys
        // the doc) before the carousel's effect that calls render() has torn
        // down. So we may be invoked after destroy. Bail instead of calling
        // into a PDFPageProxy whose transport.messageHandler is now null.
        if (destroyed) return
        if (renderTask) renderTask.cancel()
        const viewport = page.getViewport({ scale })
        canvas.width = Math.max(1, Math.floor(viewport.width))
        canvas.height = Math.max(1, Math.floor(viewport.height))
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        const task = page.render({ canvas, canvasContext: ctx, viewport })
        renderTask = task
        liveTasks.add(task)
        try {
          await task.promise
        } catch (err) {
          const name = err && typeof err === "object" && "name" in err ? (err as Error).name : ""
          if (name !== "RenderingCancelledException") throw err
        } finally {
          liveTasks.delete(task)
        }
      },
    })
  }

  return {
    pages,
    destroy: () => {
      if (destroyed) return
      destroyed = true
      liveTasks.forEach((t) => t.cancel())
      liveTasks.clear()
      doc.destroy()
    },
  }
}
