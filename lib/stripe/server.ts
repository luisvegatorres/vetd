import "server-only"

import Stripe from "stripe"

const secretKey = process.env.STRIPE_SECRET_KEY

if (!secretKey) {
  throw new Error(
    "STRIPE_SECRET_KEY is missing. Set it in .env.local (test) or Vercel env (live).",
  )
}

export const stripe = new Stripe(secretKey, {
  // Pin to a specific API version so Stripe upgrades on their side don't
  // change response shapes under us. Bump deliberately and test.
  apiVersion: "2026-04-22.dahlia",
  appInfo: {
    name: "Vetd CRM",
    url: process.env.NEXT_PUBLIC_APP_URL,
  },
  typescript: true,
})
