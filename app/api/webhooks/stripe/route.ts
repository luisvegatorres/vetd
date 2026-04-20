import "server-only"

import { NextResponse } from "next/server"
import type Stripe from "stripe"

import { findPlanByStripePriceId } from "@/lib/site"
import { stripe } from "@/lib/stripe/server"
import { verifyStripeWebhook } from "@/lib/stripe/webhook"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Json } from "@/lib/supabase/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type AdminClient = ReturnType<typeof createAdminClient>

// ============================================================================
// Idempotency
// ============================================================================

async function alreadyProcessed(
  supabase: AdminClient,
  event: Stripe.Event,
): Promise<boolean> {
  const { error } = await supabase
    .from("processed_stripe_events")
    .insert({ id: event.id, event_type: event.type })
  if (!error) return false
  // Unique-violation on primary key = already processed.
  if (error.code === "23505") return true
  console.error("[stripe webhook] processed_events insert failed", error)
  // Fail open — better to process twice than skip silently.
  return false
}

// ============================================================================
// Helpers
// ============================================================================

type SessionMetadata = {
  client_id?: string
  sold_by?: string
  subscription_id?: string
}

function readSessionMetadata(
  metadata: Stripe.Metadata | null | undefined,
): SessionMetadata {
  return {
    client_id: metadata?.client_id?.trim() || undefined,
    sold_by: metadata?.sold_by?.trim() || undefined,
    subscription_id: metadata?.subscription_id?.trim() || undefined,
  }
}

function priceIdFromSubscription(sub: Stripe.Subscription): string | null {
  return sub.items.data[0]?.price.id ?? null
}

// In API 2026-03-25.dahlia, invoice.subscription/payment_intent were removed.
// Subscription ID lives on invoice.parent.subscription_details.subscription;
// payment intent on invoice.payments.data[0].payment.payment_intent;
// the line item's price ID on line.pricing.price_details.price.

function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const parent = invoice.parent
  if (!parent || parent.type !== "subscription_details") return null
  const subRef = parent.subscription_details?.subscription
  if (!subRef) return null
  return typeof subRef === "string" ? subRef : subRef.id
}

function paymentIntentIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const payment = invoice.payments?.data?.[0]?.payment
  if (!payment) return null
  const pi = payment.payment_intent
  if (!pi) return null
  return typeof pi === "string" ? pi : pi.id
}

function priceIdFromInvoiceLine(line: Stripe.InvoiceLineItem): string | null {
  const priceRef = line.pricing?.price_details?.price
  if (!priceRef) return null
  return typeof priceRef === "string" ? priceRef : priceRef.id
}

function periodMonthFromInvoice(invoice: Stripe.Invoice): string | null {
  const periodStart = invoice.lines.data[0]?.period?.start
  if (!periodStart) return null
  const date = new Date(periodStart * 1000)
  // First-of-month UTC, ISO date format (YYYY-MM-DD) for the date column.
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10)
}

async function isRepActive(
  supabase: AdminClient,
  repId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("employment_status")
    .eq("id", repId)
    .maybeSingle()
  if (error || !data) return false
  return data.employment_status === "active"
}

async function promoteClientToActive(
  supabase: AdminClient,
  clientId: string,
) {
  const { error } = await supabase
    .from("clients")
    .update({ status: "active_client" })
    .eq("id", clientId)
    .in("status", ["lead", "qualified", "archived", "lost"])
  if (error) {
    console.error("[stripe webhook] client status promote failed", error)
  }
}

async function findSubscriptionByStripeId(
  supabase: AdminClient,
  stripeSubscriptionId: string,
) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "id, client_id, sold_by, status, first_payment_at, stripe_price_id",
    )
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .maybeSingle()
  if (error) {
    console.error("[stripe webhook] subscription lookup failed", error)
    return null
  }
  return data
}

// ============================================================================
// Event handlers
// ============================================================================

