// Budget domain model.
//
// Design principles:
//  - Store only independent inputs. Anything that can be computed from other
//    stored values is derived on read, never stored, so values can never drift
//    out of sync.
//  - All data is plain and JSON-serializable (no classes), so it works with
//    React's reference-equality re-render model and can later be persisted to
//    localStorage or a shareable URL.
//  - All updates are immutable: an "edit" returns a new object rather than
//    mutating in place, which is what React's setState wants.
//
// TODO: the pure helper functions here could later move to a dedicated rules.ts.

/**
 * A short unique id for list items (necessities, goals). Uses crypto.randomUUID
 * when available (browsers and modern Node) and falls back to a random string
 * so the model never depends on the environment.
 */
export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export type Period =
  | "DAY"
  | "WEEK"
  | "2WEEKS"
  | "MONTH"
  | "3MONTHS"
  | "4MONTHS"
  | "6MONTHS"
  | "8MONTHS"
  | "YEAR";

/** Number of days in a given period. */
export function toDays(period: Period): number {
  switch (period) {
    case "DAY":
      return 1;
    case "WEEK":
      return 7;
    case "2WEEKS":
      return 14;
    case "MONTH":
      return 365 / 12;
    case "3MONTHS":
      return 365 / 4;
    case "4MONTHS":
      return 365 / 3;
    case "6MONTHS":
      return 365 / 2;
    case "8MONTHS":
      return (365 * 2) / 3;
    case "YEAR":
      return 365;
  }
}

/** Convert an amount measured over a period into an equivalent per-day amount. */
export function toDailyAmount(amount: number, period: Period): number {
  return amount / toDays(period);
}

/**
 * Parse a user-typed amount. Supports the QoL "base × percent" form in addition
 * to a plain number, so a user can type either `1200` or `1500 * 80%` (meaning
 * "80% of 1500"). Returns NaN when the text isn't a valid amount.
 *
 * Accepted forms (whitespace and a leading `$` are ignored):
 *   "1200"          -> 1200
 *   "1500 * 80%"    -> 1200   (base times a percentage)
 *   "1500 x 80%"    -> 1200   (x as a multiply sign)
 *   "1500 * 0.8"    -> 1200   (base times a plain factor)
 */
export function parseAmount(text: string): number {
  const cleaned = text.trim().replace(/\$/g, "").replace(/,/g, "");
  if (cleaned === "") return NaN;

  const scaler = cleaned.match(/^(-?\d*\.?\d+)\s*[*x]\s*(-?\d*\.?\d+)(%?)$/i);
  if (scaler) {
    const base = Number(scaler[1]);
    const factorRaw = Number(scaler[2]);
    const factor = scaler[3] === "%" ? factorRaw / 100 : factorRaw;
    return base * factor;
  }

  return Number(cleaned);
}

/** Human-readable label for a period, for selects and readouts. */
export function periodLabel(period: Period): string {
  switch (period) {
    case "DAY":
      return "day";
    case "WEEK":
      return "week";
    case "2WEEKS":
      return "2 weeks";
    case "MONTH":
      return "month";
    case "3MONTHS":
      return "3 months";
    case "4MONTHS":
      return "4 months";
    case "6MONTHS":
      return "6 months";
    case "8MONTHS":
      return "8 months";
    case "YEAR":
      return "year";
  }
}

/** All periods, in display order. Drives the period <Select> everywhere. */
export const ALL_PERIODS: Period[] = [
  "DAY",
  "WEEK",
  "2WEEKS",
  "MONTH",
  "3MONTHS",
  //"4MONTHS",
  "6MONTHS",
  "YEAR",
];

// ---------------------------------------------------------------------------
// Budget mode
// ---------------------------------------------------------------------------

/**
 * How the user frames the money coming in.
 *  - "INCOME"      a recurring after-tax income (e.g. a salary). The "% of
 *                  income" lever is meaningful, so step 3 shows it.
 *  - "TOTAL_SPEND" a fixed pot the user is willing to spend (no recurring
 *                  income). The "% of income" lever is hidden in step 3.
 * The arithmetic is identical for both; only wording and which levers show
 * differ, so everything downstream still works off `income`/`incomePeriod`.
 */
export type BudgetMode = "INCOME" | "TOTAL_SPEND";

// ---------------------------------------------------------------------------
// Necessity
// ---------------------------------------------------------------------------

/**
 * The restricted set of necessity categories. Deliberately limited so users
 * cannot file "wants" (shopping, dining out) as "needs". Each id maps to a
 * label and an emoji icon via {@link NECESSITY_CATEGORIES}.
 */
export type NecessityCategory =
  | "HOUSING"
  | "UTILITIES"
  | "GROCERIES"
  | "TUITION"
  | "SUBSCRIPTIONS"
  | "DEBT"
  | "CAR"
  | "TRANSIT"
  | "CONNECTIVITY"
  | "HEALTHCARE"
  | "INSURANCE";

