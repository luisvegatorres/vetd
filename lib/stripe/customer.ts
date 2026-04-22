import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { stripe } from "@/lib/stripe/server"
import type { Database } from "@/lib/supabase/types"

type SupabaseLike = SupabaseClient<Database>

type ClientRef = {
  id: string
  email: string
  name: string | null
  stripeCustomerId: string | null
}

/**
 * Resolve the Stripe Customer for a CRM client, creating one if needed.
 *
 * - If the client row already stores a `stripe_customer_id`, verify it still
 *   exists in Stripe (not deleted) and reuse it.
 * - Otherwise, search Stripe by email to pick up any Customer the webhook
 *   already created (e.g. from an earlier subscription checkout that predated
 *   this helper), then fall back to creating a new Customer.
 * - Persist the resolved ID back to `clients.stripe_customer_id` so future
 *   checkouts short-circuit on the first branch.
 */
export async function ensureStripeCustomer(
  supabase: SupabaseLike,
  client: ClientRef,
): Promise<string> {
  if (client.stripeCustomerId) {
    try {
      const existing = await stripe.customers.retrieve(client.stripeCustomerId)
      if (!existing.deleted) return existing.id
    } catch (err) {
      // Customer was deleted in Stripe or the ID is stale — fall through and
      // create a fresh one below.
      console.warn(
        `[stripe customer] stored id ${client.stripeCustomerId} not retrievable, recreating`,
        err,
      )
    }
  }

  // Look up by email first so a client who paid via a legacy "guest" flow in
  // Stripe gets reattached to their existing Customer record.
  const search = await stripe.customers.list({ email: client.email, limit: 1 })
  const found = search.data[0]

  const customerId = found
    ? found.id
    : (
        await stripe.customers.create({
          email: client.email,
          name: client.name ?? undefined,
          metadata: { client_id: client.id },
        })
      ).id

  const { error } = await supabase
    .from("clients")
    .update({ stripe_customer_id: customerId })
    .eq("id", client.id)
  if (error) {
    console.error(
      "[stripe customer] failed to persist stripe_customer_id on client",
      error,
    )
  }

  return customerId
}
