import { IncomeStep } from "./income-step";
import { NecessitiesStep } from "./necessities-step";
import { GoalsStep } from "./goals-step";
import { OverviewStep } from "./overview-step";
import type { StepDefinition } from "./types";

/**
 * Ordered list of wizard steps. The index into this array is the step number.
 */
export const steps: StepDefinition[] = [
  { id: "income", label: "Income", Component: IncomeStep },
  { id: "necessities", label: "Necessities", Component: NecessitiesStep },
  { id: "goals", label: "Goals", Component: GoalsStep },
  { id: "overview", label: "Overview", Component: OverviewStep },
];

export * from "./types";
