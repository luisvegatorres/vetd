"use client"

import { Area, AreaChart } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"

const CONFIG = {
  v: { label: "Trend", color: "var(--chart-1)" },
} satisfies ChartConfig

export function Sparkline({
  data,
  className,
}: {
  data?: number[]
  className?: string
}) {
  if (!data || data.length === 0) return null
  const series = data.map((v, i) => ({ i: String(i), v }))

  return (
    <ChartContainer
      config={CONFIG}
      className={cn("aspect-auto h-12 w-full", className)}
    >
      <AreaChart
        data={series}
        margin={{ top: 2, right: 0, bottom: 0, left: 0 }}
      >
        <defs>
          <linearGradient id="sparklineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-v)" stopOpacity={0.6} />
            <stop offset="95%" stopColor="var(--color-v)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel hideIndicator />}
        />
        <Area
          dataKey="v"
          type="natural"
          stroke="var(--color-v)"
          strokeWidth={1.5}
          fill="url(#sparklineFill)"
          fillOpacity={1}
          dot={false}
          activeDot={{ r: 3, fill: "var(--color-v)" }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  )
}
