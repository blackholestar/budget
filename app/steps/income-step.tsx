"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { StepProps } from "./types";
import { dailyIncome, type BudgetMode } from "./types";
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

export function IncomeStep({ data, updateData }: StepProps) {
  const perDay = dailyIncome(data);
  const entered = Number.isFinite(data.income) ? data.income : 0;
  const isZero = entered === 0;
  const isInvalid = !Number.isFinite(data.income) || data.income < 0;

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
          period={data.incomePeriod}
          onAmountChange={(income) => updateData({ income })}
          onPeriodChange={(incomePeriod) => updateData({ incomePeriod })}
          aria-label="Income amount"
          aria-invalid={isInvalid}
        />
      </div>

      {/* Errors, per spec. */}
      {isInvalid && (
        <p className="text-sm text-destructive">Please enter a valid amount.</p>
      )}
      {!isInvalid && isZero && (
        <p className="text-sm text-destructive">
          If you do not have a regular income, you can switch to “I have an
          amount to spend” and enter the money you have available.
        </p>
      )}

      {/* Per-day readout. */}
      {!isInvalid && !isZero && (
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
