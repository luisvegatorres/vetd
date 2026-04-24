export type AvailabilityBlock = {
  /** Inclusive start date, YYYY-MM-DD (local). */
  from: string
  /** Inclusive end date, YYYY-MM-DD (local). Same as `from` for a single day. */
  to: string
  /** Optional short label shown in tooltips / settings. */
  reason?: string
}

export type WorkingHours = {
  /** First bookable slot start time (local hour, 0–23). */
  startHour: number
  /** Last moment a meeting may end (local hour, 0–24). */
  endHour: number
  /** ISO dayOfWeek; 0 = Sun … 6 = Sat. */
  days: number[]
  /** One-off blocked ranges (vacations, sick days, conferences). */
  blocks: AvailabilityBlock[]
}

export const DEFAULT_WORKING_HOURS: WorkingHours = {
  startHour: 9,
  endHour: 17,
  days: [1, 2, 3, 4, 5],
  blocks: [],
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function isAvailabilityBlock(value: unknown): value is AvailabilityBlock {
  if (typeof value !== "object" || value === null) return false
  const v = value as Record<string, unknown>
  if (typeof v.from !== "string" || !ISO_DATE_RE.test(v.from)) return false
  if (typeof v.to !== "string" || !ISO_DATE_RE.test(v.to)) return false
  if (v.reason !== undefined && typeof v.reason !== "string") return false
  return true
}

function isWorkingHoursObject(value: unknown): value is {
  startHour: unknown
  endHour: unknown
  days: unknown
  blocks?: unknown
} {
  if (typeof value !== "object" || value === null) return false
  const v = value as Record<string, unknown>
  return "startHour" in v && "endHour" in v && "days" in v
}

/** Coerce an untrusted value (from DB JSON, form submit) into a safe WorkingHours. */
export function parseWorkingHours(value: unknown): WorkingHours {
  if (!isWorkingHoursObject(value)) return DEFAULT_WORKING_HOURS

  const startRaw = Number(value.startHour)
  const endRaw = Number(value.endHour)
  const start = Number.isFinite(startRaw)
    ? Math.max(0, Math.min(23, Math.floor(startRaw)))
    : DEFAULT_WORKING_HOURS.startHour
  const end = Number.isFinite(endRaw)
    ? Math.max(start + 1, Math.min(24, Math.floor(endRaw)))
    : Math.max(start + 1, DEFAULT_WORKING_HOURS.endHour)

  const daysArr = Array.isArray(value.days) ? value.days : []
  const days = Array.from(
    new Set(
      daysArr
        .map((d) => Math.floor(Number(d)))
        .filter((d) => Number.isFinite(d) && d >= 0 && d <= 6),
    ),
  ).sort()

  const blocksArr = Array.isArray(value.blocks) ? value.blocks : []
  const blocks = blocksArr.filter(isAvailabilityBlock).map((b) => {
    // Normalize so `from` is never after `to`.
    const [from, to] = b.from <= b.to ? [b.from, b.to] : [b.to, b.from]
    return {
      from,
      to,
      ...(b.reason ? { reason: b.reason.slice(0, 80) } : {}),
    }
  })

  return {
    startHour: start,
    endHour: end,
    days: days.length === 0 ? DEFAULT_WORKING_HOURS.days : days,
    blocks,
  }
}

/** True if `dateIso` (YYYY-MM-DD) falls in any block. */
export function isDateBlocked(
  dateIso: string,
  blocks: AvailabilityBlock[],
): AvailabilityBlock | null {
  for (const b of blocks) {
    if (dateIso >= b.from && dateIso <= b.to) return b
  }
  return null
}

/** ISO-day → short label used in settings + picker tooltips. */
export const DAY_LABELS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const

/** "13:30" → "1:30 PM". Leaves malformed input alone. */
export function formatTime12(hhmm: string): string {
  const parts = hhmm.split(":")
  if (parts.length !== 2) return hhmm
  const hour = Number(parts[0])
  const minute = Number(parts[1])
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return hhmm
  return formatHour12(hour, minute)
}

/**
 * Format a 24h hour (and optional minutes) as a 12h string.
 * 0 → 12:00 AM, 12 → 12:00 PM, 23 → 11:00 PM, 24 → 12:00 AM (midnight).
 */
export function formatHour12(hour: number, minute = 0): string {
  const normalized = ((hour % 24) + 24) % 24
  const suffix = normalized < 12 ? "AM" : "PM"
  const h12 = ((normalized + 11) % 12) + 1
  const minStr = minute.toString().padStart(2, "0")
  return `${h12}:${minStr} ${suffix}`
}
