"use client"

// Popover menu next to the body editor that lets reps insert block scaffolds
// and merge tokens at the cursor. Keeps the scheme discoverable without a
// separate docs page — the options in here ARE the grammar of a template.

import { PlusIcon } from "lucide-react"
import type { RefObject } from "react"

import type { BodyEditorHandle } from "@/components/documents/body-code-editor"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BLOCKS, TOKEN_GROUPS } from "@/lib/documents/catalog"

export function InsertMenu({
  editorRef,
}: {
  editorRef: RefObject<BodyEditorHandle | null>
}) {
  function insertAtCursor(snippet: string) {
    editorRef.current?.insertAtCursor(snippet)
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm">
            <PlusIcon />
            Insert
          </Button>
        }
      />
      <PopoverContent align="start" className="w-80 p-0">
        <Tabs defaultValue="blocks" className="gap-0">
          <TabsList className="m-3 mb-0 w-auto">
            <TabsTrigger value="blocks">Blocks</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
          </TabsList>
          <TabsContent value="blocks" className="max-h-80 overflow-y-auto p-3">
            <ul className="flex flex-col gap-1">
              {BLOCKS.map((b) => (
                <li key={b.key}>
                  <button
                    type="button"
                    onClick={() => insertAtCursor(b.snippet)}
                    className="flex w-full flex-col gap-0.5 px-2 py-1.5 text-left hover:bg-accent"
                  >
                    <span className="text-sm font-medium">{b.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {b.description}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </TabsContent>
          <TabsContent value="tokens" className="max-h-80 overflow-y-auto p-3">
            <div className="flex flex-col gap-4">
              {TOKEN_GROUPS.map((group) => (
                <div key={group.label} className="flex flex-col gap-1">
                  <p className="text-overline font-medium uppercase text-muted-foreground">
                    {group.label}
                  </p>
                  <ul className="flex flex-col">
                    {group.tokens.map((t) => (
                      <li key={t.name}>
                        <button
                          type="button"
                          onClick={() => insertAtCursor(`{{${t.name}}}`)}
                          className="block w-full px-2 py-1 text-left text-sm hover:bg-accent"
                          title={`{{${t.name}}}`}
                        >
                          {t.description}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}
