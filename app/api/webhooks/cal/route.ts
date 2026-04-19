import "server-only"

import crypto from "node:crypto"

import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import type { Json } from "@/lib/supabase/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type CalAttendee = {
  name?: string
  email?: string
  timeZone?: string
}

type CalResponse = { label?: string; value?: unknown } | string | null

type CalPayload = {
  uid?: string
  rescheduleUid?: string
  title?: string
  startTime?: string
  endTime?: string
  eventTitle?: string
  attendees?: CalAttendee[]
  organizer?: CalAttendee
  additionalNotes?: string
  responses?: Record<string, CalResponse>
  userFieldsResponses?: Record<string, CalResponse>
  location?: string
  videoCallData?: { url?: string }
  cancellationReason?: string
}

type CalWebhookEvent = {
  triggerEvent?: string
  createdAt?: string
  payload?: CalPayload
}

const CAL_SOURCE = "cal.com"

function verifySignature(raw: string, signature: string | null, secret: string) {
  if (!signature) return false
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex")
  const provided = signature.replace(/^sha256=/, "")
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(provided, "hex"),
    )
  } catch {
    return false
  }
}

function firstAttendee(payload: CalPayload): CalAttendee | null {
  return payload.attendees?.[0] ?? null
}

function readResponse(payload: CalPayload, key: string): string | null {
  const raw =
    payload.responses?.[key] ?? payload.userFieldsResponses?.[key] ?? null
  if (raw == null) return null
  if (typeof raw === "string") return raw.trim() || null
  if (typeof raw === "object" && "value" in raw) {
    const v = raw.value
    if (typeof v === "string") return v.trim() || null
    if (typeof v === "number" || typeof v === "boolean") return String(v)
  }
  return null
}

function buildNotes(payload: CalPayload, extraPrefix?: string) {
  const parts: string[] = []
  if (extraPrefix) parts.push(extraPrefix)
  const projectType = readResponse(payload, "project_type")
  const budgetRange = readResponse(payload, "budget_range")
  const projectDetails = readResponse(payload, "project_details")
  const paymentPreference = readResponse(payload, "payment_preference")
  if (projectType) parts.push(`Looking to build: ${projectType}`)
  if (budgetRange) parts.push(`Budget: ${budgetRange}`)
  if (paymentPreference) parts.push(`Payment preference: ${paymentPreference}`)
  if (projectDetails) parts.push(projectDetails)
  if (payload.additionalNotes) parts.push(payload.additionalNotes)
  if (payload.location) parts.push(`Location: ${payload.location}`)
  if (payload.videoCallData?.url) parts.push(`Join: ${payload.videoCallData.url}`)
  if (payload.cancellationReason) {
    parts.push(`Cancellation reason: ${payload.cancellationReason}`)
  }
  return parts.join("\n\n") || null
}

async function findOrCreateClient(
  supabase: ReturnType<typeof createAdminClient>,
  attendee: CalAttendee,
  enrichment: {
    intent?: string | null
    budget?: string | null
    notes?: string | null
    paymentPreference?: string | null
  },
) {
  const email = attendee.email?.toLowerCase().trim()
  if (!email) return null

  const existing = await supabase
    .from("clients")
    .select("id, intent, budget, notes, intake")
    .eq("email", email)
    .maybeSingle()

  if (existing.data) {
    const patch: {
      intent?: string
      budget?: string
      notes?: string
      intake?: Json
    } = {}
    if (!existing.data.intent && enrichment.intent) patch.intent = enrichment.intent
    if (!existing.data.budget && enrichment.budget) patch.budget = enrichment.budget
    if (!existing.data.notes && enrichment.notes) patch.notes = enrichment.notes
    if (enrichment.paymentPreference) {
      const currentIntake =
        (existing.data.intake as Record<string, unknown> | null) ?? {}
      if (!currentIntake.payment_preference) {
        patch.intake = {
          ...currentIntake,
          payment_preference: enrichment.paymentPreference,
        } as Json
      }
    }
    if (Object.keys(patch).length > 0) {
      await supabase.from("clients").update(patch).eq("id", existing.data.id)
    }
    return existing.data.id
  }

  const inserted = await supabase
    .from("clients")
    .insert({
      name: attendee.name?.trim() || email,
      email,
      source: "contact_form",
      status: "lead",
      intent: enrichment.intent ?? null,
      budget: enrichment.budget ?? null,
      notes: enrichment.notes ?? null,
      intake: enrichment.paymentPreference
        ? ({ payment_preference: enrichment.paymentPreference } as Json)
        : null,
    })
    .select("id")
    .single()

  if (inserted.error) {
    console.error("[cal webhook] client insert failed", inserted.error)
    return null
  }
  return inserted.data.id
}

