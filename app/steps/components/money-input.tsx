"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { parseAmount } from "../types";

/** Display string for a committed value when the box isn't being edited. */
function display(value: number): string {
  return Number.isFinite(value) && value !== 0
    ? String(Math.round(value * 100) / 100)
    : "";
}

/**
 * A single-value dollar input (no period) with a `$` adornment. Used for lump
 * sums like a goal's total amount. Accepts the same "base × percent" shorthand
 * as the rest of the app via {@link parseAmount}.
 *
 * While editing, a local draft (`draft !== null`) holds the raw text so a
 * half-typed expression isn't reformatted under the user; while idle the box
 * renders straight from `value`.
 */
export function MoneyInput({
  id,
  value,
  onChange,
  placeholder = "0",
  className,
  "aria-label": ariaLabel,
}: {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const editing = draft !== null;

  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
        $
      </span>
      <Input
        id={id}
        inputMode="decimal"
        className="pl-6"
        placeholder={placeholder}
        aria-label={ariaLabel}
        value={editing ? draft : display(value)}
        onFocus={() => setDraft(display(value))}
        onBlur={() => setDraft(null)}
        onChange={(e) => {
          setDraft(e.target.value);
          const parsed = parseAmount(e.target.value);
          if (!Number.isNaN(parsed)) onChange(parsed);
          else if (e.target.value.trim() === "") onChange(0);
        }}
      />
    </div>
  );
}
