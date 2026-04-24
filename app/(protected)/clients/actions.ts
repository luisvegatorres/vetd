"use server"

import { revalidatePath } from "next/cache"

import { getRepCalendarBusy } from "@/lib/google/calendar-busy"
import { cancelMeetingAsRep } from "@/lib/google/calendar-cancel"
import { createMeetingAsRep } from "@/lib/google/calendar-create"
import { updateMeetingAsRep } from "@/lib/google/calendar-update"
import { logActivity, sourceRefFor } from "@/lib/interactions/log-activity"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { INDUSTRY_OPTIONS } from "@/lib/industries"
import { Constants, type Database } from "@/lib/supabase/types"

type ClientStatus = Database["public"]["Enums"]["client_status"]

export type CreateClientResult =
  | { ok: true; clientId: string }
  | { ok: false; error: string }

export type UpdateClientResult =
  | { ok: true }
  | { ok: false; error: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function titleCase(v: string) {
  return v.replace(
    /(^|\s)(\p{Ll})/gu,
    (_, pre, c) => pre + c.toLocaleUpperCase(),
  )
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function parseAssignedTo(formData: FormData): string | null | undefined {
  if (!formData.has("assigned_to")) return undefined
  const raw = String(formData.get("assigned_to") ?? "").trim()
  if (!raw || raw === "__unassigned__") return null
  return UUID_RE.test(raw) ? raw : undefined
}

export async function createNewClient(
  formData: FormData,
): Promise<CreateClientResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle()
  const canReassign = me?.role === "admin" || me?.role === "editor"

  const name = titleCase(String(formData.get("name") ?? "").trim())
  if (!name) return { ok: false, error: "Name is required" }

  const str = (key: string) => {
    const v = String(formData.get(key) ?? "").trim()
    return v.length > 0 ? v : null
  }

  const email = str("email")
  if (email && !EMAIL_RE.test(email)) {
    return { ok: false, error: "Enter a valid email address" }
  }

  const statusRaw = String(formData.get("status") ?? "")
  const statuses = Constants.public.Enums.client_status as readonly string[]
  const status: ClientStatus = statuses.includes(statusRaw)
    ? (statusRaw as ClientStatus)
    : "active_client"

  const rawCompany = str("company")
  const rawIndustry = str("industry")
  const industry =
    rawIndustry && (INDUSTRY_OPTIONS as readonly string[]).includes(rawIndustry)
      ? rawIndustry
      : null

  const assignedOverride = canReassign ? parseAssignedTo(formData) : undefined
  const assignedTo =
    assignedOverride !== undefined ? assignedOverride : auth.user.id

  const { data, error } = await supabase
    .from("clients")
    .insert({
      name,
      company: rawCompany ? titleCase(rawCompany) : null,
      email,
      phone: str("phone"),
      industry,
      location: str("location"),
      notes: str("notes"),
      status,
      assigned_to: assignedTo,
    })
    .select("id")
    .single()

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to create client" }
  }

  await logActivity({
    supabase,
    clientId: data.id,
    loggedBy: auth.user.id,
    type: "note",
    title: `New client — ${name}`,
    sourceRef: sourceRefFor("client-created", data.id),
  })

  revalidatePath("/clients")
  return { ok: true, clientId: data.id }
}

