import { http, HttpResponse } from 'msw';
import type { components } from '@/shared/api/schema';
import { samplePlan } from '@/dev/sample-plan';
import { problem } from './auth';
import { profilesState } from './profiles';
import { quotaState } from './quota';

type Schemas = components['schemas'];
type StatusDto = Schemas['GrowthPlanStatusDto'];
type StartRequest = Schemas['StartGrowthPlanRequest'];
type Stage = Schemas['GenerationStage'];
type ExperimentDto = Schemas['ExperimentDto'];

interface StoredPlan {
  id: string;
  profileId: string;
  key: string;
  bodyHash: string;
  /** Status responses served in order; the last one repeats. */
  script: StatusDto[];
  served: number;
  /** Mutable once the plan is terminal (experiments PATCH). */
  experiments?: ExperimentDto[];
}

/** In-memory fake of the growth-plans API; reset after each test by setup.ts. Synthetic content only. */
export const growthState = {
  plans: new Map<string, StoredPlan>(),
  postCalls: [] as { key: string | null; body: StartRequest }[],
  /** Script used for newly created plans. */
  nextScript: null as ((id: string) => StatusDto[]) | null,
  nextId: 1,
};

export function resetGrowthState(): void {
  growthState.plans.clear();
  growthState.postCalls = [];
  growthState.nextScript = null;
  growthState.nextId = 1;
}

const ORDER: Stage[] = [
  'InterpretingBrief',
  'PlanningResearch',
  'RetrievingEvidence',
  'EvaluatingEvidence',
  'GeneratingRecommendations',
  'ValidatingOutput',
  'DesigningExperiments',
  'Saving',
];

/** A status payload with stages before `activeIndex` done, the active one carrying `detail`. */
export function statusAt(
  id: string,
  activeIndex: number,
  options: { detail?: string; status?: StatusDto['status']; failed?: boolean; error?: StatusDto['error'] } = {},
): StatusDto {
  const stages = ORDER.map((stage, index) => ({
    stage,
    state:
      index < activeIndex
        ? ('Done' as const)
        : index === activeIndex
          ? options.failed
            ? ('Failed' as const)
            : ('Active' as const)
          : ('Pending' as const),
    detail: index === activeIndex ? (options.detail ?? null) : null,
  }));
  return {
    id,
    status: options.status ?? (options.failed ? 'Failed' : 'Running'),
    stage: ORDER[activeIndex] ?? 'Done',
    stages,
    updatedAt: new Date().toISOString(),
    error: options.error ?? null,
  };
}

export const completed = (id: string): StatusDto => ({
  ...statusAt(id, ORDER.length),
  status: 'Completed',
  stage: 'Done',
});

const defaultScript = (id: string): StatusDto[] => [
  statusAt(id, 2, { detail: '4 of 9 Qloo requests complete' }),
  completed(id),
];

const isTerminal = (s: StatusDto) => s.status !== 'Queued' && s.status !== 'Running';
const isDone = (s: StatusDto) => s.status === 'Completed' || s.status === 'CompletedWithLimitations';
const experimentsOf = (plan: StoredPlan) => (plan.experiments ??= samplePlan().experiments.map((e) => ({ ...e })));

const ALLOWED: Record<ExperimentDto['status'], ExperimentDto['status'][]> = {
  Proposed: ['Running', 'Abandoned'],
  Running: ['Concluded', 'Abandoned'],
  Concluded: [],
  Abandoned: [],
};
const current = (plan: StoredPlan) => plan.script[Math.min(plan.served, plan.script.length - 1)]!;

function summaryContent(status: StatusDto['status']) {
  if (status !== 'Completed' && status !== 'CompletedWithLimitations') return { headline: null };
  const plan = samplePlan();
  return {
    headline: plan.summary?.headline ?? null,
    counts: {
      evidence: plan.evidence.length,
      insights: plan.insights.length,
      collaborations: plan.collaborations.length,
      campaigns: plan.campaigns.length,
      experiments: plan.experiments.length,
    },
  };
}

export function seedPlan(profileId: string, script: (id: string) => StatusDto[]): string {
  const id = `10000000-0000-4000-8000-${String(growthState.nextId++).padStart(12, '0')}`;
  growthState.plans.set(id, { id, profileId, key: `seed-${id}`, bodyHash: '', script: script(id), served: 0 });
  return id;
}

function accepted(plan: StoredPlan) {
  const s = current(plan);
  return {
    id: plan.id,
    status: s.status,
    stage: s.stage,
    statusUrl: `/api/v1/growth-plans/${plan.id}/status`,
    createdAt: s.updatedAt,
  };
}

