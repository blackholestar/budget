"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusIcon } from "lucide-react";
import type { StepProps } from "./types";
import {
  availableDailyIncome,
  totalGoalProportion,
  unallocatedDailyIncome,
  type Goal,
} from "./types";
import { GoalCard } from "./components/goal-card";
import { GoalDialog } from "./components/goal-dialog";
import { GoalPie } from "./components/goal-pie";
import { formatPerDay, formatPercent } from "./components/money";

export function GoalsStep({ data, updateData }: StepProps) {
  const available = availableDailyIncome(data);

  // Dialog state: open, and which goal is being edited (null = adding new).
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (goal: Goal) => {
    setEditing(goal);
    setDialogOpen(true);
  };

  const upsertGoal = (goal: Goal) =>
    updateData({
      goals: data.goals.some((g) => g.id === goal.id)
        ? data.goals.map((g) => (g.id === goal.id ? goal : g))
        : [...data.goals, goal],
    });

  const changeGoal = (goal: Goal) =>
    updateData({
      goals: data.goals.map((g) => (g.id === goal.id ? goal : g)),
    });

  const removeGoal = (id: string) =>
    updateData({ goals: data.goals.filter((g) => g.id !== id) });

  const dialog = (
    <GoalDialog
      open={dialogOpen}
      goal={editing}
      availableDailyIncome={available}
      onOpenChange={setDialogOpen}
      onSave={upsertGoal}
    />
  );

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
      <div className="flex flex-col gap-3">
        {data.goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            availableDailyIncome={available}
            onChange={changeGoal}
            onEdit={() => openEdit(goal)}
            onRemove={() => removeGoal(goal.id)}
          />
        ))}
      </div>

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