export async function updateClient(
  clientId: string,
  formData: FormData,
): Promise<UpdateClientResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  const name = titleCase(String(formData.get("name") ?? "").trim())
  if (!name) return { ok: false, error: "Name is required" }

  const str = (key: string) => {
    const v = String(formData.get(key) ?? "").trim()
    return v.length > 0 ? v : null
  }

  const email = str("email")
  if (email && !EMAIL_RE.test(email)) {
    return { ok: false, error: "Enter a valid email address" }
  }

  const statusRaw = String(formData.get("status") ?? "")
  const statuses = Constants.public.Enums.client_status as readonly string[]
  const status: ClientStatus = statuses.includes(statusRaw)
    ? (statusRaw as ClientStatus)
    : "lead"

  const rawCompany = str("company")
  const rawIndustry = str("industry")
  const industry =
    rawIndustry && (INDUSTRY_OPTIONS as readonly string[]).includes(rawIndustry)
      ? rawIndustry
      : null

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle()
  const canReassign = me?.role === "admin" || me?.role === "editor"

  const assignedOverride = canReassign ? parseAssignedTo(formData) : undefined

  const updatePayload: {
    name: string
    company: string | null
    email: string | null
    phone: string | null
    industry: string | null
    location: string | null
    notes: string | null
    status: ClientStatus
    assigned_to?: string | null
  } = {
    name,
    company: rawCompany ? titleCase(rawCompany) : null,
    email,
    phone: str("phone"),
    industry,
    location: str("location"),
    notes: str("notes"),
    status,
  }
  if (assignedOverride !== undefined) {
    updatePayload.assigned_to = assignedOverride
  }

  const { data: existing } = await supabase
    .from("clients")
    .select("assigned_to, status")
    .eq("id", clientId)
    .maybeSingle()

  const { error } = await supabase
    .from("clients")
    .update(updatePayload)
    .eq("id", clientId)

  if (error) return { ok: false, error: error.message }

  const today = new Date().toISOString().slice(0, 10)
  // Status change is the high-signal event; fall back to a daily-deduped edit
  // entry for everything else so silent field tweaks still count as a touch.
  if (existing?.status && existing.status !== status) {
    await logActivity({
      supabase,
      clientId,
      loggedBy: auth.user.id,
      type: "follow_up",
      title: `Status → ${status.replace("_", " ")}`,
      sourceRef: sourceRefFor("client-status", clientId, status),
    })
  } else {
    await logActivity({
      supabase,
      clientId,
      loggedBy: auth.user.id,
      type: "note",
      title: `Updated client — ${name}`,
      sourceRef: sourceRefFor("client-edit", clientId, today),
    })
  }

  // When an admin/editor reassigns the client, carry the ownership through to
  // the client's open deals so `sold_by` (and therefore commission) stays in
  // sync with the rep who now owns the relationship.
  if (
    assignedOverride !== undefined
    && existing?.assigned_to !== assignedOverride
  ) {
    const [projectsUpdate, subsUpdate] = await Promise.all([
      supabase
        .from("projects")
        .update({ sold_by: assignedOverride })
        .eq("client_id", clientId),
      supabase
        .from("subscriptions")
        .update({ sold_by: assignedOverride })
        .eq("client_id", clientId),
    ])
    if (projectsUpdate.error) {
      return { ok: false, error: projectsUpdate.error.message }
    }
    if (subsUpdate.error) {
      return { ok: false, error: subsUpdate.error.message }
    }
    revalidatePath("/pipeline")
    revalidatePath("/projects")
    revalidatePath("/commissions")
  }

  revalidatePath("/clients")
  return { ok: true }
}

export type CreateMeetingResult =
  | {
      ok: true
      eventId: string
      htmlLink: string
      hangoutLink: string | null
      startAt: string
    }
  | { ok: false; error: string; code?: "scope_missing" | "auth_expired" }

