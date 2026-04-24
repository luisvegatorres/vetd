"use client"

import * as React from "react"
import { CalendarX, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { updateMyWorkingHoursAction } from "@/app/(protected)/settings/actions"
import {
  DAY_LABELS,
  formatHour12,
  type AvailabilityBlock,
  type WorkingHours,
} from "@/lib/working-hours"

// ISO day ordering: Mon-first feels more natural for a work schedule UI.
const WEEKDAY_ORDER: number[] = [1, 2, 3, 4, 5, 6, 0]

// Start-time options: every hour from 12 AM (0) to 11 PM (23).
const START_HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => ({
  value: String(h),
  label: formatHour12(h),
}))

// End-time options: every hour from 1 AM (1) to 12 AM / midnight (24).
const END_HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const h = i + 1
  return { value: String(h), label: formatHour12(h) }
})

const START_HOUR_LABEL = new Map(
  START_HOUR_OPTIONS.map((o) => [o.value, o.label]),
)
const END_HOUR_LABEL = new Map(
  END_HOUR_OPTIONS.map((o) => [o.value, o.label]),
)

function formatRangeLabel(from: string, to: string): string {
  if (from === to) return from
  return `${from} → ${to}`
}

export function AvailabilityCard({
  initialWorkingHours,
}: {
  initialWorkingHours: WorkingHours
}) {
  const [startHour, setStartHour] = React.useState(
    String(initialWorkingHours.startHour),
  )
  const [endHour, setEndHour] = React.useState(
    String(initialWorkingHours.endHour),
  )
  const [days, setDays] = React.useState<Set<number>>(
    new Set(initialWorkingHours.days),
  )
  const [blocks, setBlocks] = React.useState<AvailabilityBlock[]>(
    initialWorkingHours.blocks,
  )

  const [newFrom, setNewFrom] = React.useState("")
  const [newTo, setNewTo] = React.useState("")
  const [newReason, setNewReason] = React.useState("")

  const [pending, startTransition] = React.useTransition()

  function toggleDay(day: number) {
    setDays((prev) => {
      const next = new Set(prev)
      if (next.has(day)) next.delete(day)
      else next.add(day)
      return next
    })
  }

  function addBlock() {
    if (!newFrom) {
      toast.error("Pick a start date for the block")
      return
    }
    const to = newTo || newFrom
    if (to < newFrom) {
      toast.error("End date is before the start date")
      return
    }
    setBlocks((prev) => [
      ...prev,
      {
        from: newFrom,
        to,
        ...(newReason.trim() ? { reason: newReason.trim() } : {}),
      },
    ])
    setNewFrom("")
    setNewTo("")
    setNewReason("")
  }

  function removeBlock(index: number) {
    setBlocks((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSave() {
    const start = Number(startHour)
    const end = Number(endHour)
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      toast.error("Start and end hours must be numbers")
      return
    }
    if (end <= start) {
      toast.error("End hour must be after start hour")
      return
    }
    if (days.size === 0) {
      toast.error("Pick at least one working day")
      return
    }

    startTransition(async () => {
      const result = await updateMyWorkingHoursAction({
        startHour: start,
        endHour: end,
        days: Array.from(days),
        blocks,
      })
      if (result.ok) {
        toast.success("Availability saved")
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <section className="border border-border/60 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-medium">Availability</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            When clients can schedule meetings with you. Google Calendar's
            public API doesn't expose your working hours, so Vetd stores them
            here. Events already on your Google Calendar still block those
            specific time slots automatically.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <FieldGroup>
          <Field>
            <FieldLabel>Working days</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_ORDER.map((d) => {
                const active = days.has(d)
                return (
                  <Button
                    key={d}
                    type="button"
                    size="sm"
                    variant={active ? "default" : "outline"}
                    onClick={() => toggleDay(d)}
                    disabled={pending}
                    className="w-14"
                  >
                    {DAY_LABELS[d]}
                  </Button>
                )
              })}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="availability-start">Start time</FieldLabel>
              <Select
                value={startHour}
                onValueChange={(v) => v != null && setStartHour(v)}
                disabled={pending}
              >
                <SelectTrigger
                  id="availability-start"
                  className="w-full"
                >
                  <SelectValue>
                    {(v) => (v && START_HOUR_LABEL.get(v)) ?? "Pick a time"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {START_HOUR_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                Earliest meeting start of the day.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="availability-end">End time</FieldLabel>
              <Select
                value={endHour}
                onValueChange={(v) => v != null && setEndHour(v)}
                disabled={pending}
              >
                <SelectTrigger
                  id="availability-end"
                  className="w-full"
                >
                  <SelectValue>
                    {(v) => (v && END_HOUR_LABEL.get(v)) ?? "Pick a time"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {END_HOUR_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                Meetings must finish by this time.
              </FieldDescription>
            </Field>
          </div>

          <Field>
            <FieldLabel>Blocked dates</FieldLabel>
            <FieldDescription>
              One-off ranges (vacations, conferences, days off). Inclusive on
              both ends.
            </FieldDescription>

            {blocks.length > 0 ? (
              <ul className="flex flex-col divide-y divide-border/60 border border-border/60">
                {blocks.map((b, i) => (
                  <li
                    key={`${b.from}-${b.to}-${i}`}
                    className="flex items-center gap-3 px-3 py-2"
                  >
                    <CalendarX
                      aria-hidden
                      className="size-4 text-muted-foreground"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium tabular-nums">
                        {formatRangeLabel(b.from, b.to)}
                      </p>
                      {b.reason ? (
                        <p className="text-xs text-muted-foreground">
                          {b.reason}
                        </p>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeBlock(i)}
                      disabled={pending}
                      aria-label="Remove block"
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="grid grid-cols-1 gap-2 md:grid-cols-[auto_auto_1fr_auto]">
              <DatePicker
                value={newFrom}
                onValueChange={setNewFrom}
                placeholder="From"
                disabled={pending}
              />
              <DatePicker
                value={newTo}
                onValueChange={setNewTo}
                placeholder="To (optional)"
                disabled={pending}
              />
              <Input
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="Reason (optional)"
                disabled={pending}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addBlock}
                disabled={pending}
                className="gap-2"
              >
                <Plus aria-hidden />
                Add block
              </Button>
            </div>
          </Field>
        </FieldGroup>
      </div>

      <div className="mt-6 flex items-center justify-end gap-2">
        <Button onClick={handleSave} disabled={pending} className="gap-2">
          {pending ? (
            <>
              <Spinner />
              Saving…
            </>
          ) : (
            "Save availability"
          )}
        </Button>
      </div>
    </section>
  )
}
