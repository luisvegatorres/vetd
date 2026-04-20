"use server"

import { revalidatePath } from "next/cache"

import { subscriptionPlans, type BillablePlanId } from "@/lib/site"
import { stripe } from "@/lib/stripe/server"
import { createClient } from "@/lib/supabase/server"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const BILLABLE_PLAN_IDS = Object.keys(subscriptionPlans) as BillablePlanId[]

export type CreateCheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string }

/**
 * Create a Stripe Checkout Session for a recurring subscription. The session
 * embeds CRM metadata (client_id, sold_by, optional pre-existing
 * subscription_id) so the webhook can attach the resulting Stripe subscription
 * to the right CRM rows.
 *
 * Returns a URL the rep can copy/send to the client. Stripe-hosted checkout
 * collects payment details and redirects to NEXT_PUBLIC_APP_URL on completion.
 */
export async function createSubscriptionCheckoutSession(input: {
  clientId: string
  planId: BillablePlanId
  /**
   * Optional CRM subscription row to update on completion. Pass when the rep
   * has already created a draft subscription row; omit to let the webhook
   * insert a new row.
   */
  subscriptionId?: string
}): Promise<CreateCheckoutResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  if (!UUID_RE.test(input.clientId)) {
    return { ok: false, error: "Invalid client" }
  }
  if (!BILLABLE_PLAN_IDS.includes(input.planId)) {
    return { ok: false, error: "Unknown plan" }
  }

  const plan = subscriptionPlans[input.planId]
  if (!plan.stripePriceId) {
    return {
      ok: false,
      error: `Stripe price ID not configured for ${plan.label} (set STRIPE_PRICE_ID_${input.planId.toUpperCase()})`,
    }
  }

  const client = await supabase
    .from("clients")
    .select("id, name, email, assigned_to")
    .eq("id", input.clientId)
    .maybeSingle()
  if (client.error || !client.data) {
    return { ok: false, error: "Client not found" }
  }
  if (!client.data.email) {
    return {
      ok: false,
      error: "Client has no email — add one before sending a checkout link",
    }
  }

  const soldBy = client.data.assigned_to ?? auth.user.id

  if (input.subscriptionId && !UUID_RE.test(input.subscriptionId)) {
    return { ok: false, error: "Invalid subscription id" }
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      customer_email: client.data.email,
      client_reference_id: client.data.id,
      metadata: {
        client_id: client.data.id,
        sold_by: soldBy,
        ...(input.subscriptionId
          ? { subscription_id: input.subscriptionId }
          : {}),
      },
      subscription_data: {
        metadata: {
          client_id: client.data.id,
          sold_by: soldBy,
        },
      },
      success_url: `${appUrl}/clients/${client.data.id}?checkout=success`,
      cancel_url: `${appUrl}/clients/${client.data.id}?checkout=cancelled`,
      allow_promotion_codes: true,
    })

    if (!session.url) {
      return { ok: false, error: "Stripe did not return a checkout URL" }
    }

    revalidatePath(`/clients/${client.data.id}`)
    return { ok: true, url: session.url }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Stripe checkout failed"
    console.error("[stripe checkout] create session failed", err)
    return { ok: false, error: message }
  }
}
