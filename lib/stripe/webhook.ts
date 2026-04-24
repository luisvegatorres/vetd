import "server-only"

import type Stripe from "stripe"

import { stripe } from "./server"

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

/**
 * Verify a Stripe webhook payload using the `Stripe-Signature` header and the
 * `STRIPE_WEBHOOK_SECRET` from env. Throws if signature is invalid, missing,
 * or if the secret env var isn't set. Never silently accept.
 *
 * Local dev: run `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
 * and copy the `whsec_...` it prints into `.env.local`.
 */
export function verifyStripeWebhook(
  rawBody: string,
  signatureHeader: string | null,
): Stripe.Event {
  if (!webhookSecret) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET is missing. Webhook signature verification is required.",
    )
  }
  if (!signatureHeader) {
    throw new Error("Missing Stripe-Signature header")
  }
  return stripe.webhooks.constructEvent(rawBody, signatureHeader, webhookSecret)
}
