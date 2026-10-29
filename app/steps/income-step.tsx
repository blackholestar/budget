"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { StepProps } from "./types";
import {
  dailyIncome,
  parseAmount,
  type BudgetData,
  type BudgetMode,
} from "./types";
import { AmountPeriodInput } from "./components/amount-period-input";
import { formatPerDay } from "./components/money";

const MODES: { id: BudgetMode; label: string; hint: string }[] = [
  {
    id: "INCOME",
    label: "I have an income",
    hint: "A regular paycheck or other recurring money.",
  },
  {
    id: "TOTAL_SPEND",
    label: "I have an amount to spend",
    hint: "A fixed pot of money, no recurring income.",
  },
];

/**
 * Gate for leaving this step. `data.income` only ever holds a valid positive
 * amount (or 0 meaning "none entered yet"), so a non-positive value means the
 * user hasn't given us anything usable.
 */
export function validateIncome(data: BudgetData): string | null {
  return Number.isFinite(data.income) && data.income > 0
    ? null
    : "Enter a valid income to continue.";
}

type InputProblem = "invalid" | "zero" | null;

/** Classify what the user typed. Empty text is not a problem (nothing entered). */
function classify(text: string): InputProblem {
  if (text.trim() === "") return null;
  const parsed = parseAmount(text);
  if (!Number.isFinite(parsed) || parsed < 0) return "invalid";
  if (parsed === 0) return "zero";
  return null;
}

export function IncomeStep({ data, updateData }: StepProps) {
  // The raw text lives here (not in the stored data) so we can tell an
  // explicit "0" from an empty box, and so a bad entry is never stored.
  const [text, setText] = useState(() =>
    data.income > 0 ? String(Math.round(data.income * 100) / 100) : "",
  );

  const handleTextChange = (next: string) => {
    setText(next);
    const parsed = parseAmount(next);
    // Only a valid positive amount is stored. Anything else (empty, invalid,
    // negative, zero) clears the stored income back to "none" so a stale value
    // can't be used while the box shows something else.
    const valid = Number.isFinite(parsed) && parsed > 0;
    updateData({ income: valid ? parsed : 0 });
  };

  const problem = classify(text);
  const perDay = dailyIncome(data);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">Step 1 — Income</h2>
        <p className="text-sm text-muted-foreground">
          Everything in your budget is measured per day. Start with the money
          coming in.
        </p>
      </div>

      {/* Mode: income vs. a fixed amount to spend. */}
      <div className="grid gap-2 sm:grid-cols-2">
        {MODES.map((m) => {
          const active = data.mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              aria-pressed={active}
              onClick={() => updateData({ mode: m.id })}
              className={
                "rounded-3xl border p-4 text-left transition-colors " +
                (active
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted")
              }
            >
              <div className="text-sm font-medium">{m.label}</div>
              <div className="mt-1 text-xs text-muted-foreground">{m.hint}</div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">
          {data.mode === "INCOME"
            ? "After-tax income"
            : "Total you're willing to spend"}
        </label>
        <AmountPeriodInput
          amount={data.income}
          text={text}
          onTextChange={handleTextChange}
          period={data.incomePeriod}
          onPeriodChange={(incomePeriod) => updateData({ incomePeriod })}
          aria-label="Income amount"
          aria-invalid={problem !== null}
        />
      </div>

      {/* Errors, per spec. Nothing shows until something has been typed. */}
      {problem === "invalid" && (
        <p role="alert" className="text-sm text-destructive">
          Invalid amount.
        </p>
      )}
      {problem === "zero" && (
        <p role="alert" className="text-sm text-destructive">
          {data.mode === "INCOME"
            ? "If you do not have a regular income, you can use the amount of money you have available or the amount you wish to spend."
            : "Please enter an amount greater than zero."}
        </p>
      )}

      {/* Per-day readout. */}
      {problem === null && data.income > 0 && (
        <Card size="sm">
          <CardContent className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">
              {data.mode === "INCOME" ? "Income" : "Available"} per day
            </span>
            <span className="text-2xl font-semibold tabular-nums">
              {formatPerDay(perDay)}
            </span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
