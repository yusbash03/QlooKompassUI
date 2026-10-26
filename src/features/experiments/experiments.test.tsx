import { screen, waitFor, within } from '@testing-library/react';
import { authState } from '@/test/msw/handlers/auth';
import { completed, editExperimentElsewhere, seedPlan } from '@/test/msw/handlers/growthPlans';
import { seedProfile } from '@/test/msw/handlers/profiles';
import { renderRoute } from '@/test/renderRoute';

beforeEach(() => {
  authState.refreshValid = true;
});

function seedCompletedPlan() {
  const profile = seedProfile();
  return seedPlan(profile.id, (id) => [completed(id)]);
}

const card = (hypothesis: RegExp) => screen.getByRole('article', { name: hypothesis });

describe('experiments on the plan', () => {
  it('starts an experiment, then records a concluded result and highlights the matching rule', async () => {
    const id = seedCompletedPlan();
    const { user } = renderRoute(`/app/plans/${id}?tab=experiments`);
    await screen.findByRole('heading', { level: 1, name: 'Eko Thread Co.' });

    const exp1 = card(/numbered minimalist drop/);
    await user.click(within(exp1).getByRole('button', { name: /Start experiment/ }));
    expect(await screen.findByText('EXP-01 started')).toBeInTheDocument();
    await waitFor(() => expect(within(card(/numbered minimalist drop/)).getByText(/days left/)).toBeInTheDocument());

    await user.click(within(card(/numbered minimalist drop/)).getByRole('button', { name: /Record result/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Record result' });
    // Concluded needs a result and a yes/no.
    await user.click(within(dialog).getByRole('button', { name: 'Save result' }));
    expect(within(dialog).getByText(/Enter what you measured/)).toBeInTheDocument();
    expect(within(dialog).getByText('Choose whether it met the threshold.')).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText(/Observed result/), '+26% vs previous 14 days');
    await user.click(within(dialog).getByRole('radio', { name: 'Yes' }));
    await user.click(within(dialog).getByRole('button', { name: 'Save result' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const concluded = card(/numbered minimalist drop/);
    expect(within(concluded).getByText('+26% vs previous 14 days')).toBeInTheDocument();
    expect(within(concluded).getByText('Matches your result')).toBeInTheDocument();
    expect(within(concluded).queryByRole('button', { name: /Start|Record/ })).not.toBeInTheDocument();
  });

  it('asks to reload when the experiment changed elsewhere (412)', async () => {
    const id = seedCompletedPlan();
    const { user } = renderRoute(`/app/plans/${id}?tab=experiments`);
    await screen.findByRole('heading', { level: 1, name: 'Eko Thread Co.' });
    editExperimentElsewhere(id, 'exp_1', { status: 'Running', startedAt: new Date().toISOString() });

    await user.click(within(card(/numbered minimalist drop/)).getByRole('button', { name: /Start experiment/ }));
    const dialog = await screen.findByRole('dialog', { name: 'This experiment changed elsewhere — reload?' });
    await user.click(within(dialog).getByRole('button', { name: 'Reload' }));

    await waitFor(() =>
      expect(
        within(card(/numbered minimalist drop/)).getByRole('button', { name: /Record result/ }),
      ).toBeInTheDocument(),
    );
  });
});

describe('experiments hub', () => {
  it('groups experiments by stage and moves a started one to Running', async () => {
    seedCompletedPlan();
    const { user } = renderRoute('/app/experiments');
    const proposed = (await screen.findByRole('heading', { name: 'Proposed' })).closest('section')!;
    expect(within(proposed).getAllByRole('article')).toHaveLength(2);

    const first = within(proposed).getAllByRole('article')[0]!;
    expect(within(first).getByRole('link', { name: /Open plan/ })).toHaveAttribute(
      'href',
      expect.stringContaining('?tab=experiments'),
    );
    await user.click(within(first).getByRole('button', { name: 'Start' }));

    const running = screen.getByRole('heading', { name: 'Running' }).closest('section')!;
    await waitFor(() => expect(within(running).getAllByRole('article')).toHaveLength(1));
    expect(within(running).getByText(/days remaining/)).toBeInTheDocument();
  });

  it('shows abandoned experiments under Concluded, labelled', async () => {
    const id = seedCompletedPlan();
    editExperimentElsewhere(id, 'exp_2', { status: 'Abandoned' });
    renderRoute('/app/experiments');
    const concludedCol = (await screen.findByRole('heading', { name: 'Concluded' })).closest('section')!;
    expect(within(concludedCol).getByText('Abandoned')).toBeInTheDocument();
  });

  it('explains how to get experiments when there are none', async () => {
    renderRoute('/app/experiments');
    expect(await screen.findByRole('heading', { name: 'No experiments yet' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to plans' })).toHaveAttribute('href', '/app/plans');
  });
});
