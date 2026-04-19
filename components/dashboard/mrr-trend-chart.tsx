"use client"

import { Bar, BarChart, Cell, XAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const DATA = [
  { month: "Jun 25", mrr: 1700 },
  { month: "Jul 25", mrr: 1820 },
  { month: "Aug 25", mrr: 1980 },
  { month: "Sep 25", mrr: 2150 },
  { month: "Oct 25", mrr: 2240 },
  { month: "Nov 25", mrr: 2380 },
  { month: "Dec 25", mrr: 2520 },
  { month: "Jan 26", mrr: 2640 },
  { month: "Feb 26", mrr: 2780 },
  { month: "Mar 26", mrr: 2870 },
  { month: "Apr 26", mrr: 2930, projected: true },
]

const CONFIG = {
  mrr: { label: "MRR", color: "var(--muted-foreground)" },
  projected: { label: "Current month", color: "var(--chart-1)" },
} satisfies ChartConfig

export function MrrTrendChart() {
  return (
    <ChartContainer config={CONFIG} className="aspect-auto h-32 w-full">
      <BarChart data={DATA} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value: string) => value.split(" ")[0]}
          className="text-overline uppercase"
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideIndicator
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.month ?? ""
              }
              formatter={(value) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="text-muted-foreground">
                    Recurring revenue
                  </span>
                  <span className="font-medium tabular-nums">
                    ${Number(value).toLocaleString()}
                  </span>
                </div>
              )}
            />
          }
        />
        <Bar dataKey="mrr" radius={0} isAnimationActive={false}>
          {DATA.map((d, i) => (
            <Cell
              key={i}
              fill={d.projected ? "var(--color-projected)" : "var(--color-mrr)"}
              fillOpacity={d.projected ? 1 : 0.2}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
