"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { parseAmount } from "../types";

/**
 * A number input for one of several interdependent values (a goal's $/day,
 * % of free, days). While focused it shows a raw editable number; while blurred
 * it shows a friendly formatted readout. Editing commits the typed number to
 * the parent, which recomputes the siblings — so a derived change to this
 * value flows back in and the readout updates.
 *
 * No syncing effect is needed: while blurred the box renders straight from
 * `value` via `format`, and the editable draft is seeded on focus. The amount
 * box accepts the same "base × percent" shorthand as the rest of the app via
 * {@link parseAmount}.
 */
export function LinkedNumber({
  value,
  format,
  onCommit,
  suffix,
  "aria-label": ariaLabel,
}: {
  value: number;
  /** Render the blurred, read-only display of the current value. */
  format: (value: number) => string;
  /** Called with the parsed number when the user commits an edit. */
  onCommit: (value: number) => void;
  /** Optional suffix shown inside the box while editing (e.g. "%"). */
  suffix?: string;
  "aria-label"?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const focused = draft !== null;

  return (
    <div className="relative">
      <Input
        inputMode="decimal"
        aria-label={ariaLabel}
        className="h-8 text-sm"
        value={focused ? draft : format(value)}
        onFocus={(e) => {
          setDraft(
            Number.isFinite(value) ? String(Math.round(value * 100) / 100) : "",
          );
          // Select-all so a quick retype replaces the value.
          requestAnimationFrame(() => e.target.select());
        }}
        onBlur={() => setDraft(null)}
        onChange={(e) => {
          setDraft(e.target.value);
          const parsed = parseAmount(e.target.value);
          if (!Number.isNaN(parsed)) onCommit(parsed);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
      />
      {focused && suffix && (
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
          {suffix}
        </span>
      )}
    </div>
  );
}
