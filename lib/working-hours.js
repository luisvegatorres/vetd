export const DEFAULT_WORKING_HOURS = {
    startHour: 9,
    endHour: 17,
    days: [1, 2, 3, 4, 5],
    blocks: [],
};
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function isAvailabilityBlock(value) {
    if (typeof value !== "object" || value === null)
        return false;
    const v = value;
    if (typeof v.from !== "string" || !ISO_DATE_RE.test(v.from))
        return false;
    if (typeof v.to !== "string" || !ISO_DATE_RE.test(v.to))
        return false;
    if (v.reason !== undefined && typeof v.reason !== "string")
        return false;
    return true;
}
function isWorkingHoursObject(value) {
    if (typeof value !== "object" || value === null)
        return false;
    const v = value;
    return "startHour" in v && "endHour" in v && "days" in v;
}
/** Coerce an untrusted value (from DB JSON, form submit) into a safe WorkingHours. */
export function parseWorkingHours(value) {
    if (!isWorkingHoursObject(value))
        return DEFAULT_WORKING_HOURS;
    const startRaw = Number(value.startHour);
    const endRaw = Number(value.endHour);
    const start = Number.isFinite(startRaw)
        ? Math.max(0, Math.min(23, Math.floor(startRaw)))
        : DEFAULT_WORKING_HOURS.startHour;
    const end = Number.isFinite(endRaw)
        ? Math.max(start + 1, Math.min(24, Math.floor(endRaw)))
        : Math.max(start + 1, DEFAULT_WORKING_HOURS.endHour);
    const daysArr = Array.isArray(value.days) ? value.days : [];
    const days = Array.from(new Set(daysArr
        .map((d) => Math.floor(Number(d)))
        .filter((d) => Number.isFinite(d) && d >= 0 && d <= 6))).sort();
    const blocksArr = Array.isArray(value.blocks) ? value.blocks : [];
    const blocks = blocksArr.filter(isAvailabilityBlock).map((b) => {
        // Normalize so `from` is never after `to`.
        const [from, to] = b.from <= b.to ? [b.from, b.to] : [b.to, b.from];
        return {
            from,
            to,
            ...(b.reason ? { reason: b.reason.slice(0, 80) } : {}),
        };
    });
    return {
        startHour: start,
        endHour: end,
        days: days.length === 0 ? DEFAULT_WORKING_HOURS.days : days,
        blocks,
    };
}
/** True if `dateIso` (YYYY-MM-DD) falls in any block. */
export function isDateBlocked(dateIso, blocks) {
    for (const b of blocks) {
        if (dateIso >= b.from && dateIso <= b.to)
            return b;
    }
    return null;
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
];