async function handleCheckoutCompleted(
  supabase: AdminClient,
  session: Stripe.Checkout.Session,
) {
  if (session.mode !== "subscription") return
  const stripeSubId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id
  if (!stripeSubId) return

  const meta = readSessionMetadata(session.metadata)
  if (!meta.client_id) {
    console.warn(
      `[stripe webhook] checkout ${session.id} missing client_id metadata`,
    )
    return
  }

  // Pull the subscription to learn the price ID + plan tier.
  const stripeSub = await stripe.subscriptions.retrieve(stripeSubId)
  const priceId = priceIdFromSubscription(stripeSub)
  const plan = priceId ? findPlanByStripePriceId(priceId) : undefined
  if (!plan) {
    console.warn(
      `[stripe webhook] checkout ${session.id} price ${priceId} did not match a known plan`,
    )
    return
  }

  const stripeCustomerId =
    typeof session.customer === "string"
      ? session.customer
      : (session.customer?.id ?? null)

  // If a CRM subscription row already exists (created by the rep before sending
  // the link), update it. Otherwise insert a fresh row.
  if (meta.subscription_id) {
    const { error } = await supabase
      .from("subscriptions")
      .update({
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubId,
        stripe_price_id: priceId,
        stripe_status: stripeSub.status,
        plan: plan.label,
        monthly_rate: plan.monthlyRate,
        signing_bonus_amount: plan.signingBonus,
        monthly_residual_amount: plan.monthlyResidual,
        sold_by: meta.sold_by ?? null,
      })
      .eq("id", meta.subscription_id)
    if (error) {
      console.error("[stripe webhook] subscription update failed", error)
    }
    await promoteClientToActive(supabase, meta.client_id)
    return
  }

  const { error } = await supabase.from("subscriptions").insert({
    client_id: meta.client_id,
    sold_by: meta.sold_by ?? null,
    product: "Website",
    plan: plan.label,
    monthly_rate: plan.monthlyRate,
    started_at: new Date().toISOString().slice(0, 10),
    signing_bonus_amount: plan.signingBonus,
    monthly_residual_amount: plan.monthlyResidual,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: stripeSubId,
    stripe_price_id: priceId,
    stripe_status: stripeSub.status,
  })
  if (error) {
    console.error("[stripe webhook] subscription insert failed", error)
  }
  await promoteClientToActive(supabase, meta.client_id)
}

async function handleDepositCompleted(
  supabase: AdminClient,
  session: Stripe.Checkout.Session,
) {
  if (session.mode !== "payment") return
  if (session.metadata?.kind !== "project_deposit") return

  const projectId = session.metadata?.project_id?.trim()
  const clientId = session.metadata?.client_id?.trim()
  if (!projectId) {
    console.warn(
      `[stripe webhook] deposit ${session.id} missing project_id metadata`,
    )
    return
  }

  const piId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null)
  const amount = session.amount_total != null ? session.amount_total / 100 : 0

  const { error: paymentError } = await supabase.from("payments").upsert(
    {
      project_id: projectId,
      stripe_payment_intent_id: piId,
      amount,
      currency: (session.currency ?? "usd").toUpperCase(),
      status: "paid",
      raw: session as unknown as Json,
    },
    { onConflict: "stripe_payment_intent_id" },
  )
  if (paymentError) {
    console.error("[stripe webhook] deposit payment upsert failed", paymentError)
  }

  const paidAt = new Date().toISOString()
  const { error: projectError } = await supabase
    .from("projects")
    .update({
      deposit_paid_at: paidAt,
      paid_at: paidAt,
      payment_status: "paid",
    })
    .eq("id", projectId)
  if (projectError) {
    console.error("[stripe webhook] deposit project update failed", projectError)
  }

  // Auto-advance pipeline stage: a paid deposit is the hard signal that the
  // deal is won. Only advance pre-sale rows — don't clobber completed or
  // cancelled projects (e.g. a late payment on a refunded deal).
  const { error: stageError } = await supabase
    .from("projects")
    .update({ stage: "active" })
    .eq("id", projectId)
    .in("stage", ["proposal", "negotiation"])
  if (stageError) {
    console.error("[stripe webhook] deposit stage advance failed", stageError)
  }

  if (clientId) {
    await promoteClientToActive(supabase, clientId)
  }
}

