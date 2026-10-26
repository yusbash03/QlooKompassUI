import { screen, waitFor, within } from '@testing-library/react';
import { authState } from '@/test/msw/handlers/auth';
import { completed, seedPlan, statusAt } from '@/test/msw/handlers/growthPlans';
import { seedProfile } from '@/test/msw/handlers/profiles';
import { renderRoute } from '@/test/renderRoute';
import { pollInterval, toProgressSteps } from './stages';

beforeEach(() => {
  authState.refreshValid = true;
});

describe('ProgressPage', () => {
  it('renders only the stages and details the backend reports', async () => {
    const profile = seedProfile();
    const id = seedPlan(profile.id, (planId) => [statusAt(planId, 2, { detail: '4 of 9 Qloo requests complete' })]);
    renderRoute(`/app/plans/${id}/progress`);

    const steps = await screen.findByRole('list', { name: 'Research progress' });
    expect(within(steps).getAllByRole('listitem')).toHaveLength(8);
    expect(within(steps).getByText('4 of 9 Qloo requests complete')).toBeInTheDocument();
    expect(within(steps).getByText(/Searching Qloo data/)).toBeInTheDocument();
    expect(within(steps).getAllByRole('listitem')[2]).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText(/Usually 30–90 seconds/)).toBeInTheDocument();
    expect(await screen.findByText('Eko Thread Co.')).toBeInTheDocument();
    // No invented progress: nothing that looks like a percentage.
    expect(document.body.textContent).not.toMatch(/\d+\s?%/);
  });

  it('says it is waiting while the plan is queued with no stages yet', async () => {
    const profile = seedProfile();
    const id = seedPlan(profile.id, (planId) => [
      { ...statusAt(planId, 0), status: 'Queued', stage: 'Queued', stages: [] },
    ]);
    renderRoute(`/app/plans/${id}/progress`);
    expect(await screen.findByText('Waiting to start — usually a few seconds.')).toBeInTheDocument();
  });

  it('keeps polling and opens the plan once it completes', async () => {
    const profile = seedProfile();
    const id = seedPlan(profile.id, (planId) => [statusAt(planId, 4), completed(planId)]);
    const { router } = renderRoute(`/app/plans/${id}/progress`);

    await screen.findByText(/Writing recommendations/);
    // The second poll (2 s later) reports Completed → replace-navigate to the report.
    await waitFor(() => expect(router.state.location.pathname).toBe(`/app/plans/${id}`), { timeout: 6000 });
  });

  it('shows the user-safe failure reason with Edit brief and Try again', async () => {
    const profile = seedProfile();
    const id = seedPlan(profile.id, (planId) => [
      statusAt(planId, 2, {
        failed: true,
        detail: 'Not enough data returned',
        error: { code: 'qloo_no_evidence', message: 'Add 1–3 reference brands or artists your customers love.' },
      }),
    ]);
    renderRoute(`/app/plans/${id}/progress`);

    expect(await screen.findByRole('heading', { name: 'We couldn’t finish this plan' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Add 1–3 reference brands or artists your customers love.');
    expect(await screen.findByRole('link', { name: 'Edit brief' })).toHaveAttribute(
      'href',
      `/app/profiles/${profile.id}/edit`,
    );
    expect(screen.getByRole('link', { name: 'Try again' })).toHaveAttribute(
      'href',
      `/app/profiles/${profile.id}/generate`,
    );
  });

  it('shows "not found" for a missing or foreign plan', async () => {
    renderRoute('/app/plans/10000000-0000-4000-8000-999999999999/progress');
    expect(await screen.findByRole('heading', { name: 'Plan not found' })).toBeInTheDocument();
  });
});

describe('progress helpers', () => {
  it('polls every 2 s for the first 30 s, then every 5 s, and stops when terminal', () => {
    expect(pollInterval('Running', 0)).toBe(2000);
    expect(pollInterval('Queued', 29_999)).toBe(2000);
    expect(pollInterval('Running', 30_000)).toBe(5000);
    expect(pollInterval(undefined, 0)).toBe(2000);
    expect(pollInterval('Completed', 0)).toBe(false);
    expect(pollInterval('CompletedWithLimitations', 0)).toBe(false);
    expect(pollInterval('Failed', 99_000)).toBe(false);
  });

  it('drops the non-step stages and keeps backend detail verbatim', () => {
    const steps = toProgressSteps([
      { stage: 'Queued', state: 'Done' },
      { stage: 'RetrievingEvidence', state: 'Active', detail: '2 of 9 requests complete' },
      { stage: 'Done', state: 'Pending' },
    ]);
    expect(steps).toEqual([
      { id: 'RetrievingEvidence', label: 'Searching Qloo data', state: 'active', detail: '2 of 9 requests complete' },
    ]);
  });
});
