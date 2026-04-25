"use client"

// Plain-text body editor for outreach templates. Uses CodeMirror so we can
// colorize merge tokens (`{{client.name_first}}`, the legacy single-brace
// shortcuts) without losing the feel of a regular textarea — no JSON
// highlighting, no gutter, no line numbers. Mirrors body-code-editor.tsx but
// for free-form prose.

import {
  autocompletion,
  type Completion,
  type CompletionContext,
  type CompletionResult,
} from "@codemirror/autocomplete"
import { RangeSetBuilder } from "@codemirror/state"
import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
} from "@codemirror/view"
import { createTheme } from "@uiw/codemirror-themes"
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror"
import { useTheme } from "next-themes"
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"

import { OUTREACH_TOKEN_GROUPS } from "@/lib/outreach/tokens"

const ALL_TOKENS = OUTREACH_TOKEN_GROUPS.flatMap((g) => g.tokens)

function tokenCompletions(
  context: CompletionContext
): CompletionResult | null {
  const tokenMatch = context.matchBefore(/\{\{[a-z0-9_.]*/i)
  if (!tokenMatch || tokenMatch.from === tokenMatch.to) return null
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

export type OutreachBodyEditorHandle = {
  insertAtCursor: (snippet: string) => void
  focus: () => void
}

// Marks `{{token.path}}` spans (including mid-type partials) and the legacy
// `{leadFirstName}` / `{businessName}` / `{referenceLink}` / `{referenceUrl}`
// shortcuts so older templates still get visual feedback.
const TOKEN_RE =
  /\{\{[^}\n]*\}?\}?|\{(?:leadFirstName|businessName|referenceLink|referenceUrl)\}/g

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
      for (const { from, to } of view.visibleRanges) {
        const text = view.state.doc.sliceString(from, to)
        for (const match of text.matchAll(TOKEN_RE)) {
          const start = from + (match.index ?? 0)
          const end = start + match[0].length
          builder.add(start, end, mark)
        }
      }
      return builder.finish()
    }
  },
  { decorations: (v) => v.decorations }
)

const tokenTheme = EditorView.baseTheme({
  ".cm-token": {
    color: "#c586c0 !important",
    fontWeight: "600",
  },
  ".cm-token *": { color: "inherit !important" },
  "&light .cm-token": { color: "#af00db !important" },
})

const darkTheme = createTheme({
  theme: "dark",
  settings: {
    background: "transparent",
    foreground: "oklch(0.985 0 0)",
    caret: "oklch(0.985 0 0)",
    selection: "oklch(1 0 0 / 15%)",
    selectionMatch: "oklch(1 0 0 / 10%)",
    lineHighlight: "transparent",
    gutterBackground: "transparent",
    gutterForeground: "oklch(0.708 0 0)",
    gutterBorder: "transparent",
  },
  styles: [],
})

const lightTheme = createTheme({
  theme: "light",
  settings: {
    background: "transparent",
    foreground: "oklch(0.145 0 0)",
    caret: "oklch(0.145 0 0)",
    selection: "oklch(0 0 0 / 12%)",
    selectionMatch: "oklch(0 0 0 / 8%)",
    lineHighlight: "transparent",
    gutterBackground: "transparent",
    gutterForeground: "oklch(0.556 0 0)",
    gutterBorder: "transparent",
  },
  styles: [],
})

type Props = {
  value: string
  onValueChange: (next: string) => void
  onFocus?: () => void
  placeholder?: string
}

export const OutreachBodyEditor = forwardRef<
  OutreachBodyEditorHandle,
  Props
>(function OutreachBodyEditor(
  { value, onValueChange, onFocus, placeholder },
  ref
) {
  const cmRef = useRef<ReactCodeMirrorRef>(null)
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  // Force dark before mount to match SSR (defaultTheme="dark") and avoid a
  // hydration mismatch on CodeMirror's root class.
  const isDark = !mounted || resolvedTheme !== "light"

  useImperativeHandle(ref, () => ({
    insertAtCursor(snippet) {
      const view = cmRef.current?.view
      if (!view) {
        onValueChange(value + snippet)
        return
      }
      const { from, to } = view.state.selection.main
      view.dispatch({
        changes: { from, to, insert: snippet },
        selection: { anchor: from + snippet.length },
        scrollIntoView: true,
      })
      view.focus()
    },
    focus() {
      cmRef.current?.view?.focus()
    },
  }))

  return (
    <div
      className="min-h-0 flex-1 overflow-auto border border-input bg-transparent shadow-xs focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30"
      onFocus={onFocus}
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
          tokenHighlighter,
          tokenTheme,
          EditorView.lineWrapping,
          autocompletion({
            override: [tokenCompletions],
            activateOnTyping: true,
          }),
        ]}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          highlightActiveLine: false,
          highlightActiveLineGutter: false,
          bracketMatching: false,
          closeBrackets: false,
          autocompletion: false,
        }}
      />
    </div>
  )
})
