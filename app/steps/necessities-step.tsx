"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Trash2Icon } from "lucide-react";
import type { StepProps } from "./types";
import {
  NECESSITY_CATEGORIES,
  availableDailyIncome,
  createNecessity,
  dailyIncome,
  dailyNecessities,
  necessityCategoryInfo,
  necessityDailyCost,
  type BudgetData,
  type Necessity,
  type NecessityCategory,
  type Period,
} from "./types";
import { AmountPeriodInput } from "./components/amount-period-input";
import { formatMoney, formatPerDay, formatPercent } from "./components/money";

/**
 * Gate for leaving this step: necessities alone must not exceed income. Goals
 * are deliberately not considered here. Tiny epsilon avoids float noise when
 * amounts entered over different periods are equal in principle.
 */
export function validateNecessities(data: BudgetData): string | null {
  const over = dailyNecessities(data) - dailyIncome(data);
  return over > 1e-9
    ? `Your necessities exceed your income by ${formatMoney(over)}/day. Lower them to continue.`
    : null;
}

export function NecessitiesStep({ data, updateData }: StepProps) {
  const income = dailyIncome(data);
  const total = dailyNecessities(data);
  // Income left after necessities only — goal spending is NOT subtracted here.
  const free = availableDailyIncome(data);
  const problem = validateNecessities(data);

  const share = (perDay: number) => (income > 0 ? perDay / income : NaN);

  const addNecessity = (category: NecessityCategory) =>
    updateData({
      necessities: [
        ...data.necessities,
        createNecessity(category, 0, "MONTH"),
      ],
    });

  const patchNecessity = (id: string, patch: Partial<Necessity>) =>
    updateData({
      necessities: data.necessities.map((n) =>
        n.id === id ? { ...n, ...patch } : n,
      ),
    });

  const removeNecessity = (id: string) =>
    updateData({
      necessities: data.necessities.filter((n) => n.id !== id),
    });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">Step 2 — Necessities</h2>
        <p className="text-sm text-muted-foreground">
          The essentials you have to pay for. Only true needs here — 
          travel and dining out are goals, not necessities.
        </p>
      </div>

      {/* Add from the restricted list. This is an action menu, not a value
          picker: the trigger always reads "Add a necessity…" regardless of
          what was last chosen, so it's clear it adds more. We keep the
          selection pinned to null and render a constant label. */}
      <Select
        value={null}
        onValueChange={(value) =>
          value && addNecessity(value as NecessityCategory)
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue>{() => "＋ Add a necessity…"}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {NECESSITY_CATEGORIES.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              <span className="mr-2">{c.icon}</span>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Rows. */}
      {data.necessities.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No necessities yet. Add one above.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {data.necessities.map((n) => {
            const info = necessityCategoryInfo(n.category);
            const perDay = necessityDailyCost(n);
            return (
              <Card key={n.id} size="sm">
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{info.icon}</span>
                      <span className="text-sm font-medium">{info.label}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${info.label}`}
                      onClick={() => removeNecessity(n.id)}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                  <AmountPeriodInput
                    amount={n.totalCost}
                    period={n.period}
                    onAmountChange={(totalCost) =>
                      patchNecessity(n.id, { totalCost })
                    }
                    onPeriodChange={(period: Period) =>
                      patchNecessity(n.id, { period })
                    }
                    aria-label={`${info.label} amount`}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground tabular-nums">
                    <span>{formatPerDay(perDay)}</span>
                    <span>{formatPercent(share(perDay))} of income</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Totals. */}
      <Card size="sm">
        <CardContent className="flex flex-col gap-2">
          <Row
            label="Necessities total"
            value={formatPerDay(total)}
            sub={`${formatPercent(share(total))} of income`}
          />
          <Separator />
          <Row
            label="Free to allocate"
            value={formatPerDay(free)}
            sub={`${formatPercent(share(free))} of income`}
            emphasize
            warn={free < 0}
          />
          {problem && (
            <p role="alert" className="text-sm text-destructive">
              {problem}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
  sub,
  emphasize,
  warn,
}: {
  label: string;
  value: string;
  sub: string;
  emphasize?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span
        className={
          "text-sm " + (emphasize ? "font-medium" : "text-muted-foreground")
        }
      >
        {label}
      </span>
      <span className="flex items-baseline gap-2 tabular-nums">
        <span
          className={
            (emphasize ? "text-lg font-semibold " : "text-sm ") +
            (warn ? "text-destructive" : "")
          }
        >
          {value}
        </span>
        <span className="text-xs text-muted-foreground">{sub}</span>
      </span>
    </div>
  );
}