async function handleInvoicePaid(
  supabase: AdminClient,
  invoice: Stripe.Invoice,
) {
  const stripeSubId = subscriptionIdFromInvoice(invoice)
  if (!stripeSubId || !invoice.id) return

  const sub = await findSubscriptionByStripeId(supabase, stripeSubId)
  if (!sub) {
    console.warn(
      `[stripe webhook] invoice ${invoice.id} has no matching CRM subscription`,
    )
    return
  }

  // Record the invoice (idempotent on stripe_invoice_id).
  const paidAt = invoice.status_transitions?.paid_at
    ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
    : new Date().toISOString()
  const piId = paymentIntentIdFromInvoice(invoice)
  const lineItem = invoice.lines.data[0]

  const { error: invoiceError } = await supabase
    .from("subscription_invoices")
    .upsert(
      {
        subscription_id: sub.id,
        stripe_invoice_id: invoice.id,
        stripe_payment_intent_id: piId,
        amount_paid: invoice.amount_paid / 100,
        currency: invoice.currency.toUpperCase(),
        status: invoice.status ?? "paid",
        billing_reason: invoice.billing_reason ?? null,
        period_start: lineItem?.period?.start
          ? new Date(lineItem.period.start * 1000).toISOString()
          : null,
        period_end: lineItem?.period?.end
          ? new Date(lineItem.period.end * 1000).toISOString()
          : null,
        paid_at: paidAt,
        raw: invoice as unknown as Json,
      },
      { onConflict: "stripe_invoice_id" },
    )
  if (invoiceError) {
    console.error("[stripe webhook] invoice upsert failed", invoiceError)
    return
  }

  // Resolve the plan + commission amounts from the price the invoice was for.
  const priceId = (lineItem ? priceIdFromInvoiceLine(lineItem) : null) ??
    sub.stripe_price_id
  const plan = priceId ? findPlanByStripePriceId(priceId) : undefined
  if (!plan) {
    console.warn(
      `[stripe webhook] invoice ${invoice.id} price ${priceId} did not match a plan — skipping commission`,
    )
    return
  }

  // Reactivate the subscription if it was previously at_risk/canceled.
  await supabase
    .from("subscriptions")
    .update({ status: "active", stripe_status: "active" })
    .eq("id", sub.id)

  // A paid invoice proves the client is paying — promote them off the leads
  // list. Skip if already active_client/at_risk/canceled to avoid redundant
  // writes and to preserve downstream lifecycle states.
  await promoteClientToActive(supabase, sub.client_id)

  // First invoice: set first_payment_at + insert signing bonus ledger row.
  if (invoice.billing_reason === "subscription_create") {
    if (!sub.first_payment_at) {
      await supabase
        .from("subscriptions")
        .update({ first_payment_at: paidAt })
        .eq("id", sub.id)
    }

    if (sub.sold_by && (await isRepActive(supabase, sub.sold_by))) {
      const { error: ledgerError } = await supabase
        .from("subscription_commission_ledger")
        .insert({
          subscription_id: sub.id,
          rep_id: sub.sold_by,
          kind: "signing_bonus",
          period_month: null,
          amount: plan.signingBonus,
        })
      if (ledgerError && ledgerError.code !== "23505") {
        console.error(
          "[stripe webhook] signing bonus ledger insert failed",
          ledgerError,
        )
      }
    }
    return
  }

  // Recurring invoice: insert monthly residual ledger row (idempotent on the
  // (subscription_id, kind, period_month) unique constraint).
  if (
    invoice.billing_reason === "subscription_cycle" ||
    invoice.billing_reason === "subscription_update"
  ) {
    const periodMonth = periodMonthFromInvoice(invoice)
    if (!periodMonth) return
    if (!sub.sold_by || !(await isRepActive(supabase, sub.sold_by))) return

    const { error: ledgerError } = await supabase
      .from("subscription_commission_ledger")
      .insert({
        subscription_id: sub.id,
        rep_id: sub.sold_by,
        kind: "monthly_residual",
        period_month: periodMonth,
        amount: plan.monthlyResidual,
      })
    if (ledgerError && ledgerError.code !== "23505") {
      console.error(
        "[stripe webhook] monthly residual ledger insert failed",
        ledgerError,
      )
    }
  }
}

