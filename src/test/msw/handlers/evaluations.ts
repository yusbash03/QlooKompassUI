import { http, HttpResponse } from 'msw';
import type { components } from '@/shared/api/schema';
import { problem } from './auth';
import { completed, seedPlan } from './growthPlans';
import { metaFixture } from './meta';
import { profilesState } from './profiles';

type Evaluation = components['schemas']['EvaluationDto'];

/** Synthetic AI-only output (fictional names) — the shape of a GrowthPlanDraft without evidence. */
export const llmOnlyOutputFixture = {
  summary: { headline: 'Lean into a collaboration with Sample Label Z for the Lagos launch.' },
  insights: [{ title: 'Minimalism is rising', finding: 'Shoppers at Sample Venue Y prefer muted palettes.' }],
  collaborations: [{ partnerName: 'Sample Label Z', culturalConnection: 'Shared minimalist aesthetic.' }],
  campaigns: [{ title: 'Quiet drop', angle: 'Numbered pieces, no logos.' }],
  experiments: [{ hypothesis: 'A numbered drop lifts sales 30%.' }],
  mentionedEntities: [
    { name: 'Sample Label Z', evidenceKey: null },
    { name: 'Sample Venue Y', evidenceKey: null },
  ],
};

export const evaluationMetricsFixture = {
  grounded: {
    namedEntities: 14,
    traceableEntities: 14,
    unsupportedEntities: 0,
    recommendationsWithEvidencePct: 100,
    unsupportedNumericClaims: 0,
    avgEntitiesPerRecommendation: 2.1,
    briefTermCoveragePct: 100,
  },
  llmOnly: {
    namedEntities: 11,
    traceableEntities: 0,
    unsupportedEntities: 7,
    recommendationsWithEvidencePct: null,
    unsupportedNumericClaims: 3,
    avgEntitiesPerRecommendation: 1.4,
    briefTermCoveragePct: 80,
  },
};

interface StoredEvaluation {
  key: string;
  /** Responses served in order; the last one repeats. */
  script: Evaluation[];
  served: number;
}

export const evaluationState = {
  enabled: false,
  runs: new Map<string, StoredEvaluation>(),
  postCalls: [] as { key: string | null; businessProfileId: string }[],
  nextId: 1,
  /** Make the next started comparison fail. */
  failNext: false,
};

export function resetEvaluationState(): void {
  evaluationState.enabled = false;
  evaluationState.runs.clear();
  evaluationState.postCalls = [];
  evaluationState.nextId = 1;
  evaluationState.failNext = false;
}

function script(id: string, businessProfileId: string, fail: boolean): Evaluation[] {
  const base = { id, businessProfileId, createdAt: new Date().toISOString(), notes: [] };
  const running: Evaluation = { ...base, status: 'Running' };
  if (fail) {
    return [
      running,
      {
        ...base,
        status: 'Failed',
        error: { code: 'qloo_no_evidence', message: 'Not enough cultural evidence for this brief.' },
      },
    ];
  }
  return [
    running,
    {
      ...base,
      status: 'Completed',
      groundedPlanId: seedPlan(businessProfileId, (planId) => [completed(planId)]),
      // The contract types this as an untyped object.
      llmOnlyOutput: llmOnlyOutputFixture as unknown as Evaluation['llmOnlyOutput'],
      groundedMetrics: evaluationMetricsFixture.grounded,
      llmOnlyMetrics: evaluationMetricsFixture.llmOnly,
      notes: ['Mock mode: both outputs use synthetic data.'],
      completedAt: new Date().toISOString(),
    },
  ];
}

export const evaluationHandlers = [
  // The server half of the evaluation flag (the build half is VITE_ENABLE_EVALUATION).
  http.get('*/api/v1/meta', () => {
    if (!evaluationState.enabled) return undefined;
    return HttpResponse.json({ ...metaFixture, features: { ...metaFixture.features, evaluationMode: true } });
  }),

  http.post('*/api/v1/evaluations', async ({ request }) => {
    const key = request.headers.get('Idempotency-Key');
    const body = (await request.json()) as { businessProfileId: string };
    evaluationState.postCalls.push({ key, businessProfileId: body.businessProfileId });
    if (!evaluationState.enabled) return problem(503, 'feature_disabled');
    if (!key) return problem(400, 'idempotency_key_missing');
    const replay = [...evaluationState.runs.values()].find((r) => r.key === key);
    if (replay) return HttpResponse.json(replay.script[0], { status: 202 });
    if (!profilesState.profiles.has(body.businessProfileId)) return problem(404, 'not_found');

    const id = `20000000-0000-4000-8000-${String(evaluationState.nextId++).padStart(12, '0')}`;
    const run = { key, script: script(id, body.businessProfileId, evaluationState.failNext), served: 0 };
    evaluationState.failNext = false;
    evaluationState.runs.set(id, run);
    return HttpResponse.json(run.script[0], { status: 202, headers: { Location: `/api/v1/evaluations/${id}` } });
  }),

  http.get('*/api/v1/evaluations/:id', ({ params }) => {
    const run = evaluationState.runs.get(String(params.id));
    if (!run) return problem(404, 'not_found');
    const response = run.script[Math.min(run.served, run.script.length - 1)];
    run.served += 1;
    return HttpResponse.json(response);
  }),
];
