"use client"

import { Save } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { updateMyTitleAction } from "@/app/(protected)/settings/actions"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PROFILE_TITLES } from "@/lib/profile/titles"

const CLEAR_VALUE = "__none__"

type Props = {
  initialTitle: string | null
}

export function ProfileTitleCard({ initialTitle }: Props) {
  const [title, setTitle] = React.useState(initialTitle ?? "")
  const [savedTitle, setSavedTitle] = React.useState(initialTitle ?? "")
  const [isSaving, startSaving] = React.useTransition()

  const isDirty = title !== savedTitle

  function handleSave() {
    startSaving(async () => {
      const result = await updateMyTitleAction(title)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setSavedTitle(result.title)
      setTitle(result.title)
      toast.success(result.title ? "Title saved" : "Title cleared")
    })
  }

  return (
    <section className="border border-border/60 p-6">
      <div className="space-y-1">
        <h2 className="font-heading text-base font-medium leading-tight">
          Your title
        </h2>
        <p className="text-sm text-muted-foreground">
          Available in outreach templates as the{" "}
          <code className="font-mono text-xs">{"{{rep.title}}"}</code> token.
          Use it to sign emails with your role (Founder, Sales Lead, etc.).
        </p>
      </div>

      <div className="mt-6 space-y-2">
        <Label htmlFor="title-select">Title</Label>
        <Select
          value={title || CLEAR_VALUE}
          onValueChange={(v) => setTitle(v && v !== CLEAR_VALUE ? v : "")}
        >
          <SelectTrigger id="title-select" className="w-full">
            <SelectValue placeholder="Pick a title">
              {(value) =>
                value && value !== CLEAR_VALUE ? (
                  (value as string)
                ) : (
                  <span className="text-muted-foreground">No title</span>
                )
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Title</SelectLabel>
              <SelectItem value={CLEAR_VALUE}>No title</SelectItem>
              {PROFILE_TITLES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className="gap-2"
        >
          <Save aria-hidden className="size-4" />
          {isSaving ? "Saving…" : "Save title"}
        </Button>
      </div>
    </section>
  )
}
