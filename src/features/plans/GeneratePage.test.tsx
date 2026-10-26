import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { authState } from '@/test/msw/handlers/auth';
import { growthState, seedPlan, statusAt } from '@/test/msw/handlers/growthPlans';
import { seedProfile } from '@/test/msw/handlers/profiles';
import { quotaState } from '@/test/msw/handlers/quota';
import { server } from '@/test/msw/server';
import { setOnline } from '@/test/online';
import { renderRoute } from '@/test/renderRoute';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

beforeEach(() => {
  authState.refreshValid = true;
});

async function openGenerate() {
  const profile = seedProfile();
  const view = renderRoute(`/app/profiles/${profile.id}/generate`);
  await screen.findByRole('heading', { level: 1, name: 'Generate your growth plan' });
  return { ...view, profile };
}

const generateButton = () => screen.getByRole('button', { name: /Generate growth plan|Retry/ });

afterEach(() => setOnline(true));

describe('GeneratePage', () => {
  it('shows the brief, options and quota, then starts generation with a fresh Idempotency-Key', async () => {
    const { user, router, profile } = await openGenerate();
    expect(screen.getByRole('heading', { name: 'Eko Thread Co.' })).toBeInTheDocument();
    expect(screen.getByText('Streetwear · Lagos · Sales · ₦100k–₦500k · 1 reference')).toBeInTheDocument();
    expect(await screen.findByText('Uses 1 of your 7 remaining plans today.')).toBeInTheDocument();

    await user.click(screen.getByRole('switch', { name: 'Include partnership ideas' }));
    await user.click(screen.getByRole('radio', { name: '2' }));
    await user.click(generateButton());

    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/app\/plans\/[0-9a-f-]+\/progress$/));
    expect(growthState.postCalls).toHaveLength(1);
    const call = growthState.postCalls[0]!;
    expect(call.key).toMatch(UUID);
    expect(call.body).toEqual({
      businessProfileId: profile.id,
      options: { includeCollaborations: false, includeCampaigns: true, maxCampaigns: 2 },
    });
    // The intent is settled, so nothing is left pending in sessionStorage.
    expect(Object.keys(sessionStorage).filter((k) => k.startsWith('kc-idem:'))).toHaveLength(0);
  });

  it('never auto-retries an unconfirmed request; manual Retry reuses the same key', async () => {
    let failures = 1;
    server.use(
      http.post('*/api/v1/growth-plans', async ({ request }) => {
        if (failures > 0) {
          failures -= 1;
          growthState.postCalls.push({
            key: request.headers.get('Idempotency-Key'),
            body: (await request.json()) as never,
          });
          return HttpResponse.error();
        }
        return undefined; // fall through to the default handler
      }),
    );
    const { user, router } = await openGenerate();
    await user.click(generateButton());

    expect(await screen.findByText(/We couldn.t confirm your request/)).toBeInTheDocument();
    const retry = screen.getByRole('button', { name: 'Retry' });
    // Give any (wrongly) automatic retry a chance to happen.
    await new Promise((r) => setTimeout(r, 300));
    expect(growthState.postCalls).toHaveLength(1);
    const firstKey = growthState.postCalls[0]!.key;

    await user.click(retry);
    await waitFor(() => expect(router.state.location.pathname).toMatch(/\/progress$/));
    expect(growthState.postCalls).toHaveLength(2);
    expect(growthState.postCalls[1]!.key).toBe(firstKey);
  });

  it('uses a new key when the options change after an unconfirmed attempt', async () => {
    server.use(
      http.post('*/api/v1/growth-plans', async ({ request }) => {
        growthState.postCalls.push({
          key: request.headers.get('Idempotency-Key'),
          body: (await request.json()) as never,
        });
        return HttpResponse.error();
      }),
    );
    const { user } = await openGenerate();
    await user.click(generateButton());
    await screen.findByText(/We couldn.t confirm your request/);
    await user.click(screen.getByRole('radio', { name: '1' }));
    await user.click(generateButton());

    await waitFor(() => expect(growthState.postCalls).toHaveLength(2));
    expect(growthState.postCalls[1]!.key).not.toBe(growthState.postCalls[0]!.key);
  });

  it('links to the running plan on 409 plan_in_progress', async () => {
    const profile = seedProfile();
    const runningId = seedPlan(profile.id, (id) => [statusAt(id, 1)]);
    const { user } = renderRoute(`/app/profiles/${profile.id}/generate`);
    await screen.findByRole('heading', { level: 1, name: 'Generate your growth plan' });
    await user.click(generateButton());

    expect(await screen.findByText(/already being researched/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View its progress' })).toHaveAttribute(
      'href',
      `/app/plans/${runningId}/progress`,
    );
  });

  it('explains a 429 quota rejection with the reset time', async () => {
    server.use(
      http.post('*/api/v1/growth-plans', () =>
        HttpResponse.json(
          { title: 'Daily limit reached', status: 429, code: 'generation_quota_exceeded' },
          { status: 429, headers: { 'Content-Type': 'application/problem+json', 'Retry-After': '3600' } },
        ),
      ),
    );
    const { user } = await openGenerate();
    await user.click(generateButton());
    expect(
      await screen.findByText(/You.ve reached today.s plan limit\. You can generate again from/),
    ).toBeInTheDocument();
  });

  it('disables generation when the daily quota is used up', async () => {
    quotaState.remainingToday = 0;
    await openGenerate();
    expect(await screen.findByText(/You.ve used all 10 plans for today/)).toBeInTheDocument();
    expect(generateButton()).toBeDisabled();
  });

  it('disables generation offline and says why', async () => {
    await openGenerate();
    setOnline(false);
    expect(await screen.findByText('Generating needs an internet connection')).toBeInTheDocument();
    expect(generateButton()).toBeDisabled();
    expect(growthState.postCalls).toHaveLength(0);
  });
});
