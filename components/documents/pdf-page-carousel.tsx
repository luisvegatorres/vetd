"use client"

// Canvas-based PDF page carousel. Renders the current page at
// devicePixelRatio × containerWidth so the preview stays crisp regardless
// of card width or display density, and re-renders on resize.

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import type { PdfPage } from "@/lib/documents/pdfjs-render"

export function PdfPageCarousel({
  pages,
  emptyState,
}: {
  pages: PdfPage[]
  emptyState?: React.ReactNode
}) {
  const [pageIndex, setPageIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const hasPages = pages.length > 0
  const maxIndex = Math.max(0, pages.length - 1)
  const effectiveIndex = Math.min(pageIndex, maxIndex)
  const currentPage = hasPages ? pages[effectiveIndex] : null

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas || !currentPage) return

    let cancelled = false

    const render = () => {
      const width = container.clientWidth
      if (!width || cancelled) return
      const dpr = window.devicePixelRatio || 1
      // scale=1 in pdfjs = 96 DPI raster of the page. Multiply by (containerPx /
      // pagePxAtScale1) × dpr to match the canvas's actual device pixels.
      const scale = (width / currentPage.widthPt) * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${(width * currentPage.heightPt) / currentPage.widthPt}px`
      void currentPage.render(canvas, scale)
    }

    render()
    const observer = new ResizeObserver(render)
    observer.observe(container)
    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [currentPage])

  const canPrev = effectiveIndex > 0
  const canNext = effectiveIndex < maxIndex

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={containerRef}
        className="w-full border border-border/40 bg-white"
      >
        {currentPage ? (
          <canvas ref={canvasRef} className="block w-full" />
        ) : (
          <div className="flex aspect-[8.5/11] w-full items-center justify-center bg-muted/30 p-4 text-center">
            {emptyState ?? (
              <p className="text-xs text-muted-foreground">No pages</p>
            )}
          </div>
        )}
      </div>

      {hasPages ? (
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Page {effectiveIndex + 1} of {pages.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => setPageIndex(Math.max(0, effectiveIndex - 1))}
              disabled={!canPrev}
              aria-label="Previous page"
            >
              <ChevronLeft />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => setPageIndex(Math.min(maxIndex, effectiveIndex + 1))}
              disabled={!canNext}
              aria-label="Next page"
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
