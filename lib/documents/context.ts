import "server-only"

import { site } from "@/lib/site"
import type { createClient as createServerClient } from "@/lib/supabase/server"

import type { TokenContext } from "./tokens"

type Supabase = Awaited<ReturnType<typeof createServerClient>>

/**
 * Pulls the raw rows that back a generated document and shapes them into a
 * flat token context (the shape referenced by `{{client.x}}` / `{{project.x}}`
 * tokens in templates). The resolved context is also stored on the document
 * row so future re-renders are deterministic even if the source data changes.
 */
export async function buildDocumentContext({
  supabase,
  clientId,
  projectId,
  subscriptionId,
}: {
  supabase: Supabase
  clientId: string
  projectId?: string | null
  subscriptionId?: string | null
}): Promise<TokenContext> {
  const clientRes = await supabase
    .from("clients")
    .select(
      "name, email, phone, company, address, location, industry",
    )
    .eq("id", clientId)
    .maybeSingle()

  const projectRes = projectId
    ? await supabase
        .from("projects")
        .select(
          "title, description, value, currency, deposit_rate, deposit_amount, start_date, deadline, product_type, financing_enabled",
        )
        .eq("id", projectId)
        .maybeSingle()
    : null

  const subscriptionRes = subscriptionId
    ? await supabase
        .from("subscriptions")
        .select("plan, product, monthly_rate, started_at")
        .eq("id", subscriptionId)
        .maybeSingle()
    : null

  const client = clientRes.data
  const project = projectRes?.data ?? null
  const subscription = subscriptionRes?.data ?? null

  const today = new Date()
  const todayISO = today.toISOString().slice(0, 10)
  const todayLong = today.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return {
    company: {
      name: site.name,
      tagline: site.tagline,
      email: site.email,
    },
    client: client
      ? {
          name: client.name ?? "",
          business: client.company ?? client.name ?? "",
          email: client.email ?? "",
          phone: client.phone ?? "",
          address: client.address ?? "",
          location: client.location ?? "",
          industry: client.industry ?? "",
        }
      : {},
    project: project
      ? {
          title: project.title ?? "",
          description: project.description ?? "",
          value: project.value != null ? formatMoney(Number(project.value)) : "",
          value_raw: project.value ?? "",
          currency: project.currency ?? "USD",
          deposit_rate: project.deposit_rate ?? "",
          deposit_amount:
            project.deposit_amount != null
              ? formatMoney(Number(project.deposit_amount))
              : "",
          start_date: project.start_date ?? "",
          deadline: project.deadline ?? "",
          product_type: project.product_type ?? "",
          financing: project.financing_enabled ? "Yes" : "No",
        }
      : {},
    subscription: subscription
      ? {
          plan: subscription.plan ?? "",
          product: subscription.product ?? "",
          monthly_rate:
            subscription.monthly_rate != null
              ? formatMoney(Number(subscription.monthly_rate))
              : "",
          started_at: subscription.started_at ?? "",
        }
      : {},
    today: todayISO,
    today_long: todayLong,
  }
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n)
}
