import type { components } from '@/shared/api/schema';
import type { ProgressStep, StepState } from '@/shared/ui/ProgressSteps';

type Schemas = components['schemas'];
export type GenerationStage = Schemas['GenerationStage'];
export type GenerationStatus = Schemas['GenerationStatus'];
export type StageLogEntry = Schemas['StageLogEntry'];

/** Plain-language names for the backend's pipeline stages (design 3g). Queued/Done are states, not steps. */
const STAGE_LABEL: Partial<Record<GenerationStage, string>> = {
  InterpretingBrief: 'Reading your brief',
  PlanningResearch: 'Planning research',
  RetrievingEvidence: 'Searching Qloo data',
  EvaluatingEvidence: 'Checking the evidence',
  GeneratingRecommendations: 'Writing recommendations',
  ValidatingOutput: 'Verifying every claim',
  DesigningExperiments: 'Designing experiments',
  Saving: 'Saving',
};

const STEP_STATE: Record<StageLogEntry['state'], StepState> = {
  Pending: 'pending',
  Active: 'active',
  Done: 'done',
  Skipped: 'skipped',
  Failed: 'failed',
};

/**
 * Turns the backend stage log into stepper rows. Only stages and details the backend reported are shown — the UI
 * never invents progress (US-D2, FE-01 §4).
 */
export function toProgressSteps(stages: StageLogEntry[]): ProgressStep[] {
  return stages.flatMap((entry) => {
    const label = STAGE_LABEL[entry.stage];
    return label ? [{ id: entry.stage, label, state: STEP_STATE[entry.state], detail: entry.detail ?? null }] : [];
  });
}

export const TERMINAL_STATUSES: readonly GenerationStatus[] = ['Completed', 'CompletedWithLimitations', 'Failed'];

export function isTerminal(status: GenerationStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

const FAST_POLL_MS = 2_000;
const SLOW_POLL_MS = 5_000;
const FAST_WINDOW_MS = 30_000;

/** FE-01 §4: poll every 2 s for the first 30 s, then every 5 s; stop once the plan is terminal. */
export function pollInterval(status: GenerationStatus | undefined, elapsedMs: number): number | false {
  if (status && isTerminal(status)) return false;
  return elapsedMs < FAST_WINDOW_MS ? FAST_POLL_MS : SLOW_POLL_MS;
}
