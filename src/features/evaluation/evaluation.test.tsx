import { cleanup, screen, waitFor, within } from '@testing-library/react';
import { expectNoAxeViolations } from '@/test/axe';
import { authState } from '@/test/msw/handlers/auth';
import { evaluationState } from '@/test/msw/handlers/evaluations';
import { seedProfile } from '@/test/msw/handlers/profiles';
import { renderRoute } from '@/test/renderRoute';
import { parseLlmOnlyDraft, unverifiedNames } from './llm-only-draft';

beforeEach(() => {
  authState.refreshValid = true;
  evaluationState.enabled = true;
  vi.stubEnv('VITE_ENABLE_EVALUATION', 'true');
});
afterEach(() => vi.unstubAllEnvs());

describe('evaluation page', () => {
  it('runs a comparison and shows neutral measures, caveats and both plans', async () => {
    seedProfile();
    const { user } = renderRoute('/app/evaluate');
    await screen.findByRole('heading', { level: 1, name: /Evaluation mode/ });
    expect(screen.getByRole('link', { name: /Evaluation/ })).toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: 'Run comparison' }));
    expect(await screen.findByText('Running comparison…')).toBeInTheDocument();
    expect(evaluationState.postCalls[0]?.key).toEqual(expect.any(String));

    const table = await screen.findByRole('table', { name: /Comparison measures/ });
    const row = (measure: string) =>
      within(table)
        .getByRole('row', { name: new RegExp(`^${measure}`) })
        .querySelectorAll('td');
    expect([...row('Traceable to retrieved data')].map((td) => td.textContent)).toEqual([
      'Traceable to retrieved data',
      '14 of 14',
      '0 of 11',
    ]);
    expect(row('Recommendations with evidence')[2]?.textContent).toBe('n/a');
    // Neutral: no winner, ever.
    expect(screen.queryByText(/winner|better/i)).not.toBeInTheDocument();

    expect(screen.getByText('The AI-only plan cannot cite retrieved data by design.')).toBeInTheDocument();
    expect(screen.getByText('Mock mode: both outputs use synthetic data.')).toBeInTheDocument();

    const aiOnly = screen.getByRole('article', { name: 'AI-only plan' });
    expect(within(aiOnly).getByText('AI-generated')).toBeInTheDocument();
    expect(within(aiOnly).getAllByText('Sample Label Z', { selector: 'mark' }).length).toBeGreaterThan(0);
    const grounded = screen.getByRole('article', { name: 'Qloo-grounded plan' });
    expect(within(grounded).getByText('Retrieved from Qloo')).toBeInTheDocument();
    expect(await within(grounded).findByRole('link', { name: /Open the full plan/ })).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Reviewer notes/), 'Grounded plan names real partners.');
    expect(sessionStorage.length + localStorage.length).toBe(0);

    // The desktop sidebar and phone tab bar are both in jsdom's tree (CSS hides one), so check the page content.
    await expectNoAxeViolations(screen.getByRole('main'));
  });

  it('shows a failed comparison with its reason', async () => {
    seedProfile();
    evaluationState.failNext = true;
    const { user } = renderRoute('/app/evaluate');
    await user.click(await screen.findByRole('button', { name: 'Run comparison' }));
    expect(await screen.findByText('Not enough cultural evidence for this brief.')).toBeInTheDocument();
  });

  it('resumes a comparison from the URL after a reload', async () => {
    const profile = seedProfile();
    const { user, router } = renderRoute('/app/evaluate');
    await user.click(await screen.findByRole('button', { name: 'Run comparison' }));
    await waitFor(() => expect(router.state.location.search).toMatch(/run=/));
    const search = router.state.location.search;
    await screen.findByRole('table', { name: /Comparison measures/ });

    cleanup();
    renderRoute(`/app/evaluate${search}`);
    expect(await screen.findByRole('table', { name: /Comparison measures/ })).toBeInTheDocument();
    expect(evaluationState.postCalls).toHaveLength(1);
    expect(evaluationState.postCalls[0]?.businessProfileId).toBe(profile.id);
  });

  it('asks for a brief first when there are none', async () => {
    renderRoute('/app/evaluate');
    expect(await screen.findByRole('heading', { name: 'Create a brief first' })).toBeInTheDocument();
  });

  it('stays hidden when the server flag is off, even with the build flag on', async () => {
    evaluationState.enabled = false;
    renderRoute('/app/evaluate');
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });
});

describe('AI-only output parsing', () => {
  it('keeps what it can display and drops malformed items', () => {
    const draft = parseLlmOnlyDraft({
      insights: [{ title: 'Kept' }, { nope: true }, 'junk'],
      collaborations: 'not a list',
      mentionedEntities: [
        { name: 'Unverified Co', evidenceKey: null },
        { name: 'Linked', evidenceKey: 'ev_001' },
      ],
    });
    expect(draft?.insights).toEqual([{ title: 'Kept' }]);
    expect(draft?.collaborations).toEqual([]);
    expect(unverifiedNames(draft!)).toEqual(['Unverified Co']);
  });

  it('copes with a missing output', () => {
    expect(parseLlmOnlyDraft(null)?.insights).toEqual([]);
  });
});