export async function createClientMeetingAction(input: {
  clientId: string
  projectId?: string | null
  title: string
  /** ISO-8601 UTC start. The client sends this from the browser (toISOString()). */
  startAt: string
  durationMinutes: number
  timeZone: string
  description?: string | null
  extraInvitees?: string[]
  includeMeetLink?: boolean
}): Promise<CreateMeetingResult> {
  if (!UUID_RE.test(input.clientId)) {
    return { ok: false, error: "Invalid client id" }
  }
  if (input.projectId && !UUID_RE.test(input.projectId)) {
    return { ok: false, error: "Invalid project id" }
  }
  const title = input.title.trim()
  if (!title) return { ok: false, error: "Title is required" }
  if (
    !Number.isFinite(input.durationMinutes) ||
    input.durationMinutes < 5 ||
    input.durationMinutes > 480
  ) {
    return { ok: false, error: "Duration must be between 5 and 480 minutes" }
  }
  const start = new Date(input.startAt)
  if (Number.isNaN(start.getTime())) {
    return { ok: false, error: "Invalid start time" }
  }
  if (start.getTime() < Date.now() - 5 * 60_000) {
    return { ok: false, error: "Start time is in the past" }
  }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  const clientRes = await supabase
    .from("clients")
    .select("id, name, email")
    .eq("id", input.clientId)
    .maybeSingle()
  if (clientRes.error || !clientRes.data) {
    return { ok: false, error: "Client not found" }
  }
  const client = clientRes.data
  if (!client.email) {
    return {
      ok: false,
      error: "Client has no email. Add one before scheduling.",
    }
  }

  const extraEmails = (input.extraInvitees ?? [])
    .map((e) => e.trim())
    .filter((e) => e.length > 0)
  for (const email of extraEmails) {
    if (!EMAIL_RE.test(email)) {
      return { ok: false, error: `Invalid invitee email: ${email}` }
    }
  }

  const attendees = [
    { email: client.email, displayName: client.name },
    ...extraEmails.map((email) => ({ email })),
  ]

  const result = await createMeetingAsRep({
    repId: auth.user.id,
    title,
    description: input.description?.trim() || null,
    startAt: start.toISOString(),
    durationMinutes: input.durationMinutes,
    timeZone: input.timeZone,
    attendees,
    includeMeetLink: input.includeMeetLink ?? true,
  })

  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      ...(result.code ? { code: result.code } : {}),
    }
  }

  // Log the scheduled meeting so it shows up on the client timeline
  // immediately (separate source_ref from the readonly gcal sync, so both
  // can coexist without conflict).
  const admin = createAdminClient()
  await admin.from("interactions").upsert(
    {
      client_id: client.id,
      logged_by: auth.user.id,
      type: "meeting",
      title,
      content: input.description?.trim() || null,
      project_id: input.projectId ?? null,
      source: "gcal",
      source_ref: result.eventId,
      occurred_at: result.startAt,
    },
    { onConflict: "source,source_ref", ignoreDuplicates: false },
  )

  revalidatePath(`/clients/${client.id}`)
  revalidatePath("/clients")
  if (input.projectId) revalidatePath(`/projects/${input.projectId}`)

  return {
    ok: true,
    eventId: result.eventId,
    htmlLink: result.htmlLink,
    hangoutLink: result.hangoutLink,
    startAt: result.startAt,
  }
}

export type UpdateMeetingResult =
  | {
      ok: true
      eventId: string
      htmlLink: string
      hangoutLink: string | null
      startAt: string
    }
  | { ok: false; error: string; code?: "scope_missing" | "auth_expired" }

/**
 * Updates an existing Google Calendar event created by the app and syncs
 * the matching `interactions` row. Keyed on eventId so both the timeline
 * Edit menu and dashboard NEXT UP actions reach the same server path.
 */
