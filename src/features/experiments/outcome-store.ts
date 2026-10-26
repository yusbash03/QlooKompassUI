import { useSyncExternalStore } from 'react';

export type MatchedRule = 'success' | 'failure';

/**
 * "Did it meet the threshold?" from the Record result dialog. The API contract has no field for it yet
 * (UpdateExperimentRequest: status, observedResult, resultNotes), so the answer lives in memory for this session only —
 * enough to highlight the matching decision rule right after recording. Cleared on sign-out.
 * TODO(contract): add e.g. `metThreshold: boolean | null` to ExperimentDto/UpdateExperimentRequest and persist it.
 */
const outcomes = new Map<string, MatchedRule>();
const listeners = new Set<() => void>();
const key = (planId: string, experimentId: string) => `${planId}:${experimentId}`;

export const outcomeStore = {
  set(planId: string, experimentId: string, rule: MatchedRule) {
    outcomes.set(key(planId, experimentId), rule);
    for (const l of listeners) l();
  },
  clear() {
    outcomes.clear();
    for (const l of listeners) l();
  },
};

export function useMatchedRule(planId: string, experimentId: string): MatchedRule | undefined {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => outcomes.get(key(planId, experimentId)),
    () => undefined,
  );
}
