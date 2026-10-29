"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusIcon } from "lucide-react";
import type { StepProps } from "./types";
import {
  availableDailyIncome,
  totalGoalProportion,
  unallocatedDailyIncome,
} from "./types";
import { GoalPie } from "./components/goal-pie";
import { useGoalEditor } from "./components/use-goal-editor";
import { formatPerDay, formatPercent } from "./components/money";

export function GoalsStep({ data, updateData }: StepProps) {
  const available = availableDailyIncome(data);
  const { cards, dialog, openAdd } = useGoalEditor(data, updateData);

  // Empty state: the fullscreen "What do you want?" prompt.
  if (data.goals.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">Step 3 — Goals</h2>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <span className="text-4xl">🎯</span>
            <div className="flex flex-col gap-1">
              <p className="text-lg font-medium">
                What do you want to achieve with your money?
              </p>
              <p className="text-sm text-muted-foreground">
                A new phone, a trip, an emergency fund — big or small. You have{" "}
                {formatPerDay(available)} free to put toward it.
              </p>
            </div>
            <Button size="lg" onClick={openAdd}>
              <PlusIcon /> Add your first goal
            </Button>
          </CardContent>
        </Card>
        {dialog}
      </div>
    );
  }

  const totalProportion = totalGoalProportion(data);
  const leftover = unallocatedDailyIncome(data);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Step 3 — Goals</h2>
        <Button onClick={openAdd}>
          <PlusIcon /> Add goal
        </Button>
      </div>

      {/* Allocation pie. */}
      <GoalPie data={data} />

      {/* Goal list. */}
      {cards}

      {/* Totals. */}
      <Card size="sm">
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">
              Free income used by goals
            </span>
            <span className="text-sm font-medium tabular-nums">
              {formatPercent(totalProportion)}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium">Still unallocated</span>
            <span
              className={
                "text-lg font-semibold tabular-nums " +
                (leftover < 0 ? "text-destructive" : "")
              }
            >
              {formatPerDay(leftover)}
            </span>
          </div>
          {leftover < 0 && (
            <p className="text-sm text-destructive">
              Your goals commit more than your free income. Lower a daily
              amount or stretch a goal over more days.
            </p>
          )}
        </CardContent>
      </Card>

      {dialog}
    </div>
  );
}