export interface NecessityCategoryInfo {
  id: NecessityCategory;
  label: string;
  icon: string;
}

/** The only necessity categories a user may pick from. */
export const NECESSITY_CATEGORIES: NecessityCategoryInfo[] = [
  { id: "HOUSING", label: "Housing", icon: "🏠" },
  { id: "UTILITIES", label: "Utilities", icon: "💡" },
  { id: "GROCERIES", label: "Groceries", icon: "🛒" },
  { id: "TUITION", label: "Tuition", icon: "🎓" },
  { id: "SUBSCRIPTIONS", label: "Subscriptions & memberships", icon: "🔁" },
  { id: "DEBT", label: "Debt payments", icon: "💳" },
  { id: "CAR", label: "Car", icon: "🚗" },
  { id: "TRANSIT", label: "Transit", icon: "🚆" },
  { id: "CONNECTIVITY", label: "Internet / cell", icon: "📶" },
  { id: "HEALTHCARE", label: "Healthcare", icon: "🏥" },
  { id: "INSURANCE", label: "Insurance", icon: "🛡️" },
];

/** Look up a necessity category's label + icon. */
export function necessityCategoryInfo(
  category: NecessityCategory,
): NecessityCategoryInfo {
  const info = NECESSITY_CATEGORIES.find((c) => c.id === category);
  // The type system guarantees `category` is valid; fall back defensively.
  return info ?? { id: category, label: category, icon: "•" };
}

/**
 * A recurring required expense. The user enters a total cost over a period;
 * the per-day cost is always derived, never stored. The name/icon come from
 * the chosen {@link NecessityCategory}, keeping necessities to the allowed set.
 */
export interface Necessity {
  id: string; // stable key for lists and edits
  category: NecessityCategory;
  totalCost: number; // total cost over `period`
  period: Period;
  notes: string | null;
}

/** Per-day cost of a single necessity. Derived, never stored. */
export function necessityDailyCost(n: Necessity): number {
  return toDailyAmount(n.totalCost, n.period);
}

/** Create a necessity with a fresh id. Per-day cost is derived, not stored. */
export function createNecessity(
  category: NecessityCategory,
  totalCost: number,
  period: Period,
): Necessity {
  return { id: newId(), category, totalCost, period, notes: null };
}

// ---------------------------------------------------------------------------
// Goal
// ---------------------------------------------------------------------------

/**
 * Emoji choices for goals, matching the categories in the product spec. This
 * is a suggestion palette, not a restriction — unlike necessities, a goal's
 * icon is free-form, so this just saves the user from hunting for an emoji.
 */
export const GOAL_ICONS: { icon: string; label: string }[] = [
  { icon: "🍔", label: "Food" },
  { icon: "✈️", label: "Travel" },
  { icon: "🎁", label: "Gift" },
  { icon: "🛍️", label: "Shopping" },
  { icon: "👕", label: "Clothes" },
  { icon: "💻", label: "Tech" },
  { icon: "🏡", label: "Home" },
  { icon: "🚗", label: "Car" },
  { icon: "🎉", label: "Party" },
  { icon: "🎨", label: "Hobby" },
  { icon: "🎸", label: "Music" },
  { icon: "💍", label: "Engagement ring" },
  { icon: "📚", label: "Learning" },
  { icon: "🏅", label: "Sports" },
  { icon: "🎵", label: "Concert" },
  { icon: "🔨", label: "Renovation" },
  { icon: "💳", label: "Debt" },
  { icon: "🛟", label: "Emergency fund" },
  { icon: "📈", label: "Investment" },
  { icon: "🏥", label: "Healthcare"},
  { icon: "🧘‍♀️", label: "Meditation"},
  { icon: "❤️", label: "Heart"},

];

/**
 * A savings goal.
 *
 * Only two numbers are stored, both with explicit units, and both "sticky" —
 * each changes ONLY through its own setter, never as a side effect of anything
 * else:
 *  - `totalCost`          total amount of the goal, in dollars ($).
 *                         e.g. a new car costs $30000.
 *  - `contributionPerDay` amount added toward the goal each day, in $/day.
 *                         e.g. put $10 into the car fund every day.
 *
 * Everything else — days to reach the goal and the proportion of available
 * daily income the goal consumes — is derived from these two (plus the budget's
 * available daily income). Derived values are never stored, so they cannot
 * drift out of sync.
 *
 * Because both stored values are sticky, a change to `totalCost`, to
 * `contributionPerDay`, or to the budget's available income simply makes the
 * derived readouts recompute; nothing silently rewrites the two stored fields.
 * Most people keep their daily contribution constant, so the natural effect of
 * raising the total cost is "it now takes longer", not "I must pay more".
 */
