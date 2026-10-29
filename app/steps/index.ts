import { IncomeStep, validateIncome } from "./income-step";
import { NecessitiesStep, validateNecessities } from "./necessities-step";
import { GoalsStep } from "./goals-step";
import { OverviewStep } from "./overview-step";
import type { StepDefinition } from "./types";

/**
 * Ordered list of wizard steps. The index into this array is the step number.
 */
export const steps: StepDefinition[] = [
  {
    id: "income",
    label: "Income",
    Component: IncomeStep,
    validate: validateIncome,
  },
  {
    id: "necessities",
    label: "Necessities",
    Component: NecessitiesStep,
    validate: validateNecessities,
  },
  { id: "goals", label: "Goals", Component: GoalsStep },
  { id: "overview", label: "Overview", Component: OverviewStep },
];

export * from "./types";