export async function POST(request: Request) {
  const secret = process.env.CAL_WEBHOOK_SECRET
  if (!secret) {
    console.error("[cal webhook] CAL_WEBHOOK_SECRET not set")
    return NextResponse.json({ error: "not_configured" }, { status: 500 })
  }

  const raw = await request.text()
  const signature =
    request.headers.get("x-cal-signature-256") ??
    request.headers.get("X-Cal-Signature-256")

  if (!verifySignature(raw, signature, secret)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 })
  }

  let event: CalWebhookEvent
  try {
    event = JSON.parse(raw) as CalWebhookEvent
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const trigger = event.triggerEvent
  const payload = event.payload
  if (!trigger || !payload?.uid) {
    return NextResponse.json({ ok: true, skipped: "no_uid" })
  }

  const supabase = createAdminClient()
  const attendee = firstAttendee(payload)
  if (!attendee?.email) {
    return NextResponse.json({ ok: true, skipped: "no_attendee" })
  }

  const clientId = await findOrCreateClient(supabase, attendee, {
    intent: readResponse(payload, "project_type"),
    budget: readResponse(payload, "budget_range"),
    notes: readResponse(payload, "project_details"),
    paymentPreference: readResponse(payload, "payment_preference"),
  })
  if (!clientId) {
    return NextResponse.json({ error: "client_failed" }, { status: 500 })
  }

  const title =
    payload.title ?? payload.eventTitle ?? "Discovery call"
  const occurredAt = payload.startTime ?? new Date().toISOString()

  if (trigger === "BOOKING_CREATED" || trigger === "BOOKING_RESCHEDULED") {
    if (trigger === "BOOKING_RESCHEDULED" && payload.rescheduleUid) {
      await supabase
        .from("interactions")
        .update({
          title: `[Rescheduled] ${title}`,
          content: buildNotes(payload, "Superseded by a rescheduled booking."),
        })
        .eq("source", CAL_SOURCE)
        .eq("source_ref", payload.rescheduleUid)
    }

    const { error } = await supabase.from("interactions").upsert(
      {
        client_id: clientId,
        type: "meeting",
        title,
        content: buildNotes(payload),
        occurred_at: occurredAt,
        source: CAL_SOURCE,
        source_ref: payload.uid,
        source_payload: payload as unknown as Json,
      },
      { onConflict: "source,source_ref" },
    )

    if (error) {
      console.error("[cal webhook] interaction upsert failed", error)
      return NextResponse.json({ error: "upsert_failed" }, { status: 500 })
    }
  } else if (trigger === "BOOKING_CANCELLED") {
    const { error } = await supabase
      .from("interactions")
      .update({
        title: `[Cancelled] ${title}`,
        content: buildNotes(payload, "Booking cancelled."),
      })
      .eq("source", CAL_SOURCE)
      .eq("source_ref", payload.uid)

    if (error) {
      console.error("[cal webhook] cancel update failed", error)
      return NextResponse.json({ error: "update_failed" }, { status: 500 })
    }
  } else {
    return NextResponse.json({ ok: true, skipped: `unhandled:${trigger}` })
  }

  return NextResponse.json({ ok: true })
}
