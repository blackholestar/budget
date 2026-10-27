"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2Icon } from "lucide-react";
import {
  goalDaysToReach,
  goalProportion,
  setGoalContributionPerDay,
  setGoalDays,
  setGoalProportion,
  type Goal,
} from "../types";
import { formatDays, formatMoney, formatPerDay, formatPercent } from "./money";
import { LinkedNumber } from "./linked-number";

/**
 * Displays one goal and its three linked levers: $/day, % of free income, and
 * days to reach. Editing any lever back-solves the daily contribution via the
 * model's setters, so the other two update automatically. All three are always
 * shown and directly editable; the "% of free" value is derived (never stored)
 * from the goal's daily contribution and the available income.
 *
 * Reused by step 3 (goals list) and step 4 (overview). `onEdit` and `onRemove`
 * are optional so callers can show the pencil/trash affordances only where they
 * make sense.
 */
export function GoalCard({
  goal,
  availableDailyIncome,
  onChange,
  onEdit,
  onRemove,
}: {
  goal: Goal;
  availableDailyIncome: number;
  onChange: (goal: Goal) => void;
  onEdit?: () => void;
  onRemove?: () => void;
}) {
  const days = goalDaysToReach(goal);
  const proportion = goalProportion(goal, availableDailyIncome);

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{goal.icon || "🎯"}</span>
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {goal.name || "Untitled goal"}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatMoney(goal.totalCost)} total
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Edit ${goal.name || "goal"}`}
                onClick={onEdit}
              >
                <Pencil />
              </Button>
            )}
            {onRemove && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${goal.name || "goal"}`}
                onClick={onRemove}
              >
                <Trash2Icon />
              </Button>
            )}
          </div>
        </div>

        {goal.notes && (
          <p className="text-xs text-muted-foreground">{goal.notes}</p>
        )}

        {/* The three linked levers — all always shown and editable. */}
        <div className="grid gap-2 sm:grid-cols-3">
          <Lever label="Per day">
            <LinkedNumber
              value={goal.contributionPerDay}
              format={(v) => formatMoney(v)}
              onCommit={(v) => onChange(setGoalContributionPerDay(goal, v))}
              aria-label="Contribution per day"
            />
          </Lever>

          <Lever label="% of free">
            <LinkedNumber
              value={proportion * 100}
              suffix="%"
              format={() => formatPercent(proportion)}
              onCommit={(v) =>
                onChange(setGoalProportion(goal, v / 100, availableDailyIncome))
              }
              aria-label="Percent of free income"
            />
          </Lever>

          <Lever label="Days to reach">
            <LinkedNumber
              value={days}
              format={() => formatDays(days)}
              onCommit={(v) => onChange(setGoalDays(goal, v))}
              aria-label="Days to reach"
            />
          </Lever>
        </div>

        <p className="text-xs text-muted-foreground tabular-nums">
          {formatPerDay(goal.contributionPerDay)} ·{" "}
          {formatPercent(proportion)} of free · {formatDays(days)} to reach
        </p>
      </CardContent>
    </Card>
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
