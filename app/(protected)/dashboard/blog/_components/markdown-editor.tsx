"use client"

import { markdown } from "@codemirror/lang-markdown"
import { EditorView } from "@codemirror/view"
import { tags as t } from "@lezer/highlight"
import { createTheme } from "@uiw/codemirror-themes"
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror"
import { useTheme } from "next-themes"
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"

export type MarkdownEditorHandle = {
  insertAtCursor: (snippet: string) => void
  replaceAll: (next: string) => void
  focus: () => void
}

// Themes mirror components/documents/body-code-editor.tsx so the markdown
// editor visually matches the JSON document editor (chrome bound to project
// tokens, syntax colors hex-pinned for legibility on either canvas).
const darkTheme = createTheme({
  theme: "dark",
  settings: {
    background: "transparent",
    foreground: "oklch(0.985 0 0)",
    caret: "oklch(0.985 0 0)",
    selection: "oklch(1 0 0 / 15%)",
    selectionMatch: "oklch(1 0 0 / 10%)",
    lineHighlight: "oklch(1 0 0 / 4%)",
    gutterBackground: "transparent",
    gutterForeground: "oklch(0.708 0 0)",
    gutterBorder: "transparent",
  },
  styles: [
    { tag: t.heading, color: "#9cdcfe", fontWeight: "600" },
    { tag: t.strong, fontWeight: "700" },
    { tag: t.emphasis, fontStyle: "italic" },
    { tag: t.link, color: "#569cd6" },
    { tag: t.url, color: "#ce9178" },
    { tag: t.monospace, color: "#ce9178" },
    { tag: t.quote, color: "oklch(0.708 0 0)", fontStyle: "italic" },
    { tag: t.list, color: "#b5cea8" },
    { tag: t.atom, color: "#569cd6" },
  ],
})

const lightTheme = createTheme({
  theme: "light",
  settings: {
    background: "transparent",
    foreground: "oklch(0.145 0 0)",
    caret: "oklch(0.145 0 0)",
    selection: "oklch(0 0 0 / 12%)",
    selectionMatch: "oklch(0 0 0 / 8%)",
    lineHighlight: "oklch(0 0 0 / 3%)",
    gutterBackground: "transparent",
    gutterForeground: "oklch(0.556 0 0)",
    gutterBorder: "transparent",
  },
  styles: [
    { tag: t.heading, color: "#0451a5", fontWeight: "600" },
    { tag: t.strong, fontWeight: "700" },
    { tag: t.emphasis, fontStyle: "italic" },
    { tag: t.link, color: "#0000ff" },
    { tag: t.url, color: "#a31515" },
    { tag: t.monospace, color: "#a31515" },
    { tag: t.quote, color: "oklch(0.556 0 0)", fontStyle: "italic" },
    { tag: t.list, color: "#098658" },
    { tag: t.atom, color: "#0000ff" },
  ],
})

export const MarkdownEditor = forwardRef<
  MarkdownEditorHandle,
  {
    value: string
    onValueChange: (next: string) => void
    placeholder?: string
    minHeight?: string
  }
>(function MarkdownEditor(
  { value, onValueChange, placeholder, minHeight = "420px" },
  ref,
) {
  const cmRef = useRef<ReactCodeMirrorRef>(null)
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  // Before mount, force dark to match SSR (defaultTheme="dark") and avoid a
  // hydration mismatch on CodeMirror's root class.
  const isDark = !mounted || resolvedTheme !== "light"

  useImperativeHandle(ref, () => ({
    insertAtCursor(snippet: string) {
      const view = cmRef.current?.view
      if (!view) return
      const { state } = view
      const { from, to } = state.selection.main
      view.dispatch({
        changes: { from, to, insert: snippet },
        selection: { anchor: from + snippet.length },
        scrollIntoView: true,
      })
      view.focus()
    },
    replaceAll(next: string) {
      const view = cmRef.current?.view
      if (!view) return
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: next },
      })
      view.focus()
    },
    focus() {
      cmRef.current?.view?.focus()
    },
  }))

  return (
    <div
      className="overflow-auto border border-input bg-transparent shadow-xs focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30"
      style={{ minHeight }}
    >
      <CodeMirror
        ref={cmRef}
        value={value}
        onChange={onValueChange}
        height="100%"
        theme="none"
        placeholder={placeholder}
        extensions={[
          isDark ? darkTheme : lightTheme,
          markdown(),
          EditorView.lineWrapping,
        ]}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          highlightActiveLine: false,
          highlightActiveLineGutter: false,
        }}
      />
    </div>
  )
})
