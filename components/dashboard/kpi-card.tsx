import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { Sparkline } from "@/components/dashboard/sparkline"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function KpiCard({
  label,
  badge,
  badgeTone = "neutral",
  value,
  footer,
  trend,
}: {
  label: React.ReactNode
  badge?: string
  badgeTone?: "positive" | "neutral"
  value: React.ReactNode
  footer: React.ReactNode
  trend?: number[]
}) {
  return (
    <Card className="gap-6">
      <CardHeader>
        <p className="inline-flex items-center gap-2 text-overline font-medium uppercase text-muted-foreground">
          {label}
        </p>
        {badge ? (
          <CardAction
            className={cn(
              "text-overline font-medium uppercase",
              badgeTone === "positive"
                ? "text-emerald-400"
                : "text-muted-foreground",
            )}
          >
            {badge}
          </CardAction>
        ) : null}
      </CardHeader>

      <CardContent className="flex items-end justify-between gap-6">
        <p className="font-heading text-4xl font-medium tabular-nums">
          {value}
        </p>
        {trend && trend.length > 0 ? (
          <Sparkline data={trend} className="max-w-[55%]" />
        ) : null}
      </CardContent>

      <CardFooter>
        <p className="text-overline font-medium uppercase text-muted-foreground">
          {footer}
        </p>
      </CardFooter>
    </Card>
  )
}

export function KpiCardSkeleton() {
  return (
    <Card className="gap-6">
      <CardHeader>
        <Skeleton className="h-3 w-24 rounded-none" />
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-6">
        <Skeleton className="h-9 w-28 rounded-none" />
        <Skeleton className="h-10 w-[55%] rounded-none" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-3 w-32 rounded-none" />
      </CardFooter>
    </Card>
  )
}