export interface Goal {
  id: string; // stable key for lists and edits
  name: string;
  icon: string; // an emoji; GOAL_ICONS is a convenience palette
  totalCost: number; // $      — total goal amount (sticky)
  contributionPerDay: number; // $/day — amount added each day (sticky)
  notes: string;
}

/** Create a goal with a fresh id. */
export function createGoal(fields: Omit<Goal, "id">): Goal {
  return { id: newId(), ...fields };
}

/**
 * Days to reach the goal: totalCost ($) / contributionPerDay ($/day) = days.
 * Derived. Returns Infinity when nothing is being contributed.
 */
export function goalDaysToReach(goal: Goal): number {
  if (goal.contributionPerDay <= 0) return Infinity;
  return goal.totalCost / goal.contributionPerDay;
}

/**
 * Proportion (0..1) of available daily income this goal's daily contribution
 * consumes. `availableDailyIncome` is supplied by the budget (income minus
 * necessities), never owned by the goal. Returns Infinity when there is no
 * available income.
 */
export function goalProportion(goal: Goal, availableDailyIncome: number): number {
  if (availableDailyIncome <= 0) return Infinity;
  return goal.contributionPerDay / availableDailyIncome;
}

// --- Goal edits (immutable) ------------------------------------------------

/**
 * Set the daily contribution ($/day) directly. This is the usual lever the user
 * controls; days and proportion re-derive on read. Total cost is untouched.
 */
export function setGoalContributionPerDay(
  goal: Goal,
  contributionPerDay: number,
): Goal {
  return { ...goal, contributionPerDay };
}

/**
 * Set the goal via a target number of days. Back-solves the daily contribution
 * ($/day) that reaches `totalCost` in that many days; total cost is preserved.
 * Days is not stored — it only determines the new contribution. A non-positive
 * day count leaves the goal unchanged.
 */
export function setGoalDays(goal: Goal, days: number): Goal {
  if (days <= 0) return goal;
  return { ...goal, contributionPerDay: goal.totalCost / days };
}

/**
 * Set the goal via a target proportion of available daily income. Back-solves
 * the daily contribution ($/day); total cost is preserved.
 */
export function setGoalProportion(
  goal: Goal,
  proportion: number,
  availableDailyIncome: number,
): Goal {
  return { ...goal, contributionPerDay: proportion * availableDailyIncome };
}

/** Set the total goal amount ($) directly. Total cost is otherwise sticky. */
export function setGoalTotalCost(goal: Goal, totalCost: number): Goal {
  return { ...goal, totalCost };
}

// ---------------------------------------------------------------------------
// BudgetData — the full stored state
// ---------------------------------------------------------------------------

/**
 * The complete budget. Everything here is an independent stored input. Totals
 * and proportions are derived with the helpers below.
 *
 * Available daily income (income minus necessities) is intentionally NOT
 * stored: it is derived, and goals react to it rather than owning it.
 */
export interface BudgetData {
  mode: BudgetMode;
  income: number;
  incomePeriod: Period;
  necessities: Necessity[];
  goals: Goal[];
}

export const initialBudgetData: BudgetData = {
  mode: "INCOME",
  income: 0,
  incomePeriod: "MONTH",
  necessities: [],
  goals: [],
};

/** Per-day cost of a necessity by id, 0 if not found. */
export function unallocatedDailyIncome(data: BudgetData): number {
  return availableDailyIncome(data) - dailyGoalCommitment(data);
}

/** Total income expressed per day. Derived. */
export function dailyIncome(data: BudgetData): number {
  return toDailyAmount(data.income, data.incomePeriod);
}

/** Total per-day cost of all necessities. Derived. */
export function dailyNecessities(data: BudgetData): number {
  return data.necessities.reduce((sum, n) => sum + necessityDailyCost(n), 0);
}

/**
 * Income available per day for goals, after necessities. Derived.
 * This is the value goals measure their proportion against.
 */
export function availableDailyIncome(data: BudgetData): number {
  return dailyIncome(data) - dailyNecessities(data);
}

/** Total per-day amount committed across all goals. Derived. */
export function dailyGoalCommitment(data: BudgetData): number {
  return data.goals.reduce((sum, g) => sum + g.contributionPerDay, 0);
}

/**
 * Sum of all goal proportions. May exceed 1 — goals are independent and
 * over-commitment is allowed (callers warn rather than clamp).
 */
export function totalGoalProportion(data: BudgetData): number {
  const available = availableDailyIncome(data);
  if (available <= 0) return Infinity;
  return dailyGoalCommitment(data) / available;
}

/** True when goals collectively commit more than the available daily income. */
export function isOverCommitted(data: BudgetData): boolean {
  return dailyGoalCommitment(data) > availableDailyIncome(data);
}
