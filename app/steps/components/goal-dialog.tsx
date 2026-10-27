"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  GOAL_ICONS,
  createGoal,
  setGoalContributionPerDay,
  setGoalDays,
  setGoalProportion,
  type Goal,
} from "../types";
import { LinkedNumber } from "./linked-number";
import { MoneyInput } from "./money-input";
import {
  formatDays,
  formatMoney,
  formatPercent,
} from "./money";
import {
  goalDaysToReach,
  goalProportion,
} from "../types";

/**
 * Add/edit dialog for a goal. Shared by the "Add goal" button and the pencil
 * on each goal card. A draft goal is kept locally so edits can be cancelled;
 * {@link onSave} is called only on confirm.
 *
 * `goal` is the goal being edited, or null to create a new one. The three
 * linked levers behave exactly as on the card.
 */
export function GoalDialog({
  open,
  goal,
  availableDailyIncome,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  goal: Goal | null;
  availableDailyIncome: number;
  onOpenChange: (open: boolean) => void;
  onSave: (goal: Goal) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Keying the body by the goal being edited (and by `open`) remounts it
          with a fresh draft each time the dialog opens — no syncing effect. */}
      {open && (
        <GoalDialogBody
          key={goal?.id ?? "new"}
          goal={goal}
          availableDailyIncome={availableDailyIncome}
          onOpenChange={onOpenChange}
          onSave={onSave}
        />
      )}
    </Dialog>
  );
}

function GoalDialogBody({
  goal,
  availableDailyIncome,
  onOpenChange,
  onSave,
}: {
  goal: Goal | null;
  availableDailyIncome: number;
  onOpenChange: (open: boolean) => void;
  onSave: (goal: Goal) => void;
}) {
  const [draft, setDraft] = useState<Goal>(() => goal ?? blankGoal());

  const days = goalDaysToReach(draft);
  const proportion = goalProportion(draft, availableDailyIncome);
  const canSave = draft.name.trim() !== "" && draft.totalCost > 0;

  const save = () => {
    // Preserve the id when editing; mint one when creating.
    onSave(goal ? draft : createGoal(stripId(draft)));
    onOpenChange(false);
  };

  return (
    <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{goal ? "Edit goal" : "What do you want?"}</DialogTitle>
          <DialogDescription>
            It can be as big or small as you want — a short-term treat or a
            grand long-term goal.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {/* Name. */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="goal-name">Name</Label>
            <Input
              id="goal-name"
              placeholder="New phone, trip to Japan, emergency fund…"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </div>

          {/* Icon picker. */}
          <div className="flex flex-col gap-1.5">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-1.5">
              {GOAL_ICONS.map(({ icon, label }) => (
                <button
                  key={icon}
                  type="button"
                  title={label}
                  aria-label={label}
                  aria-pressed={draft.icon === icon}
                  onClick={() => setDraft({ ...draft, icon })}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-2xl border text-lg transition-colors",
                    draft.icon === icon
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-muted",
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Total cost — a one-off lump sum, so no period. */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="goal-total">Total amount needed</Label>
            <MoneyInput
              id="goal-total"
              value={draft.totalCost}
              onChange={(totalCost) => setDraft({ ...draft, totalCost })}
              aria-label="Total amount needed"
            />
          </div>

          {/* The three linked levers — edit any, the others follow. */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Lever label="Per day">
              <LinkedNumber
                value={draft.contributionPerDay}
                format={(v) => formatMoney(v)}
                onCommit={(v) => setDraft(setGoalContributionPerDay(draft, v))}
                aria-label="Contribution per day"
              />
            </Lever>
            <Lever label="% of free">
              <LinkedNumber
                value={proportion * 100}
                suffix="%"
                format={() => formatPercent(proportion)}
                onCommit={(v) =>
                  setDraft(
                    setGoalProportion(draft, v / 100, availableDailyIncome),
                  )
                }
                aria-label="Percent of free income"
              />
            </Lever>
            <Lever label="Days to reach">
              <LinkedNumber
                value={days}
                format={() => formatDays(days)}
                onCommit={(v) => setDraft(setGoalDays(draft, v))}
                aria-label="Days to reach"
              />
            </Lever>
          </div>

          {/* Notes. */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="goal-notes">Notes (just for you)</Label>
            <Input
              id="goal-notes"
              placeholder="Optional"
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!canSave}>
            {goal ? "Save" : "Add goal"}
          </Button>
        </DialogFooter>
    </DialogContent>
  );
}

function Lever({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function blankGoal(): Goal {
  return {
    id: "",
    name: "",
    icon: "🎯",
    totalCost: 0,
    contributionPerDay: 0,
    notes: "",
  };
}

function stripId(goal: Goal): Omit<Goal, "id"> {
  const { id: _id, ...rest } = goal;
  void _id;
  return rest;
}
