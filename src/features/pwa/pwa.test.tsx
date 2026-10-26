import { act, screen, waitFor, within } from '@testing-library/react';
import { authState } from '@/test/msw/handlers/auth';
import { completed, seedPlan } from '@/test/msw/handlers/growthPlans';
import { seedProfile } from '@/test/msw/handlers/profiles';
import { pwaStub } from '@/test/pwa-register-stub';
import { renderRoute } from '@/test/renderRoute';
import { setOnline } from '@/test/online';
import { listenForInstallPrompt } from './install-store';

function offerInstall(outcome: 'accepted' | 'dismissed' = 'accepted') {
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt: vi.fn(() => Promise.resolve()),
    userChoice: Promise.resolve({ outcome }),
  });
  act(() => {
    window.dispatchEvent(event);
  });
  return event;
}

beforeAll(listenForInstallPrompt);

describe('update prompt', () => {
  it('offers a reload when a new version is waiting', async () => {
    pwaStub.needRefresh = true;
    const { user } = renderRoute('/');
    await screen.findByText('A new version of Kulture Compass is available.');
    await user.click(screen.getByRole('button', { name: 'Reload' }));
    expect(pwaStub.updateServiceWorker).toHaveBeenCalledWith(true);
  });
});

describe('install prompt', () => {
  it('waits until a plan has been viewed, then installs', async () => {
    const { user } = renderRoute('/');
    await screen.findByRole('heading', { level: 1 });
    const event = offerInstall();
    expect(screen.queryByRole('complementary', { name: 'Install Kulture Compass' })).not.toBeInTheDocument();

    await user.click(screen.getAllByRole('link', { name: /sample plan/i })[0]!);
    const card = await screen.findByRole('complementary', { name: 'Install Kulture Compass' });
    await user.click(within(card).getByRole('button', { name: 'Install' }));
    expect(event.prompt).toHaveBeenCalled();
    await waitFor(() => expect(card).not.toBeInTheDocument());
  });

  it('stays hidden for 14 days after "Not now"', async () => {
    const { user } = renderRoute('/sample');
    await screen.findByRole('heading', { level: 1 });
    offerInstall();
    await user.click(await screen.findByRole('button', { name: 'Not now' }));
    expect(screen.queryByRole('complementary', { name: 'Install Kulture Compass' })).not.toBeInTheDocument();
    expect(Number(localStorage.getItem('kc-install-dismissed-at'))).toBeGreaterThan(0);
  });

  it('is offered from the account menu', async () => {
    authState.refreshValid = true;
    const profile = seedProfile();
    seedPlan(profile.id, (id) => [completed(id)]);
    const { user } = renderRoute('/app/plans');
    await screen.findByRole('heading', { level: 1, name: /plans/i });
    const event = offerInstall();
    await user.click(screen.getAllByRole('button', { name: /account/i })[0]!);
    await user.click(await screen.findByRole('menuitem', { name: 'Install app' }));
    expect(event.prompt).toHaveBeenCalled();
  });
});

describe('offline page', () => {
  afterEach(() => setOnline(true));

  it('points to what still works offline', async () => {
    setOnline(false);
    renderRoute('/offline');
    expect(await screen.findByRole('heading', { name: 'You’re offline' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open saved plans' })).toHaveAttribute('href', '/app/plans');
    expect(screen.getByRole('link', { name: 'View the sample plan' })).toHaveAttribute('href', '/sample');
  });

  it('says so when the connection is back', async () => {
    setOnline(true);
    renderRoute('/offline');
    expect(await screen.findByRole('heading', { name: 'You’re back online', level: 1 })).toBeInTheDocument();
  });
});
