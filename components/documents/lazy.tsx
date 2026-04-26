"use client"

import dynamic from "next/dynamic"
import { forwardRef, type Ref } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import type { BodyEditorHandle } from "@/components/documents/body-code-editor"
import type { OutreachBodyEditorHandle } from "@/components/documents/outreach-body-editor"

function EditorSkeleton({ rows = 12 }: { rows?: number }) {
  return (
    <div className="flex flex-1 flex-col gap-2 overflow-hidden border border-border/60 bg-muted/20 p-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full rounded-none" />
      ))}
    </div>
  )
}

function PdfPreviewSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-3 w-24 rounded-none" />
      <Skeleton className="aspect-[8.5/11] w-full rounded-none" />
    </div>
  )
}

type BodyCodeEditorProps = {
  id?: string
  value: string
  onValueChange: (next: string) => void
}

const InternalBodyCodeEditor = dynamic(
  () =>
    import("@/components/documents/body-code-editor").then((m) => ({
      default: m.BodyCodeEditor,
    })),
  {
    ssr: false,
    loading: () => <EditorSkeleton />,
  },
)

export const LazyBodyCodeEditor = forwardRef<
  BodyEditorHandle,
  BodyCodeEditorProps
>(function LazyBodyCodeEditor(props, ref) {
  return (
    <InternalBodyCodeEditor
      {...props}
      ref={ref as Ref<BodyEditorHandle>}
    />
  )
})

type OutreachBodyEditorProps = {
  value: string
  onValueChange: (next: string) => void
  onFocus?: () => void
  placeholder?: string
}

const InternalOutreachBodyEditor = dynamic(
  () =>
    import("@/components/documents/outreach-body-editor").then((m) => ({
      default: m.OutreachBodyEditor,
    })),
  {
    ssr: false,
    loading: () => <EditorSkeleton rows={8} />,
  },
)

export const LazyOutreachBodyEditor = forwardRef<
  OutreachBodyEditorHandle,
  OutreachBodyEditorProps
>(function LazyOutreachBodyEditor(props, ref) {
  return (
    <InternalOutreachBodyEditor
      {...props}
      ref={ref as Ref<OutreachBodyEditorHandle>}
    />
  )
})

export const LazyTemplatePreview = dynamic(
  () =>
    import("@/components/documents/template-preview").then((m) => ({
      default: m.TemplatePreview,
    })),
  {
    ssr: false,
    loading: () => <PdfPreviewSkeleton />,
  },
)

export const LazyStoredPdfPreview = dynamic(
  () =>
    import("@/components/documents/stored-pdf-preview").then((m) => ({
      default: m.StoredPdfPreview,
    })),
  {
    ssr: false,
    loading: () => <PdfPreviewSkeleton />,
  },
)
