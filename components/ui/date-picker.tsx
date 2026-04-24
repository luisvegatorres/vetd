"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

/**
 * Parse/format YYYY-MM-DD dates without crossing into the local timezone.
 * Critical for <input type="date"> compat: `new Date("2026-04-20")` would
 * otherwise shift to UTC and show as the 19th in negative-offset zones.
 */
function parseIsoDate(iso: string | null | undefined): Date | undefined {
  if (!iso) return undefined
  const [y, m, d] = iso.split("-").map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}

function toIsoDate(date: Date | undefined): string {
  if (!date) return ""
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function formatLabel(date: Date | undefined): string {
  if (!date) return ""
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export type DatePickerProps = {
  id?: string
  name?: string
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({
  id,
  name,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Pick a date",
  disabled,
  className,
}: DatePickerProps) {
  const isControlled = value !== undefined
  const [internal, setInternal] = React.useState<string>(defaultValue ?? "")
  const current = isControlled ? (value ?? "") : internal
  const selected = parseIsoDate(current)
  const [open, setOpen] = React.useState(false)

  function handleSelect(next: Date | undefined) {
    const iso = toIsoDate(next)
    if (!isControlled) setInternal(iso)
    onValueChange?.(iso)
    setOpen(false)
  }

  return (
    <>
      {name ? <input type="hidden" name={name} value={current} /> : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              disabled={disabled}
              className={cn(
                "w-full justify-between font-normal",
                !selected && "text-muted-foreground",
                className,
              )}
            >
              {selected ? formatLabel(selected) : placeholder}
              <CalendarIcon aria-hidden className="opacity-60" />
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </>
  )
}
