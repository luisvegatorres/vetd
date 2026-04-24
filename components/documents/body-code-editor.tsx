"use client"

// CodeMirror 6-based JSON editor. Uses @uiw/react-codemirror's defaults for
// chrome and syntax colors. We only layer on:
//   1. JSON language.
//   2. A `{{token}}` decoration so merge fields stand out.
//   3. A context-aware completion source for tokens / block types / spacer sizes.
//
// Exposes an imperative `insertAtCursor` handle so the Insert popover can
// splice snippets at the selection via CM's dispatch API (proper history,
// auto-indent, and scroll-into-view).

import {
  autocompletion,
  type Completion,
  type CompletionContext,
  type CompletionResult,
} from "@codemirror/autocomplete"
import { json } from "@codemirror/lang-json"
import { RangeSetBuilder } from "@codemirror/state"
import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
} from "@codemirror/view"
import { tags as t } from "@lezer/highlight"
import { createTheme } from "@uiw/codemirror-themes"
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror"
import { useTheme } from "next-themes"
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"

import { ALL_TOKENS, BLOCK_TYPES, SPACER_SIZES } from "@/lib/documents/catalog"

export type BodyEditorHandle = {
  insertAtCursor: (snippet: string) => void
  focus: () => void
}

/**
 * Decorator that marks every `{{token.path}}` span, including mid-type
 * partials, so reps get feedback while writing a token.
 */
const tokenHighlighter = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet
    constructor(view: EditorView) {
      this.decorations = this.build(view)
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.build(update.view)
      }
    }
    build(view: EditorView): DecorationSet {
      const builder = new RangeSetBuilder<Decoration>()
      const mark = Decoration.mark({ class: "cm-token" })
      const re = /\{\{[^}\n]*\}?\}?/g
      for (const { from, to } of view.visibleRanges) {
        const text = view.state.doc.sliceString(from, to)
        for (const match of text.matchAll(re)) {
          const start = from + (match.index ?? 0)
          const end = start + match[0].length
          builder.add(start, end, mark)
        }
      }
      return builder.finish()
    }
  },
  { decorations: (v) => v.decorations },
)

// The Lezer string highlighter wraps the token text in its own nested span
// (directly around the text node). Since the nested span is a closer parent
// to the text, *its* color wins. So we set our color on .cm-token and force
// any descendant spans to inherit it instead of their own inline color.
const tokenTheme = EditorView.baseTheme({
  ".cm-token": {
    color: "#c586c0 !important",
    fontWeight: "600",
  },
  ".cm-token *": {
    color: "inherit !important",
  },
  "&light .cm-token": {
    color: "#af00db !important",
  },
})

// Themes bound to the project's design tokens. Chrome (bg/fg/caret/selection/
// gutter) uses the CRM's CSS variables so the editor shifts with the app's
// light/dark mode. Syntax colors are hex-pinned so they stay legible against
// either background regardless of token choices elsewhere.
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
    { tag: t.propertyName, color: "#9cdcfe" },
    { tag: [t.string, t.special(t.string)], color: "#ce9178" },
    { tag: t.number, color: "#b5cea8" },
    { tag: [t.bool, t.null, t.keyword], color: "#569cd6" },
    { tag: t.punctuation, color: "#d4d4d4" },
    { tag: t.brace, color: "#d4d4d4" },
    { tag: t.comment, color: "oklch(0.708 0 0)" },
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
    { tag: t.propertyName, color: "#0451a5" },
    { tag: [t.string, t.special(t.string)], color: "#a31515" },
    { tag: t.number, color: "#098658" },
    { tag: [t.bool, t.null, t.keyword], color: "#0000ff" },
    { tag: t.punctuation, color: "#000000" },
    { tag: t.brace, color: "#000000" },
    { tag: t.comment, color: "oklch(0.556 0 0)" },
  ],
})

function bodyCompletions(context: CompletionContext): CompletionResult | null {
  const tokenMatch = context.matchBefore(/\{\{[a-z0-9_.]*/i)
  if (tokenMatch && tokenMatch.from !== tokenMatch.to) {
    const options: Completion[] = ALL_TOKENS.map((tok) => ({
      label: tok.name,
      detail: tok.description,
      type: "variable",
      apply: (view, _completion, from, to) => {
        const after = view.state.doc.sliceString(to, to + 2)
        const suffix = after === "}}" ? "" : "}}"
        const insert = `${tok.name}${suffix}`
        view.dispatch({
          changes: { from, to, insert },
          selection: { anchor: from + insert.length },
        })
      },
    }))
    return {
      from: tokenMatch.from + 2,
      to: tokenMatch.to,
      options,
      validFor: /^[a-z0-9_.]*$/i,
    }
  }

  const typeMatch = context.matchBefore(/"type"\s*:\s*"\w*/)
  if (typeMatch) {
    const quoteIdx = typeMatch.text.lastIndexOf('"')
    return {
      from: typeMatch.from + quoteIdx + 1,
      to: typeMatch.to,
      options: BLOCK_TYPES.map((name) => ({ label: name, type: "enum" })),
      validFor: /^\w*$/,
    }
  }

  const sizeMatch = context.matchBefore(/"size"\s*:\s*"\w*/)
  if (sizeMatch) {
    const quoteIdx = sizeMatch.text.lastIndexOf('"')
    return {
      from: sizeMatch.from + quoteIdx + 1,
      to: sizeMatch.to,
      options: SPACER_SIZES.map((size) => ({ label: size, type: "enum" })),
      validFor: /^\w*$/,
    }
  }

  return null
}

export const BodyCodeEditor = forwardRef<
  BodyEditorHandle,
  {
    value: string
    onValueChange: (next: string) => void
    /** Retained for back-compat; unused by CM. */
    id?: string
  }
>(function BodyCodeEditor({ value, onValueChange }, ref) {
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

      const lineStart = state.doc.lineAt(from).from
      const preLine = state.doc.sliceString(lineStart, from)
      const indentMatch = preLine.match(/^[ \t]*/)
      const indent = indentMatch ? indentMatch[0] : ""
      const reindented = snippet
        .split("\n")
        .map((line, i) => (i === 0 ? line : indent + line))
        .join("\n")

      const charBefore = from > 0 ? state.doc.sliceString(from - 1, from) : "\n"
      const needsLeadingNewline =
        charBefore !== "\n" && !/\s/.test(charBefore)
      const insert = needsLeadingNewline
        ? `\n${indent}${reindented}`
        : reindented

      view.dispatch({
        changes: { from, to, insert },
        selection: { anchor: from + insert.length },
        scrollIntoView: true,
      })
      view.focus()
    },
    focus() {
      cmRef.current?.view?.focus()
    },
  }))

  return (
    <div className="min-h-0 flex-1 overflow-auto border border-input bg-transparent shadow-xs focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30">
      <CodeMirror
        ref={cmRef}
        value={value}
        onChange={onValueChange}
        height="100%"
        theme="none"
        extensions={[
          isDark ? darkTheme : lightTheme,
          json(),
          tokenHighlighter,
          tokenTheme,
          EditorView.lineWrapping,
          autocompletion({
            override: [bodyCompletions],
            activateOnTyping: true,
          }),
        ]}
        basicSetup={{ autocompletion: false }}
      />
    </div>
  )
})
