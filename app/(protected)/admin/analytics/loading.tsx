import {
  AnalyticsKpisFallback,
  MrrPanelFallback,
  PipelineProgressionFallback,
  RecentPaymentsFallback,
  TeamPerformanceFallback,
} from "@/components/dashboard/admin-analytics-sections"

export default function AnalyticsLoading() {
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsKpisFallback />
      </div>
      <MrrPanelFallback />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <PipelineProgressionFallback />
        <RecentPaymentsFallback />
      </div>
      <TeamPerformanceFallback />
    </div>
  )
}
