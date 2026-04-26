import { Suspense } from "react"

import {
  CommissionsKpi,
  OpenDealsKpi,
  RevenueKpi,
  WinRateKpi,
} from "@/components/dashboard/dashboard-kpis"
import { KpiCardSkeleton } from "@/components/dashboard/kpi-card"
import { PipelineSnapshot } from "@/components/dashboard/pipeline-snapshot"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { TodaysFocus } from "@/components/dashboard/todays-focus"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function PipelineSnapshotFallback() {
  return (
    <Card className="flex h-full flex-col gap-4 p-6">
      <Skeleton className="h-4 w-32 rounded-none" />
      <Skeleton className="h-8 w-40 rounded-none" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 w-full rounded-none" />
        <Skeleton className="h-20 w-full rounded-none" />
      </div>
      <Skeleton className="h-32 w-full rounded-none" />
    </Card>
  )
}

function TodaysFocusFallback() {
  return (
    <Card className="flex h-full flex-col gap-4 p-6">
      <Skeleton className="h-4 w-32 rounded-none" />
      <Skeleton className="h-16 w-full rounded-none" />
      <Skeleton className="h-16 w-full rounded-none" />
      <Skeleton className="h-16 w-full rounded-none" />
    </Card>
  )
}

export default function DashboardPage() {
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Suspense fallback={<KpiCardSkeleton />}>
          <OpenDealsKpi />
        </Suspense>
        <Suspense fallback={<KpiCardSkeleton />}>
          <RevenueKpi />
        </Suspense>
        <Suspense fallback={<KpiCardSkeleton />}>
          <CommissionsKpi />
        </Suspense>
        <Suspense fallback={<KpiCardSkeleton />}>
          <WinRateKpi />
        </Suspense>
      </div>

      <QuickActions />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Suspense fallback={<PipelineSnapshotFallback />}>
            <PipelineSnapshot />
          </Suspense>
        </div>
        <Suspense fallback={<TodaysFocusFallback />}>
          <TodaysFocus />
        </Suspense>
      </div>
    </div>
  )
}
