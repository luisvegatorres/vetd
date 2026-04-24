"use client"

import * as React from "react"
import {
  Calendar as CalendarIcon,
  CircleCheck,
  ExternalLink,
  Pencil,
  Video,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
  cancelClientMeetingAction,
  createClientMeetingAction,
  getRepCalendarBusyAction,
  updateClientMeetingAction,
} from "@/app/(protected)/clients/actions"
import { getMyWorkingHoursAction } from "@/app/(protected)/settings/actions"
import { cn } from "@/lib/utils"
import {
  DEFAULT_WORKING_HOURS,
  formatHour12,
  formatTime12,
  isDateBlocked,
  type WorkingHours,
} from "@/lib/working-hours"

type BusyInterval = { startMs: number; endMs: number }

const DURATION_OPTIONS: { value: string; label: string }[] = [
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
]

const DURATION_LABEL = new Map(
  DURATION_OPTIONS.map((o) => [o.value, o.label]),
)

function pad(n: number): string {
  return String(n).padStart(2, "0")
}

function dateToLocal(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function parseLocalDate(iso: string | undefined): Date | undefined {
  if (!iso) return undefined
  const [y, m, d] = iso.split("-").map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}

function buildTimeSlots(startHour: number, endHour: number): string[] {
  const slots: string[] = []
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      slots.push(`${pad(hour)}:${pad(minute)}`)
    }
  }
  return slots
}