export const growthPlanHandlers = [
  http.post('*/api/v1/growth-plans', async ({ request }) => {
    const key = request.headers.get('Idempotency-Key');
    const body = (await request.json()) as StartRequest;
    growthState.postCalls.push({ key, body });
    if (!key) return problem(400, 'idempotency_key_missing');
    const bodyHash = JSON.stringify(body);

    const replay = [...growthState.plans.values()].find((p) => p.key === key);
    if (replay) {
      if (replay.bodyHash !== bodyHash) return problem(409, 'idempotency_key_reused');
      return HttpResponse.json(accepted(replay), { status: isTerminal(current(replay)) ? 200 : 202 });
    }
    if (!profilesState.profiles.has(body.businessProfileId)) return problem(404, 'not_found');
    const running = [...growthState.plans.values()].find(
      (p) => p.profileId === body.businessProfileId && !isTerminal(current(p)),
    );
    if (running) return problem(409, 'plan_in_progress');
    if (quotaState.remainingToday <= 0) {
      return HttpResponse.json(
        { title: 'Daily limit reached', status: 429, code: 'generation_quota_exceeded' },
        { status: 429, headers: { 'Content-Type': 'application/problem+json', 'Retry-After': '3600' } },
      );
    }

    quotaState.remainingToday -= 1;
    const id = `10000000-0000-4000-8000-${String(growthState.nextId++).padStart(12, '0')}`;
    const plan: StoredPlan = {
      id,
      profileId: body.businessProfileId,
      key,
      bodyHash,
      script: (growthState.nextScript ?? defaultScript)(id),
      served: 0,
    };
    growthState.plans.set(id, plan);
    return HttpResponse.json(accepted(plan), { status: 202, headers: { Location: `/api/v1/growth-plans/${id}` } });
  }),

  http.get('*/api/v1/growth-plans', ({ request }) => {
    const url = new URL(request.url);
    const profileId = url.searchParams.get('businessProfileId');
    const status = url.searchParams.get('status');
    const items = [...growthState.plans.values()]
      .filter((p) => (!profileId || p.profileId === profileId) && (!status || current(p).status === status))
      .map((p) => ({
        id: p.id,
        businessProfileId: p.profileId,
        brandName: profilesState.profiles.get(p.profileId)?.dto.brandName ?? 'Sample brand',
        status: current(p).status,
        ...summaryContent(current(p).status),
        isMock: true,
        createdAt: current(p).updatedAt,
      }));
    return HttpResponse.json({ items, page: 1, pageSize: 20, totalCount: items.length });
  }),

  http.get('*/api/v1/growth-plans/:id/status', ({ params }) => {
    const plan = growthState.plans.get(String(params.id));
    if (!plan) return problem(404, 'not_found');
    const s = current(plan);
    plan.served += 1;
    return HttpResponse.json(s);
  }),

  http.patch('*/api/v1/growth-plans/:id/experiments/:experimentId', async ({ params, request }) => {
    const plan = growthState.plans.get(String(params.id));
    if (!plan || !isDone(current(plan))) return problem(404, 'not_found');
    const list = experimentsOf(plan);
    const index = list.findIndex((e) => e.id === params.experimentId);
    const existing = list[index];
    if (!existing) return problem(404, 'not_found');
    const ifMatch = request.headers.get('If-Match');
    if (!ifMatch) return problem(428, 'precondition_required');
    if (ifMatch !== `"${existing.version}"`) return problem(412, 'version_mismatch');
    const body = (await request.json()) as Schemas['UpdateExperimentRequest'];
    if (body.status !== existing.status && !ALLOWED[existing.status].includes(body.status)) {
      return problem(400, 'validation_failed', {
        errors: { Status: [`Can't move from ${existing.status} to ${body.status}.`] },
      });
    }
    const now = new Date().toISOString();
    const updated: ExperimentDto = {
      ...existing,
      status: body.status,
      observedResult: body.observedResult ?? existing.observedResult ?? null,
      resultNotes: body.resultNotes ?? existing.resultNotes ?? null,
      startedAt: body.status === 'Running' && !existing.startedAt ? now : (existing.startedAt ?? null),
      concludedAt: body.status === 'Concluded' || body.status === 'Abandoned' ? now : (existing.concludedAt ?? null),
      version: String(Number(existing.version) + 1),
    };
    list[index] = updated;
    return HttpResponse.json(updated, { headers: { ETag: `"${updated.version}"` } });
  }),

  http.get('*/api/v1/experiments', ({ request }) => {
    const status = new URL(request.url).searchParams.get('status');
    const items = [...growthState.plans.values()]
      .filter((p) => isDone(current(p)))
      .flatMap((p) =>
        experimentsOf(p).map((experiment) => ({
          growthPlanId: p.id,
          brandName: profilesState.profiles.get(p.profileId)?.dto.brandName ?? 'Sample brand',
          experiment,
        })),
      )
      .filter((s) => !status || s.experiment.status === status);
    return HttpResponse.json({ items, page: 1, pageSize: 50, totalCount: items.length });
  }),

  http.get('*/api/v1/sample-plan', () => HttpResponse.json(samplePlan())),

  http.get('*/api/v1/growth-plans/:id', ({ params }) => {
    const plan = growthState.plans.get(String(params.id));
    if (!plan) return problem(404, 'not_found');
    const s = current(plan);
    const brief = profilesState.profiles.get(plan.profileId)?.dto;
    const content = samplePlan({ id: plan.id, businessProfileId: plan.profileId, isSample: false });
    const terminal = isDone(s);
    // Content fields are only populated once the plan is terminal (contract).
    return HttpResponse.json({
      ...content,
      brandName: brief?.brandName ?? content.brandName,
      status: s.status,
      stage: s.stage,
      error: s.error ?? null,
      ...(terminal ? { experiments: experimentsOf(plan) } : {}),
      ...(terminal
        ? {}
        : {
            summary: null,
            evidence: [],
            insights: [],
            collaborations: [],
            campaigns: [],
            experiments: [],
            unlinkedMentions: [],
            limitations: [],
            completedAt: null,
          }),
    });
  }),
];

/** Simulates another tab/device updating an experiment, so the next PATCH with the old ETag gets 412. */
export function editExperimentElsewhere(planId: string, experimentId: string, changes: Partial<ExperimentDto>): void {
  const plan = growthState.plans.get(planId);
  if (!plan) throw new Error(`no plan ${planId}`);
  const list = experimentsOf(plan);
  const index = list.findIndex((e) => e.id === experimentId);
  const existing = list[index]!;
  list[index] = { ...existing, ...changes, version: String(Number(existing.version) + 1) };
}
