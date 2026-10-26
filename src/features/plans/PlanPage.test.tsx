import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { samplePlan } from '@/dev/sample-plan';
import { authState } from '@/test/msw/handlers/auth';
import { completed, seedPlan, statusAt } from '@/test/msw/handlers/growthPlans';
import { metaFixture } from '@/test/msw/handlers/meta';
import { seedProfile } from '@/test/msw/handlers/profiles';
import { server } from '@/test/msw/server';
import { renderRoute } from '@/test/renderRoute';

function serveSample(overrides: Parameters<typeof samplePlan>[0] = {}) {
  server.use(http.get('*/api/v1/sample-plan', () => HttpResponse.json(samplePlan(overrides))));
}

async function openSample(path = '/sample') {
  const view = renderRoute(path);
  await screen.findByRole('heading', { level: 1, name: 'Eko Thread Co.' });
  return view;
}

describe('sample plan (/sample)', () => {
  it('renders the labelled sample plan with summary, next step, insights, counts and limitations', async () => {
    await openSample();
    expect(screen.getByText('Sample plan · synthetic data')).toBeInTheDocument();
    expect(
      screen.getByText('Lead with minimalist graphic tees for 18–30 online shoppers in Lagos'),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Start your first experiment' })).toBeInTheDocument();

    const glance = screen.getByRole('heading', { name: 'Evidence at a glance' }).closest('section')!;
    // Counted from the 12 evidence items: 5 Strong, 4 Moderate, 3 Weak.
    expect(within(glance).getByText('Strong').nextSibling).toHaveTextContent('5');
    expect(within(glance).getByText('Moderate').nextSibling).toHaveTextContent('4');
    expect(within(glance).getByText('Weak').nextSibling).toHaveTextContent('3');

    const limitations = screen.getByRole('heading', { name: 'Limitations' }).closest('section')!;
    expect(within(limitations).getAllByRole('listitem')).toHaveLength(2);
    // Sample mode has no account actions.
    expect(screen.queryByRole('link', { name: /Regenerate/ })).not.toBeInTheDocument();
  });

  it('keeps retrieved facts and AI interpretation in separately labelled panels', async () => {
    const { user } = await openSample();
    await user.click(screen.getByRole('tab', { name: 'Insights' }));
    const card = screen
      .getByRole('heading', { name: 'Your customers’ tastes overlap with minimalist streetwear brands' })
      .closest('article')!;

    const data = within(card).getByRole('group', { name: 'What the data shows' });
    expect(within(data).getByText('Retrieved from Qloo')).toBeInTheDocument();
    expect(within(data).getByText(/People who like your reference brand/)).toBeInTheDocument();
    expect(within(data).queryByText('AI-generated')).not.toBeInTheDocument();

    const ai = within(card).getByRole('group', { name: 'Why it matters for your brand' });
    expect(within(ai).getByText('AI-generated')).toBeInTheDocument();
    expect(within(ai).getByText(/A cleaner line of tees/)).toBeInTheDocument();
    expect(within(ai).queryByText('Retrieved from Qloo')).not.toBeInTheDocument();
  });

  it('opens a chip in the drawer and "Used in" jumps to the citing card', async () => {
    const { user, router } = await openSample();
    await user.click(screen.getAllByRole('button', { name: 'Open evidence ev_003 Sample Brand B' })[0]!);

    const drawer = await screen.findByRole('dialog', { name: 'Sample Brand B' });
    expect(within(drawer).getByText('0.91')).toBeInTheDocument();
    await user.click(within(drawer).getByRole('button', { name: 'Partnership · Sample Brand B' }));

    await waitFor(() => expect(router.state.location.search).toBe('?tab=partnerships'));
    await waitFor(() => expect(document.getElementById('col_1')).toHaveFocus());
  });

  it('deep-links to a tab and shows only real affinity values in the chart', async () => {
    await openSample('/sample?tab=evidence');
    const chart = screen.getByText('Top affinity scores returned by Qloo').closest('figure')!;
    // 10 of the 12 items have an affinity; the chart shows the top 10 of those, highest first.
    const bars = within(chart).getAllByRole('button');
    expect(bars).toHaveLength(10);
    expect(bars[0]).toHaveTextContent('streetwear');
    expect(bars[0]).toHaveTextContent('0.93');
    expect(within(chart).queryByText('upcycling')).not.toBeInTheDocument();
  });

  it('filters and sorts the evidence table', async () => {
    const { user } = await openSample('/sample?tab=evidence');
    const table = screen.getByRole('table', { name: /Evidence retrieved from Qloo/ });

    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by strength' }), 'Weak');
    expect(within(table).getAllByRole('row')).toHaveLength(1 + 3);
    expect(screen.getByText('Showing 3 of 12 items')).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by strength' }), '');
    await user.type(screen.getByRole('searchbox', { name: /Search evidence/ }), 'sample');
    expect(screen.getByText('Showing 7 of 12 items')).toBeInTheDocument();

    await user.click(within(table).getByRole('button', { name: /Affinity/ }));
    const header = within(table).getByRole('columnheader', { name: /Affinity/ });
    expect(header).toHaveAttribute('aria-sort', 'descending');
    const firstRow = within(table).getAllByRole('row')[1]!;
    expect(firstRow).toHaveTextContent('Sample Brand B');
  });

  it('flags limitations, unknown evidence keys and empty sections honestly', async () => {
    const base = samplePlan();
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    serveSample({
      status: 'CompletedWithLimitations',
      collaborations: [],
      unlinkedMentions: [],
      insights: [{ ...base.insights[0]!, evidenceKeys: ['ev_003', 'ev_404'] }],
    });
    const { user } = await openSample();
    expect(screen.getByText(/Some sections have less evidence than usual/)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Insights' }));
    expect(screen.getByText('missing evidence')).toBeInTheDocument();
    expect(error).toHaveBeenCalledWith(expect.stringContaining('ev_404'));

    await user.click(screen.getByRole('tab', { name: 'Partnerships' }));
    expect(screen.getByText(/No partnership ideas in this plan/)).toBeInTheDocument();
    error.mockRestore();
  });

  it('shows a plan-level MOCK banner when the plan is mock but the service is live', async () => {
    server.use(
      http.get('*/api/v1/meta', () => HttpResponse.json({ ...metaFixture, isMockMode: false, qlooMode: 'Live' })),
    );
    await openSample();
    expect(screen.getByText('MOCK DATA — not real Qloo intelligence')).toBeInTheDocument();
  });
});

describe('own plan (/app/plans/:id)', () => {
  beforeEach(() => {
    authState.refreshValid = true;
  });

  it('renders a completed plan with Regenerate pointing at its brief', async () => {
    const profile = seedProfile();
    const id = seedPlan(profile.id, (planId) => [completed(planId)]);
    renderRoute(`/app/plans/${id}`);
    expect(await screen.findByRole('heading', { level: 1, name: 'Eko Thread Co.' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Regenerate/ })).toHaveAttribute(
      'href',
      `/app/profiles/${profile.id}/generate`,
    );
    expect(screen.queryByText('Sample plan · synthetic data')).not.toBeInTheDocument();
  });

  it('sends an unfinished plan to its progress screen', async () => {
    const profile = seedProfile();
    const id = seedPlan(profile.id, (planId) => [statusAt(planId, 1)]);
    const { router } = renderRoute(`/app/plans/${id}`);
    await waitFor(() => expect(router.state.location.pathname).toBe(`/app/plans/${id}/progress`));
  });
});
