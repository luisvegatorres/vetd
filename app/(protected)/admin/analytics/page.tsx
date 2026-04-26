import { redirect } from "next/navigation"
import { Suspense } from "react"

import {
  AnalyticsKpis,
  AnalyticsKpisFallback,
  MrrPanelFallback,
  PipelineProgression,
  PipelineProgressionFallback,
  RecentPayments,
  RecentPaymentsFallback,
  TeamPerformance,
  TeamPerformanceFallback,
} from "@/components/dashboard/admin-analytics-sections"
import { MrrPanel } from "@/components/dashboard/mrr-panel"
import { createClient } from "@/lib/supabase/server"

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single()

  if (profile?.role !== "admin") redirect("/dashboard")

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Suspense fallback={<AnalyticsKpisFallback />}>
          <AnalyticsKpis />
        </Suspense>
      </div>

      <Suspense fallback={<MrrPanelFallback />}>
        <MrrPanel />
      </Suspense>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Suspense fallback={<PipelineProgressionFallback />}>
          <PipelineProgression />
        </Suspense>
        <Suspense fallback={<RecentPaymentsFallback />}>
          <RecentPayments />
        </Suspense>
      </div>

      <Suspense fallback={<TeamPerformanceFallback />}>
        <TeamPerformance />
      </Suspense>
    </div>
  )
}
