// Activity thresholds that determine whether a contractor rep is "actively
// working their book." Reps below the floor for N consecutive months are
// candidates for termination. At which point the admin flips
// profiles.employment_status to 'terminated' and the webhook's eligibility
// gate stops their residuals automatically.
//
// These numbers live in code (not the DB) so they can be tuned quickly as the
// team grows and real baselines emerge. Update the contract alongside any
// change; the rep's commission agreement references these thresholds.
export const REP_ACTIVITY_THRESHOLDS = {
  minNewLeads30d: 5,
  minInteractions30d: 15,
  // Consecutive 30d windows below threshold before the rep is flagged for
  // termination review. Surfaced via the `flagged` status on the activity
  // view; action remains manual.
  gracePeriodDays: 60,
  // New reps can't hit a 30-day threshold on day 3. Treat anyone under this
  // tenure as `ramping`; thresholds don't apply yet.
  rampPeriodDays: 30,
} as const

export type RepActivityRow = {
  repId: string
  name: string
  employmentStatus: "active" | "terminated"
  joinedAt: string | null
  newLeads30d: number
  newLeads60d: number
  interactions30d: number
  interactions60d: number
  lastInteractionAt: string | null
  newMrr90d: number
  newSubs90d: number
  activeSubsCount: number
  activeMrr: number
}

export type RepActivityStatus =
  | "ramping" // joined within rampPeriodDays; thresholds don't apply yet
  | "active" // meets both thresholds on the 30d window
  | "warning" // below threshold on 30d but meeting on 60d (slipping)
  | "flagged" // below threshold on both 30d and 60d; termination candidate
  | "terminated" // already terminated; residuals are frozen

export function repActivityStatus(row: RepActivityRow): RepActivityStatus {
  if (row.employmentStatus === "terminated") return "terminated"

  // Brand-new reps can't plausibly hit a 30d threshold. Give them runway.
  if (row.joinedAt) {
    const tenureDays =
      (Date.now() - new Date(row.joinedAt).getTime()) / (1000 * 60 * 60 * 24)
    if (tenureDays < REP_ACTIVITY_THRESHOLDS.rampPeriodDays) return "ramping"
  }

  const { minNewLeads30d, minInteractions30d } = REP_ACTIVITY_THRESHOLDS
  const meets30d =
    row.newLeads30d >= minNewLeads30d &&
    row.interactions30d >= minInteractions30d

  if (meets30d) return "active"

  // Halve the thresholds for the 60d window: ~double the time, similar
  // activity-per-day floor. Slipping reps hit "warning" before "flagged".
  const meets60d =
    row.newLeads60d >= minNewLeads30d * 2 &&
    row.interactions60d >= minInteractions30d * 2

  return meets60d ? "warning" : "flagged"
}
