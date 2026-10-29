"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { steps, initialBudgetData } from "./steps";
import { useBudgetData } from "./use-budget-data";

export function Wizard() {
  // All step data lives on this parent and is persisted to localStorage, so
  // navigating between steps (or reloading) never discards what was entered.
  const { data, updateData } = useBudgetData();

  // The step currently on screen.
  const [currentStep, setCurrentStep] = useState(0);

  // The furthest step the user has viewed. Steps up to and including this index
  // are unlocked; anything beyond it cannot be reached by jumping. Advancing
  // with "Next" is the only way to push this forward.
  const [maxViewedStep, setMaxViewedStep] = useState(0);

  // The first step (if any) that currently blocks moving forward, with its
  // message. Every step after it is unreachable until it's fixed.
  const blocker = (() => {
    for (let i = 0; i < steps.length; i++) {
      const message = steps[i].validate?.(data) ?? null;
      if (message) return { index: i, message };
    }
    return null;
  })();

  // A step is reachable if it's already been viewed OR it's the single next
  // step after the furthest viewed one (only a jump that *skips* an unvisited
  // page is disallowed) — AND no earlier step has invalid data. Going back is
  // therefore always possible, going forward past a problem never is.
  const canReach = (index: number) =>
    index >= 0 &&
    index < steps.length &&
    index <= maxViewedStep + 1 &&
    (blocker === null || index <= blocker.index);

  const goToStep = (index: number) => {
    if (!canReach(index)) return;
    setMaxViewedStep((prev) => Math.max(prev, index));
    setCurrentStep(index);
  };

  const goNext = () => goToStep(currentStep + 1);

  const goBack = () => goToStep(currentStep - 1);

  const goToStepById = (id: string) => {
    const index = steps.findIndex((s) => s.id === id);
    if (index !== -1) goToStep(index);
  };

  // Wipe the budget back to its defaults (this also overwrites the saved copy)
  // and start over from the first step.
  const resetAll = () => {
    updateData(initialBudgetData);
    setCurrentStep(0);
    setMaxViewedStep(0);
  };

  const { Component } = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const nextBlocked = !isLast && !canReach(currentStep + 1);

  return (
    <div className="flex w-full max-w-xl flex-col gap-8">
      {/* Step selector — jump to any step already viewed. */}
      <nav className="flex flex-wrap gap-2" aria-label="Steps">
        {steps.map((step, index) => {
          const unlocked = canReach(index);
          const active = index === currentStep;
          return (
            <Button
              key={step.id}
              type="button"
              variant={active ? "default" : "outline"}
              size="sm"
              disabled={!unlocked}
              aria-current={active ? "step" : undefined}
              onClick={() => goToStep(index)}
              className={cn(!unlocked && "opacity-50")}
            >
              {index + 1}. {step.label}
            </Button>
          );
        })}
      </nav>

      {/* Current step. */}
      <div className="min-h-40">
        <Component
          data={data}
          updateData={updateData}
          goToStep={goToStepById}
          resetAll={resetAll}
        />
      </div>

      {/* Navigation. */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={goBack}
          disabled={isFirst}
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={goNext}
          disabled={isLast || nextBlocked}
        >
          Next
        </Button>
      </div>
      {nextBlocked && blocker && (
        <p className="-mt-4 text-right text-sm text-muted-foreground">
          {blocker.message}
        </p>
      )}
    </div>
  );
}
