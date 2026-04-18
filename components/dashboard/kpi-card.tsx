import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { Sparkline } from "@/components/dashboard/sparkline"
import { cn } from "@/lib/utils"

export function KpiCard({
  label,
  badge,
  badgeTone = "neutral",
  value,
  footer,
}: {
  label: React.ReactNode
  badge?: string
  badgeTone?: "positive" | "neutral"
  value: string
  footer: string
}) {
  return (
    <Card className="gap-6">
      <CardHeader>
        <p className="inline-flex items-center gap-2 text-overline font-medium uppercase tracking-ui text-muted-foreground">
          {label}
        </p>
        {badge ? (
          <CardAction
            className={cn(
              "text-overline font-medium uppercase tracking-ui",
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
        <p className="font-heading text-4xl font-medium tracking-tight tabular-nums">
          {value}
        </p>
        <Sparkline className="max-w-[55%]" />
      </CardContent>

      <CardFooter>
        <p className="text-overline font-medium uppercase tracking-ui text-muted-foreground">
          {footer}
        </p>
      </CardFooter>
    </Card>
  )
}
