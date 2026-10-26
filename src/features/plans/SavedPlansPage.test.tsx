import { screen, waitFor, within } from '@testing-library/react';
import { samplePlan } from '@/dev/sample-plan';
import { listOfflineCopies, offlineDbName, saveOfflineCopy } from '@/features/offline/offlineStore';
import { tokenStore } from '@/features/auth/tokenStore';
import { authState, testUser } from '@/test/msw/handlers/auth';
import { completed, seedPlan, statusAt } from '@/test/msw/handlers/growthPlans';
import { seedProfile } from '@/test/msw/handlers/profiles';
import { setOnline } from '@/test/online';
import { renderRoute } from '@/test/renderRoute';

beforeEach(() => {
  authState.refreshValid = true;
});
afterEach(() => setOnline(true));

const databases = async () => (await indexedDB.databases()).map((d) => d.name);

describe('saved plans', () => {
  it('lists plans as report cards linking to the plan or its progress', async () => {
    const profile = seedProfile();
    const doneId = seedPlan(profile.id, (id) => [completed(id)]);
    const runningId = seedPlan(profile.id, (id) => [statusAt(id, 2)]);
    renderRoute('/app/plans');

    const cards = await screen.findAllByRole('link', { name: /Eko Thread Co\./ });
    const done = cards.find((c) => c.getAttribute('href') === `/app/plans/${doneId}`)!;
    expect(done).toHaveTextContent('Lead with minimalist graphic tees for 18–30 online shoppers in Lagos');
    expect(done).toHaveTextContent('5 insights · 3 partnerships · 2 campaigns · 2 experiments');
    expect(done).toHaveTextContent('MOCK');
    const running = cards.find((c) => c.getAttribute('href') === `/app/plans/${runningId}/progress`)!;
    expect(running).toHaveTextContent('Researching your brief…');
    expect(screen.getByText('2 plans')).toBeInTheDocument();
  });

  it('filters by status and pages through results', async () => {
    const profile = seedProfile();
    for (let i = 0; i < 13; i += 1) seedPlan(profile.id, (id) => [completed(id)]);
    seedPlan(profile.id, (id) => [statusAt(id, 1)]);
    const { user, router } = renderRoute('/app/plans');

    expect(await screen.findByText('Page 1 of 2')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Next/ }));
    expect(await screen.findByText('Page 2 of 2')).toBeInTheDocument();
    expect(router.state.location.search).toBe('?page=2');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by status' }), 'Running');
    expect(await screen.findByText('1 plan')).toBeInTheDocument();
    expect(router.state.location.search).toBe('?status=Running');
  });

  it('suggests generating when there are briefs but no plans', async () => {
    seedProfile();
    renderRoute('/app/plans');
    expect(await screen.findByRole('heading', { name: 'No plans yet' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Generate your first plan' })).toBeInTheDocument();
  });
});

describe('offline copies', () => {
  it('saves a plan for offline reading from the plan page and marks it in the list', async () => {
    const profile = seedProfile();
    const id = seedPlan(profile.id, (planId) => [completed(planId)]);
    const { user } = renderRoute(`/app/plans/${id}`);

    const toggle = await screen.findByRole('switch', { name: 'Available offline' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    await user.click(toggle);
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'true'));
    expect(await screen.findByText('Saved on this device for offline reading')).toBeInTheDocument();

    const copies = await listOfflineCopies(testUser.id);
    expect(copies.map((c) => c.plan.id)).toEqual([id]);
    // Copies are plan data only — no tokens.
    expect(JSON.stringify(copies)).not.toContain('access-');
  });

  it('opens a saved plan offline with a clear "offline copy" label, and explains when none is saved', async () => {
    await saveOfflineCopy(testUser.id, samplePlan({ id: 'offline-plan', isSample: false }));
    const { router } = renderRoute('/app/plans');
    await screen.findByRole('heading', { level: 1, name: 'Plans' });
    setOnline(false);

    await router.navigate('/app/plans/offline-plan');
    expect(await screen.findByText(/Offline copy · saved/)).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 1, name: 'Eko Thread Co.' })).toBeInTheDocument();

    await router.navigate('/app/plans/not-saved');
    expect(await screen.findByRole('heading', { name: 'You’re offline' })).toBeInTheDocument();
  });

  it('lists only this device’s offline copies while offline', async () => {
    seedProfile();
    await saveOfflineCopy(testUser.id, samplePlan({ id: 'offline-plan', isSample: false }));
    renderRoute('/app/plans');
    await screen.findByRole('heading', { level: 1, name: 'Plans' });
    setOnline(false);

    const section = (await screen.findByRole('heading', { name: 'Saved on this device' })).closest('section')!;
    const card = within(section).getByRole('link', { name: /Eko Thread Co\./ });
    expect(card).toHaveAttribute('href', '/app/plans/offline-plan');
    expect(card).toHaveTextContent(/Offline copy · saved/);
  });

  it('"Remove offline copies" deletes this user’s copies', async () => {
    seedProfile();
    await saveOfflineCopy(testUser.id, samplePlan({ id: 'offline-plan', isSample: false }));
    const { user } = renderRoute('/app/plans');
    await screen.findByRole('heading', { level: 1, name: 'Plans' });

    await user.click(screen.getAllByRole('button', { name: /account menu|^account$/i })[0]!);
    await user.click(await screen.findByRole('menuitem', { name: 'Remove offline copies' }));
    expect(await screen.findByText('Offline copies removed from this device')).toBeInTheDocument();
    expect(await databases()).not.toContain(offlineDbName(testUser.id));
  });

  it('never shows the previous user’s copies after a user switch', async () => {
    await saveOfflineCopy(testUser.id, samplePlan({ id: 'ada-plan', isSample: false }));
    renderRoute('/app/plans');
    await screen.findByRole('heading', { level: 1, name: 'Plans' });

    // Another tab signs in as someone else; this tab adopts that session from the shared refresh cookie.
    const tunde = { ...testUser, id: 'b2f0c1d2-0000-4000-8000-00000000b0b0', email: 'tunde@example.com' };
    authState.refreshUser = tunde;
    const otherTab = new BroadcastChannel('kc-auth');
    otherTab.postMessage({ type: 'login', userId: tunde.id });
    otherTab.close();

    await waitFor(() => expect(tokenStore.get()?.user.id).toBe(tunde.id));
    await waitFor(async () => expect(await databases()).not.toContain(offlineDbName(testUser.id)));
    expect(await listOfflineCopies(tunde.id)).toEqual([]);

    setOnline(false);
    expect(await screen.findByText('No plans are saved on this device yet.')).toBeInTheDocument();
  });
});
