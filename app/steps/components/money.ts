// Small display helpers shared across steps. Kept separate from the domain
// model (app/types.ts) because these are purely presentational.

/** Format a dollar amount, e.g. 12.5 -> "$12.50". */
export function formatMoney(amount: number): string {
  if (!Number.isFinite(amount)) return "—";
  return amount.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

/** Format a $/day amount, e.g. "$12.50/day". */
export function formatPerDay(amount: number): string {
  return `${formatMoney(amount)}/day`;
}

/** Format a 0..1 proportion as a percent, e.g. 0.25 -> "25%". */
export function formatPercent(proportion: number): string {
  if (!Number.isFinite(proportion)) return "—";
  return `${Math.round(proportion * 100)}%`;
}

/** Format a day count, e.g. 25.4 -> "25 days", Infinity -> "never". */
export function formatDays(days: number): string {
  if (!Number.isFinite(days)) return "never";
  const rounded = Math.ceil(days);
  return `${rounded} ${rounded === 1 ? "day" : "days"}`;
}
