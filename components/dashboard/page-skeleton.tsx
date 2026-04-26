import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const block = "rounded-none"

function PageSkeletonRoot({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn("flex flex-col gap-8", className)}>{children}</div>
}

function PageSkeletonHeader({ withAction = false }: { withAction?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-3">
        <Skeleton className={cn(block, "h-7 w-48")} />
        <Skeleton className={cn(block, "h-4 w-72")} />
      </div>
      {withAction ? (
        <Skeleton className={cn(block, "h-9 w-32")} />
      ) : null}
    </div>
  )
}

function PageSkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-3 border border-border/60 p-4"
        >
          <Skeleton className={cn(block, "h-4 w-24")} />
          <Skeleton className={cn(block, "h-7 w-32")} />
          <Skeleton className={cn(block, "h-3 w-20")} />
        </div>
      ))}
    </div>
  )
}

function PageSkeletonTable({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col border border-border/60">
      <div className="flex items-center gap-4 border-b border-border/60 p-4">
        <Skeleton className={cn(block, "h-4 w-32")} />
        <Skeleton className={cn(block, "h-4 w-24")} />
        <Skeleton className={cn(block, "h-4 w-24")} />
        <Skeleton className={cn(block, "ml-auto h-4 w-16")} />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-border/60 p-4 last:border-b-0"
        >
          <Skeleton className={cn(block, "h-4 w-40")} />
          <Skeleton className={cn(block, "h-4 w-28")} />
          <Skeleton className={cn(block, "h-4 w-24")} />
          <Skeleton className={cn(block, "ml-auto h-4 w-16")} />
        </div>
      ))}
    </div>
  )
}

function PageSkeletonFilters() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Skeleton className={cn(block, "h-9 w-64")} />
      <Skeleton className={cn(block, "h-9 w-32")} />
      <Skeleton className={cn(block, "h-9 w-32")} />
    </div>
  )
}

function PageSkeletonKanban({ columns = 4 }: { columns?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: columns }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-3 border border-border/60 p-4"
        >
          <Skeleton className={cn(block, "h-4 w-24")} />
          <Skeleton className={cn(block, "h-20 w-full")} />
          <Skeleton className={cn(block, "h-20 w-full")} />
          <Skeleton className={cn(block, "h-20 w-full")} />
        </div>
      ))}
    </div>
  )
}

function PageSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-3 border border-border/60 p-4"
        >
          <Skeleton className={cn(block, "h-5 w-40")} />
          <Skeleton className={cn(block, "h-4 w-full")} />
          <Skeleton className={cn(block, "h-4 w-3/4")} />
        </div>
      ))}
    </div>
  )
}

function PageSkeletonSection({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3 border border-border/60 p-6">
      <Skeleton className={cn(block, "h-5 w-48")} />
      <Skeleton className={cn(block, "h-4 w-72")} />
      <div className="mt-2 flex flex-col gap-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className={cn(block, "h-9 w-full")} />
        ))}
      </div>
    </div>
  )
}

function PageSkeletonChart() {
  return (
    <div className="flex flex-col gap-3 border border-border/60 p-6">
      <Skeleton className={cn(block, "h-5 w-40")} />
      <Skeleton className={cn(block, "h-64 w-full")} />
    </div>
  )
}

export const PageSkeleton = Object.assign(PageSkeletonRoot, {
  Header: PageSkeletonHeader,
  Cards: PageSkeletonCards,
  Table: PageSkeletonTable,
  Filters: PageSkeletonFilters,
  Kanban: PageSkeletonKanban,
  Grid: PageSkeletonGrid,
  Section: PageSkeletonSection,
  Chart: PageSkeletonChart,
})