function nextAvailableSlot(
  wh: WorkingHours,
): { date: string; time: string } {
  // Next quarter-hour at least 1h out, clamped into the rep's working-hours
  // window and rolled forward off non-working days / blocked dates so the
  // dialog never opens on a disabled day.
  const d = new Date()
  d.setHours(d.getHours() + 1)
  const rounded = Math.ceil(d.getMinutes() / 15) * 15
  d.setMinutes(rounded, 0, 0)

  if (d.getHours() < wh.startHour) {
    d.setHours(wh.startHour, 0, 0, 0)
  } else if (d.getHours() >= wh.endHour) {
    d.setDate(d.getDate() + 1)
    d.setHours(wh.startHour, 0, 0, 0)
  }

  for (let i = 0; i < 365; i++) {
    const iso = dateToLocal(d)
    const onWorkingDay = wh.days.includes(d.getDay())
    const blocked = !!isDateBlocked(iso, wh.blocks)
    if (onWorkingDay && !blocked) break
    d.setDate(d.getDate() + 1)
    d.setHours(wh.startHour, 0, 0, 0)
  }

  return {
    date: dateToLocal(d),
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

function combineDateAndTime(date: string, time: string): Date | null {
  if (!date || !time) return null
  const [y, m, d] = date.split("-").map(Number)
  const [h, mi] = time.split(":").map(Number)
  if (!y || !m || !d || Number.isNaN(h) || Number.isNaN(mi)) return null
  return new Date(y, m - 1, d, h, mi, 0, 0)
}

function formatTimeZone(tz: string): string {
  return tz.replace(/_/g, " ")
}

function formatConfirmationDate(date: string, time: string): string {
  const d = combineDateAndTime(date, time)
  if (!d) return ""
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

export type ExistingMeeting = {
  eventId: string
  title: string
  /** ISO-8601 UTC start. */
  startAt: string
  durationMinutes: number
  description: string | null
  hasMeetLink: boolean
}

export function ScheduleMeetingButton({
  client,
  projectId,
  trigger,
  variant = "outline",
  className,
  defaultTitle,
  existingMeeting,
}: {
  client: { id: string; name: string; email: string | null }
  projectId?: string | null
  trigger?: React.ReactElement
  variant?: React.ComponentProps<typeof Button>["variant"]
  className?: string
  defaultTitle?: string
  existingMeeting?: ExistingMeeting
}) {
  const isEditMode = !!existingMeeting
  const [workingHours, setWorkingHours] = React.useState<WorkingHours>(
    DEFAULT_WORKING_HOURS,
  )
  const initialSlot = React.useMemo(() => {
    if (existingMeeting) {
      const d = new Date(existingMeeting.startAt)
      return {
        date: dateToLocal(d),
        time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
      }
    }
    return nextAvailableSlot(workingHours)
    // Only on mount — once the rep's real working hours load we re-seed via
    // a dedicated effect below. Re-running on every workingHours change
    // would clobber a user-picked date.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [open, setOpen] = React.useState(false)
  const [title, setTitle] = React.useState(
    existingMeeting?.title ?? defaultTitle ?? `Meeting with ${client.name}`,
  )
  const [startDate, setStartDate] = React.useState(initialSlot.date)
  const [startTime, setStartTime] = React.useState(initialSlot.time)
  const [durationMinutes, setDurationMinutes] = React.useState(
    existingMeeting ? String(existingMeeting.durationMinutes) : "30",
  )
  const [description, setDescription] = React.useState(
    existingMeeting?.description ?? "",
  )
  const [includeMeet, setIncludeMeet] = React.useState(
    existingMeeting ? existingMeeting.hasMeetLink : true,
  )
  const [pending, startTransition] = React.useTransition()
  const [cancelPending, startCancelTransition] = React.useTransition()
  const [busyIntervals, setBusyIntervals] = React.useState<BusyInterval[]>([])
  const [busyLoading, setBusyLoading] = React.useState(false)
  const [workingHoursLoaded, setWorkingHoursLoaded] = React.useState(false)

  const TIME_SLOTS = React.useMemo(
    () => buildTimeSlots(workingHours.startHour, workingHours.endHour),
    [workingHours.startHour, workingHours.endHour],
  )

  const NON_WORKING_DAYS_OF_WEEK = React.useMemo(
    () => [0, 1, 2, 3, 4, 5, 6].filter((d) => !workingHours.days.includes(d)),
    [workingHours.days],
  )

  const blockedDateMatchers = React.useMemo(
    () =>
      workingHours.blocks.map((b) => ({
        from: parseLocalDate(b.from) ?? new Date(b.from),
        to: parseLocalDate(b.to) ?? new Date(b.to),
      })),
    [workingHours.blocks],
  )

  const timeZone = React.useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
    } catch {
      return "UTC"
    }
  }, [])

  const selectedDate = React.useMemo(
    () => parseLocalDate(startDate),
    [startDate],
  )

  // Disable past dates in the calendar — reps can only book ahead.
  const disabledBefore = React.useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return { before: today }
  }, [])

  // 60-day look-ahead: covers most scheduling horizons and lets us grey out
  // whole days (weekends-off, vacations, etc.) in the Calendar itself
  // without re-querying every time the selected date changes.
  const FREE_BUSY_DAYS_AHEAD = 60

  // Load the rep's availability (working hours + one-off blocks) when the
  // dialog opens. Kept separate from the freeBusy fetch so a slow Google
  // API doesn't block the working-hours UI.
  React.useEffect(() => {
    if (!open) return
    let cancelled = false
    void (async () => {
      const result = await getMyWorkingHoursAction()
      if (cancelled) return
      if (result.ok) {
        setWorkingHours(result.workingHours)
        setWorkingHoursLoaded(true)
        // If the currently-seeded slot falls outside the real schedule,
        // advance it. Skip in edit mode — we respect the event's original
        // time even if it falls outside the rep's working hours.
        if (!isEditMode) {
          const nextSlot = nextAvailableSlot(result.workingHours)
          setStartDate((prev) => prev || nextSlot.date)
          setStartTime((prev) => prev || nextSlot.time)
        }
      } else {
        setWorkingHoursLoaded(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, isEditMode])

  React.useEffect(() => {
    if (!open) return
    const now = new Date()
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    )
    const end = new Date(
      start.getTime() + FREE_BUSY_DAYS_AHEAD * 24 * 60 * 60 * 1000,
    )

    let cancelled = false
    setBusyLoading(true)
    void (async () => {
      const result = await getRepCalendarBusyAction({
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        timeZone,
      })
      if (cancelled) return
      if (result.ok) {
        setBusyIntervals(
          result.busy.map((b) => ({
            startMs: new Date(b.start).getTime(),
            endMs: new Date(b.end).getTime(),
          })),
        )
      } else {
        setBusyIntervals([])
      }
      setBusyLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [open, timeZone])

  function slotStatus(
    date: string,
    time: string,
  ): {
    disabled: boolean
    reason:
      | "past"
      | "busy"
      | "after_hours"
      | "non_working_day"
      | "blocked"
      | null
  } {
    const start = combineDateAndTime(date, time)
    if (!start) return { disabled: true, reason: "past" }
    if (!workingHours.days.includes(start.getDay())) {
      return { disabled: true, reason: "non_working_day" }
    }
    if (isDateBlocked(date, workingHours.blocks)) {
      return { disabled: true, reason: "blocked" }
    }
    if (start.getTime() < Date.now()) return { disabled: true, reason: "past" }
    const duration = Number(durationMinutes) || 30
    const end = new Date(start.getTime() + duration * 60_000)
    const cutoff = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
      workingHours.endHour,
      0,
      0,
      0,
    )
    if (end.getTime() > cutoff.getTime()) {
      return { disabled: true, reason: "after_hours" }
    }
    const overlaps = busyIntervals.some(
      (b) => start.getTime() < b.endMs && end.getTime() > b.startMs,
    )
    if (overlaps) return { disabled: true, reason: "busy" }
    return { disabled: false, reason: null }
  }

  // Pre-compute dates in the look-ahead window where every business-hour
  // slot is either past or blocked. Those dates get disabled in the Calendar
  // so weekends/vacations don't appear pickable.
  const fullyBusyDates = React.useMemo(() => {
    const result: Date[] = []
    const now = new Date()
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    )
    for (let i = 0; i < FREE_BUSY_DAYS_AHEAD; i++) {
      const day = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate() + i,
      )
      const iso = dateToLocal(day)
      const anyFree = TIME_SLOTS.some(
        (time) => !slotStatus(iso, time).disabled,
      )
      if (!anyFree) result.push(day)
    }
    return result
    // slotStatus closes over busyIntervals + durationMinutes; re-run when
    // either changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busyIntervals, durationMinutes])

  const selectedSlotStatus = slotStatus(startDate, startTime)

  if (!client.email) {
    return (
      <Button
        type="button"
        variant={variant}
        disabled
        className={cn("gap-2", className)}
      >
        <CalendarIcon aria-hidden /> Meet
      </Button>
    )
  }

  function resetAndClose() {
    setOpen(false)
    if (isEditMode) return
    const nextSlot = nextAvailableSlot(workingHours)
    setTitle(defaultTitle ?? `Meeting with ${client.name}`)
    setStartDate(nextSlot.date)
    setStartTime(nextSlot.time)
    setDurationMinutes("30")
    setDescription("")
    setIncludeMeet(true)
  }

  function handleSchedule() {
    if (!title.trim()) {
      toast.error("Add a title for the meeting")
      return
    }
    const combined = combineDateAndTime(startDate, startTime)
    if (!combined) {
      toast.error("Pick a date and time")
      return
    }

    startTransition(async () => {
      const result = existingMeeting
        ? await updateClientMeetingAction({
            eventId: existingMeeting.eventId,
            clientId: client.id,
            projectId: projectId ?? null,
            title: title.trim(),
            startAt: combined.toISOString(),
            durationMinutes: Number(durationMinutes),
            timeZone,
            description: description.trim() || null,
            includeMeetLink: includeMeet && !existingMeeting.hasMeetLink,
          })
        : await createClientMeetingAction({
            clientId: client.id,
            projectId: projectId ?? null,
            title: title.trim(),
            startAt: combined.toISOString(),
            durationMinutes: Number(durationMinutes),
            timeZone,
            description: description.trim() || null,
            includeMeetLink: includeMeet,
          })

      if (!result.ok) {
        if (result.code === "scope_missing") {
          toast.error("Reconnect Google to manage meetings", {
            description: result.error,
            action: {
              label: "Reconnect",
              onClick: () => {
                window.location.href = "/api/google/oauth/start"
              },
            },
          })
          return
        }
        toast.error(result.error)
        return
      }

      toast.success(
        existingMeeting ? "Meeting updated" : "Meeting scheduled",
        {
          description: result.hangoutLink
            ? `Attendees notified. Meet link included.`
            : `Attendees notified.`,
          action: {
            label: "Open",
            onClick: () =>
              window.open(result.htmlLink, "_blank", "noopener,noreferrer"),
          },
        },
      )
      resetAndClose()
    })
  }

  function handleCancelMeeting() {
    if (!existingMeeting) return
    if (
      !window.confirm(
        "Cancel this meeting? Attendees will be notified by Google Calendar.",
      )
    ) {
      return
    }
    startCancelTransition(async () => {
      const result = await cancelClientMeetingAction({
        eventId: existingMeeting.eventId,
      })
      if (!result.ok) {
        if (result.code === "scope_missing") {
          toast.error("Reconnect Google to cancel meetings", {
            description: result.error,
            action: {
              label: "Reconnect",
              onClick: () => {
                window.location.href = "/api/google/oauth/start"
              },
            },
          })
          return
        }
        toast.error(result.error)
        return
      }
      toast.success("Meeting cancelled", {
        description: "Attendees notified by Google Calendar.",
      })
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ??
          (isEditMode ? (
            <Button
              type="button"
              size="sm"
              variant={variant}
              className={cn("gap-2", className)}
            >
              <Pencil aria-hidden /> Edit
            </Button>
          ) : (
            <Button
              type="button"
              variant={variant}
              className={cn("gap-2", className)}
            >
              <CalendarIcon aria-hidden /> Meet
            </Button>
          ))
        }
      />
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit meeting" : "Schedule meeting"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode ? (
              <>
                Updates the Google Calendar event and notifies{" "}
                <span className="font-medium">{client.email}</span>. Times in
                your timezone:{" "}
                <span className="font-medium">
                  {formatTimeZone(timeZone)}
                </span>
                .
              </>
            ) : (
              <>
                Creates a Google Calendar event and emails an invite to{" "}
                <span className="font-medium">{client.email}</span>. Times
                saved in your timezone:{" "}
                <span className="font-medium">
                  {formatTimeZone(timeZone)}
                </span>
                . Availability from{" "}
                <a href="/settings" className="underline">
                  your settings
                </a>
                .
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-[1fr_auto]">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="meeting-title">Title</FieldLabel>
              <Input
                id="meeting-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={pending}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="meeting-duration">Duration</FieldLabel>
              <Select
                value={durationMinutes}
                onValueChange={(v) => setDurationMinutes(v ?? "30")}
                disabled={pending}
              >
                <SelectTrigger id="meeting-duration" className="w-full">
                  <SelectValue>
                    {(value) =>
                      (value && DURATION_LABEL.get(value)) ?? "Pick a duration"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="meeting-description">
                Agenda / description
              </FieldLabel>
              <Textarea
                id="meeting-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="What you want to cover. Shown on the invite."
                disabled={pending}
              />
            </Field>

            <Field orientation="horizontal">
              <Checkbox
                id="meeting-meet-link"
                checked={includeMeet}
                onCheckedChange={(v) => setIncludeMeet(v === true)}
                disabled={pending}
              />
              <FieldLabel
                htmlFor="meeting-meet-link"
                className="flex items-center gap-2 font-normal"
              >
                <Video aria-hidden className="size-4 text-muted-foreground" />
                Add a Google Meet link
              </FieldLabel>
            </Field>
          </FieldGroup>

          <Field>
            <FieldLabel>When</FieldLabel>
            <div className="grid grid-cols-1 overflow-hidden rounded-md border md:grid-cols-[auto_10rem]">
              <div className="p-3">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => {
                    if (d) setStartDate(dateToLocal(d))
                  }}
                  defaultMonth={selectedDate}
                  disabled={[
                    disabledBefore,
                    { dayOfWeek: NON_WORKING_DAYS_OF_WEEK },
                    ...blockedDateMatchers,
                    ...fullyBusyDates,
                  ]}
                  showOutsideDays={false}
                  className="bg-transparent p-0 [--cell-size:--spacing(9)]"
                  formatters={{
                    formatWeekdayName: (date) =>
                      date.toLocaleString("en-US", { weekday: "short" }),
                  }}
                />
              </div>
              <ScrollArea className="h-60 border-t md:h-[21rem] md:border-t-0 md:border-l">
                <div className="flex flex-col gap-1.5 p-3">
                  {TIME_SLOTS.map((time) => {
                    const status = slotStatus(startDate, time)
                    const selected = startTime === time
                    return (
                      <Button
                        key={time}
                        type="button"
                        size="sm"
                        variant={selected ? "default" : "outline"}
                        onClick={() => setStartTime(time)}
                        disabled={pending || status.disabled}
                        title={
                          status.reason === "busy"
                            ? "Overlaps a calendar event"
                            : status.reason === "past"
                              ? "Already passed"
                              : status.reason === "after_hours"
                                ? "Meeting would run past working hours"
                                : status.reason === "non_working_day"
                                  ? "Not a working day"
                                  : status.reason === "blocked"
                                    ? "Day blocked in your availability settings"
                                    : undefined
                        }
                        className={cn(
                          "w-full shadow-none",
                          status.reason === "busy" &&
                            "line-through opacity-60",
                        )}
                      >
                        {formatTime12(time)}
                      </Button>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>
            <FieldDescription className="flex items-center gap-2">
              {busyLoading ? (
                <span>Checking your calendar…</span>
              ) : !startDate || !startTime ? (
                <span>Pick a date and time.</span>
              ) : selectedSlotStatus.reason === "busy" ? (
                <span className="text-destructive">
                  {formatTime12(startTime)} overlaps an existing calendar
                  event — pick another slot.
                </span>
              ) : selectedSlotStatus.reason === "past" ? (
                <span className="text-destructive">
                  {formatTime12(startTime)} has already passed — pick a
                  later slot.
                </span>
              ) : selectedSlotStatus.reason === "after_hours" ? (
                <span className="text-destructive">
                  This meeting would run past{" "}
                  {formatHour12(workingHours.endHour)}. Pick an earlier slot
                  or shorter duration.
                </span>
              ) : selectedSlotStatus.reason === "non_working_day" ? (
                <span className="text-destructive">
                  That day isn't in your working days.
                </span>
              ) : selectedSlotStatus.reason === "blocked" ? (
                <span className="text-destructive">
                  That day is blocked on your availability. Edit it in{" "}
                  <a href="/settings" className="underline">
                    Settings
                  </a>
                  .
                </span>
              ) : (
                <>
                  <CircleCheck
                    aria-hidden
                    className="size-4 stroke-green-600 dark:stroke-green-400"
                  />
                  <span>
                    {formatConfirmationDate(startDate, startTime)} at{" "}
                    <span className="font-medium">
                      {formatTime12(startTime)}
                    </span>
                  </span>
                </>
              )}
            </FieldDescription>
          </Field>
        </div>

        <DialogFooter>
          {isEditMode ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelMeeting}
              disabled={pending || cancelPending}
              className="mr-auto text-destructive hover:text-destructive"
            >
              {cancelPending ? (
                <>
                  <Spinner />
                  Cancelling…
                </>
              ) : (
                "Cancel meeting"
              )}
            </Button>
          ) : null}
          <DialogClose render={<Button variant="outline" />}>
            {isEditMode ? "Close" : "Cancel"}
          </DialogClose>
          <Button
            onClick={handleSchedule}
            disabled={pending || cancelPending || selectedSlotStatus.disabled}
            className="gap-2"
          >
            {pending ? (
              <>
                <Spinner />
                {isEditMode ? "Saving…" : "Scheduling…"}
              </>
            ) : isEditMode ? (
              "Save changes"
            ) : (
              <>
                <ExternalLink aria-hidden />
                Create event & send invite
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
