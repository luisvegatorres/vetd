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
    <div className="flex flex-col border border-border/60 bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <p className="inline-flex items-center gap-1.5 text-overline font-medium uppercase tracking-ui text-muted-foreground">
          {label}
        </p>
        {badge ? (
          <p
            className={cn(
              "text-overline font-medium uppercase tracking-ui",
              badgeTone === "positive"
                ? "text-emerald-400"
                : "text-muted-foreground",
            )}
          >
            {badge}
          </p>
        ) : null}
      </div>

      <div className="mt-6 flex items-end justify-between gap-6">
        <p className="font-heading text-4xl font-medium tracking-tight tabular-nums">
          {value}
        </p>
        <Sparkline className="max-w-[55%]" />
      </div>

      <div className="mt-6 border-t border-border/60 pt-4">
        <p className="text-overline font-medium uppercase tracking-ui text-muted-foreground">
          {footer}
        </p>
      </div>
    </div>
  )
}