export async function updateClientMeetingAction(input: {
  eventId: string
  clientId: string
  projectId?: string | null
  title: string
  /** ISO-8601 UTC start. */
  startAt: string
  durationMinutes: number
  timeZone: string
  description?: string | null
  extraInvitees?: string[]
  includeMeetLink?: boolean
}): Promise<UpdateMeetingResult> {
  if (!input.eventId.trim()) return { ok: false, error: "Missing event id" }
  if (!UUID_RE.test(input.clientId)) {
    return { ok: false, error: "Invalid client id" }
  }
  if (input.projectId && !UUID_RE.test(input.projectId)) {
    return { ok: false, error: "Invalid project id" }
  }
  const title = input.title.trim()
  if (!title) return { ok: false, error: "Title is required" }
  if (
    !Number.isFinite(input.durationMinutes) ||
    input.durationMinutes < 5 ||
    input.durationMinutes > 480
  ) {
    return { ok: false, error: "Duration must be between 5 and 480 minutes" }
  }
  const start = new Date(input.startAt)
  if (Number.isNaN(start.getTime())) {
    return { ok: false, error: "Invalid start time" }
  }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  const clientRes = await supabase
    .from("clients")
    .select("id, name, email")
    .eq("id", input.clientId)
    .maybeSingle()
  if (clientRes.error || !clientRes.data) {
    return { ok: false, error: "Client not found" }
  }
  const client = clientRes.data
  if (!client.email) {
    return {
      ok: false,
      error: "Client has no email. Add one before updating.",
    }
  }

  const extraEmails = (input.extraInvitees ?? [])
    .map((e) => e.trim())
    .filter((e) => e.length > 0)
  for (const email of extraEmails) {
    if (!EMAIL_RE.test(email)) {
      return { ok: false, error: `Invalid invitee email: ${email}` }
    }
  }
  const attendees = [
    { email: client.email, displayName: client.name },
    ...extraEmails.map((email) => ({ email })),
  ]

  const result = await updateMeetingAsRep({
    repId: auth.user.id,
    eventId: input.eventId,
    title,
    description: input.description?.trim() || null,
    startAt: start.toISOString(),
    durationMinutes: input.durationMinutes,
    timeZone: input.timeZone,
    attendees,
    includeMeetLink: input.includeMeetLink === true,
  })

  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      ...(result.code ? { code: result.code } : {}),
    }
  }

  const admin = createAdminClient()
  await admin.from("interactions").upsert(
    {
      client_id: client.id,
      logged_by: auth.user.id,
      type: "meeting",
      title,
      content: input.description?.trim() || null,
      project_id: input.projectId ?? null,
      source: "gcal",
      source_ref: result.eventId,
      occurred_at: result.startAt,
    },
    { onConflict: "source,source_ref", ignoreDuplicates: false },
  )

  revalidatePath(`/clients/${client.id}`)
  revalidatePath("/clients")
  revalidatePath("/dashboard")
  if (input.projectId) revalidatePath(`/projects/${input.projectId}`)

  return {
    ok: true,
    eventId: result.eventId,
    htmlLink: result.htmlLink,
    hangoutLink: result.hangoutLink,
    startAt: result.startAt,
  }
}

export type CancelMeetingResult =
  | { ok: true }
  | { ok: false; error: string; code?: "scope_missing" | "auth_expired" }

/**
 * Cancels a Google Calendar event and marks the matching interactions
 * row as cancelled (by prefixing the title). Keyed on eventId.
 *
 * Keeping the row (rather than deleting) preserves the activity record;
 * `getUpcomingBookings()` already skips `[Cancelled]` titles so the card
 * won't surface the stale meeting.
 */
export async function cancelClientMeetingAction(input: {
  eventId: string
}): Promise<CancelMeetingResult> {
  if (!input.eventId.trim()) return { ok: false, error: "Missing event id" }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  const result = await cancelMeetingAsRep({
    repId: auth.user.id,
    eventId: input.eventId,
  })
  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      ...(result.code ? { code: result.code } : {}),
    }
  }

  const admin = createAdminClient()
  const { data: existing } = await admin
    .from("interactions")
    .select("id, client_id, project_id, title")
    .eq("source", "gcal")
    .eq("source_ref", input.eventId)
    .maybeSingle()

  if (existing) {
    const cancelledTitle = existing.title.startsWith("[Cancelled]")
      ? existing.title
      : `[Cancelled] ${existing.title}`
    await admin
      .from("interactions")
      .update({ title: cancelledTitle })
      .eq("id", existing.id)

    revalidatePath(`/clients/${existing.client_id}`)
    if (existing.project_id) {
      revalidatePath(`/projects/${existing.project_id}`)
    }
  }

  revalidatePath("/clients")
  revalidatePath("/dashboard")
  return { ok: true }
}

export type CalendarBusyResult =
  | { ok: true; busy: { start: string; end: string }[] }
  | { ok: false; error: string }

/**
 * Returns busy intervals on the rep's primary Google Calendar between two
 * ISO instants. Used by the Schedule Meeting picker to gray out time slots
 * that would overlap existing events.
 */
export async function getRepCalendarBusyAction(input: {
  timeMin: string
  timeMax: string
  timeZone?: string
}): Promise<CalendarBusyResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  const min = new Date(input.timeMin)
  const max = new Date(input.timeMax)
  if (Number.isNaN(min.getTime()) || Number.isNaN(max.getTime())) {
    return { ok: false, error: "Invalid time range" }
  }

  try {
    return await getRepCalendarBusy({
      repId: auth.user.id,
      timeMin: min.toISOString(),
      timeMax: max.toISOString(),
      timeZone: input.timeZone,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: message }
  }
}
