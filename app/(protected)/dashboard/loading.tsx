import { KpiCardSkeleton } from "@/components/dashboard/kpi-card"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="flex flex-col gap-4 p-6 xl:col-span-2">
          <Skeleton className="h-4 w-32 rounded-none" />
          <Skeleton className="h-8 w-40 rounded-none" />
          <Skeleton className="h-32 w-full rounded-none" />
        </Card>
        <Card className="flex flex-col gap-4 p-6">
          <Skeleton className="h-4 w-32 rounded-none" />
          <Skeleton className="h-16 w-full rounded-none" />
          <Skeleton className="h-16 w-full rounded-none" />
        </Card>
      </div>
    </div>
  )
}
