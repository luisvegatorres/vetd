import { ArrowRight } from "lucide-react"

import { KpiCard } from "@/components/dashboard/kpi-card"
import { MrrPanel } from "@/components/dashboard/mrr-panel"
import { PageHeader } from "@/components/dashboard/page-header"
import { createClient } from "@/lib/supabase/server"

function getGreeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

const KPIS = [
  {
    label: "Open Deal Value",
    value: "$86,200",
    badge: "+18.4%",
    badgeTone: "positive" as const,
    footer: "Across 8 deals",
  },
  {
    label: "Revenue This Month",
    value: "$22,700",
    badge: "+9.2%",
    badgeTone: "positive" as const,
    footer: "12 weeks · Paid via Stripe",
  },
  {
    label: "Commissions Owed",
    value: "$1,220",
    badge: "3 reps",
    footer: "Pending payout this cycle",
  },
  {
    label: (
      <>
        Lead <ArrowRight className="size-3" aria-hidden /> Won Rate
      </>
    ),
    value: "67%",
    badge: "+3.1pts",
    badgeTone: "positive" as const,
    footer: "Last 90 days · Avg 17 days in stage",
  },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", auth!.user!.id)
    .single()

  const firstName =
    profile?.full_name?.trim().split(/\s+/)[0] ??
    auth?.user?.email?.split("@")[0] ??
    "there"

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow={`${getGreeting()}, ${firstName}`}
        title="5 Deals Moving. 2 Payments Overdue. 4 Meetings Today."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((kpi, i) => (
          <KpiCard key={i} {...kpi} />
        ))}
      </div>

      <MrrPanel />
    </div>
  )
}
