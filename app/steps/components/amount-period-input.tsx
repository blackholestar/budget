"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ALL_PERIODS, parseAmount, periodLabel, type Period } from "../types";

/** Display string for a committed amount when the box isn't being edited. */
function display(amount: number): string {
  return Number.isFinite(amount) && amount !== 0
    ? String(Math.round(amount * 100) / 100)
    : "";
}

// Value→label map so <SelectValue> shows "3 months" (not "3MONTHS") when the
// period dropdown is closed. Base UI reads labels from this `items` prop.
const PERIOD_ITEMS = ALL_PERIODS.map((p) => ({
  value: p,
  label: periodLabel(p),
}));

/**
 * The quality-of-life money input used everywhere: an amount typed over any
 * period. The amount box accepts a plain number or the "base × percent" form
 * (e.g. `1500 * 80%`) via {@link parseAmount}; the period box picks the unit.
 *
 * Controlled: the parent owns `amount` (over `period`) and `period`. The text
 * box keeps its own draft string so a half-typed expression isn't clobbered,
 * and only reformats from the parent value when the field isn't focused.
 */
export function AmountPeriodInput({
  amount,
  period,
  onAmountChange,
  onPeriodChange,
  placeholder = "0",
  className,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
}: {
  amount: number;
  period: Period;
  onAmountChange: (amount: number) => void;
  onPeriodChange: (period: Period) => void;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
}) {
  // While editing, `draft` (a string) holds the raw text so a half-typed
  // expression isn't reformatted under the user. While idle (`null`), the box
  // renders straight from the parent's `amount` — so a linked recompute shows
  // up immediately without a syncing effect.
  const [draft, setDraft] = useState<string | null>(null);
  const editing = draft !== null;

  const handleChange = (text: string) => {
    setDraft(text);
    const parsed = parseAmount(text);
    if (!Number.isNaN(parsed)) onAmountChange(parsed);
    else if (text.trim() === "") onAmountChange(0);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative flex-1">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
          $
        </span>
        <Input
          inputMode="decimal"
          className="pl-6"
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-invalid={ariaInvalid}
          value={editing ? draft : display(amount)}
          onFocus={() => setDraft(display(amount))}
          onBlur={() => setDraft(null)}
          onChange={(e) => handleChange(e.target.value)}
        />
      </div>
      <span className="text-sm text-muted-foreground">per</span>
      <Select
        items={PERIOD_ITEMS}
        value={period}
        onValueChange={(value) => onPeriodChange(value as Period)}
      >
        <SelectTrigger aria-label="Period" className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ALL_PERIODS.map((p) => (
            <SelectItem key={p} value={p}>
              {periodLabel(p)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
