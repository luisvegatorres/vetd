// Browser-safe sample token context used by the template editor's live preview.
// Mirrors the shape produced by buildDocumentContext() in context.ts but with
// placeholder values so reps can see how tokens will render without needing a
// real client/project selected.

import { site } from "@/lib/site"

import type { TokenContext } from "./tokens"

export function buildSampleContext(): TokenContext {
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
    client: {
      name: "Jane Doe",
      business: "Sample Client Co.",
      email: "jane@sampleclient.com",
      phone: "+1 (555) 123-4567",
      address: "123 Market Street, Suite 400",
      location: "San Francisco, CA",
      industry: "Hospitality",
    },
    project: {
      title: "Website Redesign",
      description:
        "Full redesign and rebuild of the marketing site, CMS migration, and conversion optimization.",
      value: "$8,500",
      value_raw: 8500,
      currency: "USD",
      deposit_rate: 30,
      deposit_amount: "$2,550",
      start_date: todayISO,
      deadline: "2026-06-30",
      product_type: "business_website",
      financing: "Yes",
    },
    subscription: {
      plan: "Growth",
      product: "Managed marketing site",
      monthly_rate: "$247",
      started_at: todayISO,
    },
    today: todayISO,
    today_long: todayLong,
  }
}
