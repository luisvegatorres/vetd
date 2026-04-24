"use server"

import { revalidatePath } from "next/cache"

import { depositLinkEmail } from "@/lib/email/templates"
import { sendGmailAsRep } from "@/lib/google/gmail-send"
import { logActivity, sourceRefFor } from "@/lib/interactions/log-activity"
import { subscriptionPlans, type BillablePlanId } from "@/lib/site"
import { ensureStripeCustomer } from "@/lib/stripe/customer"
import { stripe } from "@/lib/stripe/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export type CancelSubscriptionResult =
  | { ok: true }
  | { ok: false; error: string }

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
    .select("id, name, email, assigned_to, stripe_customer_id")
    .eq("id", input.clientId)
    .maybeSingle()
  if (client.error || !client.data) {
    return { ok: false, error: "Client not found" }
  }
  if (!client.data.email) {
    return {
      ok: false,
      error: "Client has no email. Add one before sending a checkout link.",
    }
  }

  const soldBy = client.data.assigned_to ?? auth.user.id

  const stripeCustomerId = await ensureStripeCustomer(supabase, {
    id: client.data.id,
    email: client.data.email,
    name: client.data.name,
    stripeCustomerId: client.data.stripe_customer_id,
  })

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
      customer: stripeCustomerId,
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
      success_url: `${appUrl}/clients?client=${client.data.id}&checkout=success`,
      cancel_url: `${appUrl}/clients?client=${client.data.id}&checkout=cancelled`,
      allow_promotion_codes: true,
    })

    if (!session.url) {
      return { ok: false, error: "Stripe did not return a checkout URL" }
    }

    await logActivity({
      supabase,
      clientId: client.data.id,
      loggedBy: auth.user.id,
      type: "email",
      title: `Sent ${plan.label} checkout link`,
      sourceRef: sourceRefFor("subscription-link", session.id),
    })

    revalidatePath(`/clients/${client.data.id}`)
    return { ok: true, url: session.url }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Stripe checkout failed"
    console.error("[stripe checkout] create session failed", err)
    return { ok: false, error: message }
  }
}

/**
 * Create a Stripe Checkout Session for a project's deposit (one-time payment).
 * The session metadata carries the project_id + client_id so the webhook can
 * mark the deposit paid and insert a `payments` row.
 *
 * Returns a URL the rep can copy/send to the client.
 */
export async function createProjectDepositCheckoutSession(input: {
  projectId: string
}): Promise<CreateCheckoutResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  if (!UUID_RE.test(input.projectId)) {
    return { ok: false, error: "Invalid project" }
  }

  const { data: project, error } = await supabase
    .from("projects")
    .select(
      `
        id, title, deposit_amount, deposit_paid_at, stage, payment_status,
        client:clients!projects_client_id_fkey (id, email, name, stripe_customer_id)
      `,
    )
    .eq("id", input.projectId)
    .maybeSingle()

  if (error || !project) return { ok: false, error: "Project not found" }
  if (project.deposit_paid_at) {
    return { ok: false, error: "Deposit already paid" }
  }
  if (project.stage === "cancelled" || project.stage === "completed") {
    return { ok: false, error: "Project is not active" }
  }
  const depositAmount =
    project.deposit_amount != null ? Number(project.deposit_amount) : 0
  if (depositAmount <= 0) {
    return { ok: false, error: "No deposit amount set" }
  }

  const client = Array.isArray(project.client)
    ? project.client[0]
    : project.client
  if (!client?.email) {
    return {
      ok: false,
      error: "Client has no email. Add one before sending a checkout link.",
    }
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"

  const stripeCustomerId = await ensureStripeCustomer(supabase, {
    id: client.id,
    email: client.email,
    name: client.name,
    stripeCustomerId: client.stripe_customer_id,
  })

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(depositAmount * 100),
            product_data: { name: `Deposit — ${project.title}` },
          },
          quantity: 1,
        },
      ],
      customer: stripeCustomerId,
      client_reference_id: project.id,
      metadata: {
        kind: "project_deposit",
        project_id: project.id,
        client_id: client.id,
      },
      payment_intent_data: {
        metadata: {
          kind: "project_deposit",
          project_id: project.id,
          client_id: client.id,
        },
      },
      success_url: `${appUrl}/projects/${project.id}?checkout=success`,
      cancel_url: `${appUrl}/projects/${project.id}?checkout=cancelled`,
    })

    if (!session.url) {
      return { ok: false, error: "Stripe did not return a checkout URL" }
    }

    await supabase
      .from("projects")
      .update({
        stripe_checkout_session_id: session.id,
        payment_status:
          project.payment_status === "paid" ? "paid" : "link_sent",
      })
      .eq("id", project.id)

    await logActivity({
      supabase,
      clientId: client.id,
      loggedBy: auth.user.id,
      type: "email",
      title: `Sent deposit link — ${project.title}`,
      projectId: project.id,
      sourceRef: sourceRefFor("deposit-link", session.id),
    })

    revalidatePath("/projects")
    revalidatePath(`/projects/${project.id}`)
    return { ok: true, url: session.url }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Stripe checkout failed"
    console.error("[stripe deposit] create session failed", err)
    return { ok: false, error: message }
  }
}

