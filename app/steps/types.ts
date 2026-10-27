import type { ComponentType } from "react";
import type { BudgetData } from "../types";

// The budget domain model lives in app/types.ts. Re-exported here so step
// components can import everything they need from "./types" (and, via the
// barrel, from "../steps").
export * from "../types";
export { initialBudgetData } from "../types";

/**
 * Props every step component receives from the wizard container.
 *
 * All step data lives on the parent wizard as a single {@link BudgetData}, so
 * moving back to an earlier step never discards what was entered later.
 */
export interface StepProps {
  data: BudgetData;
  /** Merge a partial update into the shared budget data. */
  updateData: (patch: Partial<BudgetData>) => void;
  /**
   * Jump to another step by id, subject to the wizard's reachability rules
   * (a no-op if that step can't be reached yet). Used by the overview's
   * section "edit" shortcuts.
   */
  goToStep: (id: StepId) => void;
}

/** A section of the budget a step is responsible for. */
export type StepId = "income" | "necessities" | "goals" | "overview";

export interface StepDefinition {
  /** Stable identifier and step key. */
  id: StepId;
  /** Human-readable label shown in the step selector. */
  label: string;
  Component: ComponentType<StepProps>;
}
