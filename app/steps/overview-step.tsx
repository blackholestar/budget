"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Pencil, RotateCcw } from "lucide-react";
import type { StepId, StepProps } from "./types";
import {
  availableDailyIncome,
  dailyIncome,
  dailyNecessities,
  necessityCategoryInfo,
  necessityDailyCost,
  unallocatedDailyIncome,
} from "./types";
import { GoalPie } from "./components/goal-pie";
import { useGoalEditor } from "./components/use-goal-editor";
import { formatPerDay, formatPercent } from "./components/money";

export function OverviewStep({
  data,
  updateData,
  goToStep,
  resetAll,
}: StepProps) {
  const income = dailyIncome(data);
  const necessitiesTotal = dailyNecessities(data);
  const available = availableDailyIncome(data);
  const leftover = unallocatedDailyIncome(data);
  const showIncomePercent = data.mode === "INCOME";
  // Same goal cards + edit dialog as step 3.
  const { cards, dialog } = useGoalEditor(data, updateData);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">Step 4 — Overview</h2>
        <p className="text-sm text-muted-foreground">
          Your whole budget, per day. Adjust any goal right here, or use the
          pencils to jump back to a section.
        </p>
      </div>

      {/* Headline: income per day. */}
      <Card>
        <CardContent className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            {data.mode === "INCOME" ? "Income" : "Available"} per day
            <EditShortcut section="income" label="income" goToStep={goToStep} />
          </span>
          <span className="text-3xl font-semibold tabular-nums">
            {formatPerDay(income)}
          </span>
        </CardContent>
      </Card>

      {/* Necessities — compact. */}
      <Card size="sm">
        <CardContent className="flex flex-col gap-2">
          <h3 className="flex items-center gap-1 text-sm font-medium">
            Necessities
            <EditShortcut
              section="necessities"
              label="necessities"
              goToStep={goToStep}
            />
          </h3>
          {data.necessities.length === 0 ? (
            <p className="text-sm text-muted-foreground">None.</p>
          ) : (
            data.necessities.map((n) => {
              const info = necessityCategoryInfo(n.category);
              return (
                <div
                  key={n.id}
                  className="flex items-baseline justify-between text-sm"
                >
                  <span className="text-muted-foreground">
                    {info.icon} {info.label}
                  </span>
                  <span className="tabular-nums">
                    {formatPerDay(necessityDailyCost(n))}
                  </span>
                </div>
              );
            })
          )}
          <Separator />
          <div className="flex items-baseline justify-between text-sm font-medium">
            <span>Total</span>
            <span className="tabular-nums">
              {formatPerDay(necessitiesTotal)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Goals — same card as step 3, editable inline (no dialog). */}
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h3 className="flex items-center gap-1 text-sm font-medium">
            Goals
            <EditShortcut section="goals" label="goals" goToStep={goToStep} />
          </h3>
          <span className="text-xs text-muted-foreground">
            {formatPerDay(available)} free after necessities
          </span>
        </div>
        {data.goals.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No goals yet. Add some in step 3.
          </p>
        ) : (
          <>
            <GoalPie data={data} />
            {cards}
          </>
        )}
      </div>

      {/* Bottom line. */}
      <Card size="sm">
        <CardContent className="flex items-baseline justify-between">
          <span className="text-sm font-medium">Still unallocated</span>
          <span className="flex items-baseline gap-2 tabular-nums">
            <span
              className={
                "text-lg font-semibold " +
                (leftover < 0 ? "text-destructive" : "")
              }
            >
              {formatPerDay(leftover)}
            </span>
            {showIncomePercent && income > 0 && (
              <span className="text-xs text-muted-foreground">
                {formatPercent(leftover / income)} of income
              </span>
            )}
          </span>
        </CardContent>
      </Card>

      <ResetButton onReset={resetAll} />

      {dialog}
    </div>
  );
}

/** Button + confirmation that wipes the whole budget back to its defaults. */
function ResetButton({ onReset }: { onReset: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        className="self-start"
        onClick={() => setOpen(true)}
      >
        <RotateCcw /> Reset everything
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset your budget?</DialogTitle>
            <DialogDescription>
              This clears your income, necessities and goals, including the
              copy saved in this browser, and takes you back to step 1. It
              can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setOpen(false);
                onReset();
              }}
            >
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** A small pencil button on a section header that jumps back to that step. */
function EditShortcut({
  section,
  label,
  goToStep,
}: {
  section: StepId;
  label: string;
  goToStep: (id: StepId) => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label={`Edit ${label}`}
      title={`Edit ${label}`}
      onClick={() => goToStep(section)}
    >
      <Pencil />
    </Button>
  );
}