export type SendDepositLinkResult =
  | { ok: true; messageId: string; clientEmail: string }
  | { ok: false; error: string; code?: "scope_missing" | "auth_expired" }

/**
 * Generate a Stripe deposit checkout session (if not already created) and
 * email the link to the client from the rep's Gmail. Replies land in the
 * rep's inbox — that's the whole point of going through the Gmail API
 * instead of the no-reply@ SMTP relay used for marketing notifications.
 */
export async function sendDepositLinkAction(input: {
  projectId: string
  message?: string | null
}): Promise<SendDepositLinkResult> {
  if (!UUID_RE.test(input.projectId)) {
    return { ok: false, error: "Invalid project" }
  }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  const projectRes = await supabase
    .from("projects")
    .select(
      `
        id, title, deposit_amount,
        client:clients!projects_client_id_fkey (id, name, email)
      `,
    )
    .eq("id", input.projectId)
    .maybeSingle()
  if (projectRes.error || !projectRes.data) {
    return { ok: false, error: "Project not found" }
  }

  const project = projectRes.data
  const client = Array.isArray(project.client)
    ? project.client[0]
    : project.client
  if (!client?.email) {
    return {
      ok: false,
      error: "Client has no email. Add one before sending.",
    }
  }

  const checkoutResult = await createProjectDepositCheckoutSession({
    projectId: input.projectId,
  })
  if (!checkoutResult.ok) return { ok: false, error: checkoutResult.error }

  const admin = createAdminClient()
  const [repProfileRes, repIntegrationRes] = await Promise.all([
    admin
      .from("profiles")
      .select("full_name")
      .eq("id", auth.user.id)
      .maybeSingle(),
    admin
      .from("rep_integrations")
      .select("google_email")
      .eq("rep_id", auth.user.id)
      .eq("provider", "google")
      .maybeSingle(),
  ])
  const repName =
    repProfileRes.data?.full_name ?? auth.user.email ?? "Your Vetd rep"
  const fromEmail =
    repIntegrationRes.data?.google_email ?? auth.user.email ?? ""
  if (!fromEmail) {
    return {
      ok: false,
      error: "Connect Google from Settings before sending.",
      code: "scope_missing",
    }
  }

  const depositAmount =
    project.deposit_amount != null ? Number(project.deposit_amount) : 0
  const amountFormatted = depositAmount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  })

  const rendered = await depositLinkEmail({
    projectTitle: project.title,
    clientName: client.name,
    repName,
    amountFormatted,
    url: checkoutResult.url,
    message: input.message,
  })

  const sendResult = await sendGmailAsRep({
    repId: auth.user.id,
    to: client.email,
    fromEmail,
    fromName: repName,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  })
  if (!sendResult.ok) {
    return {
      ok: false,
      error: sendResult.error,
      ...(sendResult.code ? { code: sendResult.code } : {}),
    }
  }

  await logActivity({
    supabase,
    clientId: client.id,
    loggedBy: auth.user.id,
    type: "email",
    title: `Emailed deposit link — ${project.title}`,
    content: `Sent to ${client.email} from ${fromEmail}`,
    projectId: project.id,
    sourceRef: sourceRefFor(
      "gmail-send",
      "deposit",
      project.id,
      sendResult.messageId,
    ),
  })

  revalidatePath(`/projects/${project.id}`)
  revalidatePath(`/clients/${client.id}`)

  return {
    ok: true,
    messageId: sendResult.messageId,
    clientEmail: client.email,
  }
}

/**
 * Cancel a subscription. If the row is linked to Stripe we cancel there
 * (the webhook then flips the CRM row to canceled); otherwise we update the
 * CRM row directly. That covers legacy/manually-recorded subscriptions that
 * never went through Stripe Checkout.
 */
export async function cancelClientSubscription(input: {
  subscriptionId: string
}): Promise<CancelSubscriptionResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Not authenticated" }

  if (!UUID_RE.test(input.subscriptionId)) {
    return { ok: false, error: "Invalid subscription id" }
  }

  const { data: sub, error } = await supabase
    .from("subscriptions")
    .select("id, client_id, stripe_subscription_id, status")
    .eq("id", input.subscriptionId)
    .maybeSingle()
  if (error || !sub) {
    return { ok: false, error: "Subscription not found" }
  }
  if (sub.status === "canceled") {
    return { ok: false, error: "Subscription is already canceled" }
  }

  if (sub.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(sub.stripe_subscription_id)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Stripe cancellation failed"
      console.error("[stripe cancel] failed", err)
      return { ok: false, error: message }
    }
  } else {
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: "canceled",
        canceled_at: new Date().toISOString().slice(0, 10),
      })
      .eq("id", sub.id)
    if (updateError) {
      console.error("[subscription cancel] update failed", updateError)
      return { ok: false, error: "Failed to cancel subscription" }
    }
  }

  revalidatePath("/clients")
  revalidatePath(`/clients/${sub.client_id}`)
  return { ok: true }
}