async function handleInvoiceFailed(
  supabase: AdminClient,
  invoice: Stripe.Invoice,
) {
  const stripeSubId = subscriptionIdFromInvoice(invoice)
  if (!stripeSubId || !invoice.id) return

  const sub = await findSubscriptionByStripeId(supabase, stripeSubId)
  if (!sub) return

  await supabase
    .from("subscriptions")
    .update({ status: "at_risk", stripe_status: "past_due" })
    .eq("id", sub.id)

  await supabase.from("subscription_invoices").upsert(
    {
      subscription_id: sub.id,
      stripe_invoice_id: invoice.id,
      amount_paid: 0,
      currency: invoice.currency.toUpperCase(),
      status: invoice.status ?? "failed",
      billing_reason: invoice.billing_reason ?? null,
      raw: invoice as unknown as Json,
    },
    { onConflict: "stripe_invoice_id" },
  )
}

async function handleSubscriptionUpdated(
  supabase: AdminClient,
  stripeSub: Stripe.Subscription,
) {
  const sub = await findSubscriptionByStripeId(supabase, stripeSub.id)
  if (!sub) return

  const priceId = priceIdFromSubscription(stripeSub)
  const plan = priceId ? findPlanByStripePriceId(priceId) : undefined
  const planChanged = !!plan && priceId !== sub.stripe_price_id

  await supabase
    .from("subscriptions")
    .update({
      stripe_status: stripeSub.status,
      ...(planChanged && plan
        ? {
            stripe_price_id: priceId,
            plan: plan.label,
            monthly_rate: plan.monthlyRate,
            signing_bonus_amount: plan.signingBonus,
            monthly_residual_amount: plan.monthlyResidual,
          }
        : {}),
    })
    .eq("id", sub.id)
}

async function handleSubscriptionDeleted(
  supabase: AdminClient,
  stripeSub: Stripe.Subscription,
) {
  const sub = await findSubscriptionByStripeId(supabase, stripeSub.id)
  if (!sub) return

  await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      stripe_status: stripeSub.status,
      canceled_at: new Date().toISOString().slice(0, 10),
    })
    .eq("id", sub.id)
}

// ============================================================================
// Route
// ============================================================================

export async function POST(request: Request) {
  const raw = await request.text()
  const signature = request.headers.get("stripe-signature")

  let event: Stripe.Event
  try {
    event = verifyStripeWebhook(raw, signature)
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid_signature"
    console.warn(`[stripe webhook] signature verification failed: ${message}`)
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 })
  }

  const supabase = createAdminClient()
  if (await alreadyProcessed(supabase, event)) {
    return NextResponse.json({ ok: true, idempotent: true })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(supabase, session)
        await handleDepositCompleted(supabase, session)
        break
      }
      case "invoice.payment_succeeded":
        await handleInvoicePaid(supabase, event.data.object as Stripe.Invoice)
        break
      case "invoice.payment_failed":
        await handleInvoiceFailed(supabase, event.data.object as Stripe.Invoice)
        break
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          supabase,
          event.data.object as Stripe.Subscription,
        )
        break
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          supabase,
          event.data.object as Stripe.Subscription,
        )
        break
      default:
        return NextResponse.json({ ok: true, skipped: event.type })
    }
  } catch (err) {
    console.error(`[stripe webhook] handler error for ${event.type}`, err)
    // Roll back the idempotency entry so Stripe retries the event.
    await supabase.from("processed_stripe_events").delete().eq("id", event.id)
    return NextResponse.json({ error: "handler_failed" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
