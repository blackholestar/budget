"use client";

import { useState } from "react";
import {
  availableDailyIncome,
  type BudgetData,
  type Goal,
} from "../types";
import { GoalCard } from "./goal-card";
import { GoalDialog } from "./goal-dialog";

/**
 * Everything needed to list, add, edit and remove goals, shared by step 3 and
 * step 4 so both render the exact same cards (inline levers, pencil, trash) and
 * the same edit dialog.
 *
 * Returns:
 *  - `cards`   the list of goal cards
 *  - `dialog`  the add/edit dialog; render it once anywhere in the step
 *  - `openAdd` open the dialog to create a new goal
 */
export function useGoalEditor(
  data: BudgetData,
  updateData: (patch: Partial<BudgetData>) => void,
) {
  const available = availableDailyIncome(data);

  // Dialog state: open, and which goal is being edited (null = adding new).
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

  const openAdd = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (goal: Goal) => {
    setEditing(goal);
    setOpen(true);
  };

  const upsertGoal = (goal: Goal) =>
    updateData({
      goals: data.goals.some((g) => g.id === goal.id)
        ? data.goals.map((g) => (g.id === goal.id ? goal : g))
        : [...data.goals, goal],
    });

  const removeGoal = (id: string) =>
    updateData({ goals: data.goals.filter((g) => g.id !== id) });

  const cards = (
    <div className="flex flex-col gap-3">
      {data.goals.map((goal) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          availableDailyIncome={available}
          onChange={upsertGoal}
          onEdit={() => openEdit(goal)}
          onRemove={() => removeGoal(goal.id)}
        />
      ))}
    </div>
  );

  const dialog = (
    <GoalDialog
      open={open}
      goal={editing}
      availableDailyIncome={available}
      onOpenChange={setOpen}
      onSave={upsertGoal}
    />
  );

  return { cards, dialog, openAdd };
}
