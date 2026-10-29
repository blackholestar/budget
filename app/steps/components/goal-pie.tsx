"use client";

import { useMemo } from "react";
import { Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  availableDailyIncome,
  dailyGoalCommitment,
  type BudgetData,
} from "../types";
import { formatPercent } from "./money";

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

/**
 * Pie chart of daily allocation: one slice per goal plus a muted "unallocated"
 * slice for whatever free income is left. Slices use the chart palette, cycling
 * if there are more goals than colors.
 */
export function GoalPie({ data }: { data: BudgetData }) {
  // Tooltips show each slice as a share of free income (income left after
  // necessities), matching the "% of free" figure on each goal card.
  const free = availableDailyIncome(data);

  const { slices, config } = useMemo(() => {
    const available = availableDailyIncome(data);
    const committed = dailyGoalCommitment(data);
    const leftover = Math.max(0, available - committed);

    const goalSlices = data.goals
      .filter((g) => g.contributionPerDay > 0)
      .map((g, i) => ({
        key: g.id,
        name: `${g.icon} ${g.name || "Goal"}`,
        value: g.contributionPerDay,
        fill: PALETTE[i % PALETTE.length],
      }));

    const slices = [
      ...goalSlices,
      ...(leftover > 0
        ? [
            {
              key: "unallocated",
              name: "Unallocated",
              value: leftover,
              fill: "var(--muted)",
            },
          ]
        : []),
    ];

    const config: ChartConfig = Object.fromEntries(
      slices.map((s) => [s.key, { label: s.name, color: s.fill }]),
    );

    return { slices, config };
  }, [data]);

  if (slices.length === 0) return null;

  return (
    <ChartContainer
      config={config}
      className="mx-auto aspect-square max-h-56 w-full"
    >
      <PieChart>
        <ChartTooltip
          content={
            <ChartTooltipContent
              nameKey="name"
              formatter={(value, name) => (
                <span className="flex w-full justify-between gap-3">
                  <span className="text-muted-foreground">{name}</span>
                  <span className="font-mono tabular-nums">
                    {formatPercent(Number(value) / free, 1)}
                  </span>
                </span>
              )}
            />
          }
        />
        <Pie
          data={slices}
          dataKey="value"
          nameKey="name"
          innerRadius={50}
          strokeWidth={2}
        />
      </PieChart>
    </ChartContainer>
  );
}
