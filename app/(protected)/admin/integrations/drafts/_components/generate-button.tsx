"use client"

import { Sparkles } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { generateDraft } from "../actions"

export function GenerateButton() {
  const [pending, startTransition] = useTransition()
  const [hint, setHint] = useState("")
  const [hintOpen, setHintOpen] = useState(false)

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateDraft({ hint: hint.trim() || undefined })
      if (result.ok) {
        toast.success("Draft generated")
        setHint("")
        setHintOpen(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        {hintOpen ? (
          <Input
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="Optional theme hint"
            disabled={pending}
            className="w-64"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleGenerate()
              }
              if (e.key === "Escape") {
                setHint("")
                setHintOpen(false)
              }
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setHintOpen(true)}
            className="text-xs uppercase text-muted-foreground hover:text-foreground"
            disabled={pending}
          >
            Add theme hint
          </button>
        )}
        <Button
          type="button"
          onClick={handleGenerate}
          disabled={pending}
          className="gap-2"
        >
          <Sparkles aria-hidden />
          {pending ? "Generating..." : "Generate draft"}
        </Button>
      </div>
      {pending ? (
        <p className="text-xs text-muted-foreground">
          Drafting caption. A few seconds.
        </p>
      ) : null}
    </div>
  )
}
