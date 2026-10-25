import { screen, waitFor, within } from '@testing-library/react';
import { authState } from '@/test/msw/handlers/auth';
import { profilesState, SERVER_REJECTED_BRAND } from '@/test/msw/handlers/profiles';
import { renderRoute } from '@/test/renderRoute';

type User = ReturnType<typeof renderRoute>['user'];

beforeEach(() => {
  authState.refreshValid = true;
});

const stepHeading = (name: string) => screen.findByRole('heading', { level: 2, name: new RegExp(`^${name}`) });
const continueButton = () => screen.getByRole('button', { name: 'Continue' });

async function fillRequiredAndReachReview(user: User, brandName = 'Eko Thread Co.') {
  await user.type(await screen.findByLabelText('Brand name'), brandName);
  await user.selectOptions(screen.getByLabelText('Category'), 'Streetwear');
  await user.click(continueButton());

  await stepHeading('Products & market');
  await user.type(screen.getByLabelText('What you sell'), 'Graphic tees, hoodies and caps.');
  await user.click(continueButton());

  await stepHeading('Goal & budget');
  await user.click(screen.getByRole('radio', { name: /Sales/ }));
  await user.click(continueButton());

  await stepHeading('Cultural references');
  await user.click(continueButton());
  await stepHeading('Review');
}

describe('new brief form', () => {
  it('blocks step 1 until required fields are valid', async () => {
    const { user } = renderRoute('/app/profiles/new');
    await stepHeading('Brand');
    await user.click(continueButton());

    expect(await screen.findByText('Brand name needs at least 2 characters')).toBeInTheDocument();
    expect(screen.getByText('Choose a category')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Brand' })).toBeInTheDocument();

    // Fixing the fields after a failed attempt must clear the errors and let the user continue.
    await user.type(screen.getByLabelText('Brand name'), 'Eko Thread Co.');
    await user.selectOptions(screen.getByLabelText('Category'), 'Streetwear');
    // Errors clear as soon as the field is fixed — before any blur — so nothing shifts under the next click.
    await waitFor(() => expect(screen.queryByText('Choose a category')).not.toBeInTheDocument());
    expect(screen.queryByText('Brand name needs at least 2 characters')).not.toBeInTheDocument();
    await user.click(continueButton());
    expect(await stepHeading('Products & market')).toBeInTheDocument();
  });

  it('requires a category name when "Other" is chosen', async () => {
    const { user } = renderRoute('/app/profiles/new');
    await user.type(await screen.findByLabelText('Brand name'), 'Adire Lab');
    await user.selectOptions(screen.getByLabelText('Category'), 'Other');
    await user.click(continueButton());

    expect(await screen.findByText('Tell us your category')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Your category'), 'Textiles');
    await user.click(continueButton());
    expect(await stepHeading('Products & market')).toBeInTheDocument();
  });

  it('enforces the products minimum on step 2', async () => {
    const { user } = renderRoute('/app/profiles/new');
    await user.type(await screen.findByLabelText('Brand name'), 'Eko Thread Co.');
    await user.selectOptions(screen.getByLabelText('Category'), 'Streetwear');
    await user.click(continueButton());
    await user.type(await screen.findByLabelText('What you sell'), 'tees');
    await user.click(continueButton());

    expect(await screen.findByText('Describe what you sell in at least 10 characters')).toBeInTheDocument();
    expect(screen.getByText('4 / 1000')).toBeInTheDocument();
  });

  it('saves a partial brief with only the required fields, sending nulls for the rest', async () => {
    const { user, router } = renderRoute('/app/profiles/new');
    await fillRequiredAndReachReview(user);

    expect(screen.getAllByText('Not provided').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Save brief' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/app/plans'));
    expect(await screen.findByText('“Eko Thread Co.” brief saved.')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Eko Thread Co.' })).toBeInTheDocument();
    expect(profilesState.requests[0]?.body).toEqual({
      brandName: 'Eko Thread Co.',
      category: 'Streetwear',
      categoryOther: null,
      description: null,
      brandIdentity: null,
      productsDescription: 'Graphic tees, hoodies and caps.',
      targetMarket: null,
      primaryLocation: null,
      marketingObjective: 'Sales',
      objectiveNotes: null,
      budgetRange: null,
      referenceEntities: [],
    });
  });

  it('"Save & generate" goes to the generate screen for the new brief', async () => {
    const { user, router } = renderRoute('/app/profiles/new');
    await fillRequiredAndReachReview(user);
    await user.click(screen.getByRole('button', { name: 'Save & generate plan' }));

    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/app\/profiles\/[0-9a-f-]+\/generate$/));
  });

  it('maps server field errors back onto the right step', async () => {
    const { user } = renderRoute('/app/profiles/new');
    await fillRequiredAndReachReview(user, SERVER_REJECTED_BRAND);
    await user.click(screen.getByRole('button', { name: 'Save brief' }));

    expect(await stepHeading('Products & market')).toBeInTheDocument();
    expect(screen.getByText('Server says this is too vague.')).toBeInTheDocument();
    expect(screen.getByLabelText('What you sell')).toHaveAttribute('aria-invalid', 'true');
  });

  it('jumps back to step 1 with an error when the review step is reached via the stepper with missing data', async () => {
    const { user } = renderRoute('/app/profiles/new');
    await fillRequiredAndReachReview(user);
    await user.click(screen.getByRole('button', { name: 'Edit Brand' }));
    await user.clear(screen.getByLabelText('Brand name'));
    await user.click(screen.getByRole('button', { name: /Review/ }));
    await user.click(screen.getByRole('button', { name: 'Save brief' }));

    expect(await stepHeading('Brand')).toBeInTheDocument();
    expect(screen.getByText('Brand name needs at least 2 characters')).toBeInTheDocument();
    expect(profilesState.requests).toHaveLength(0);
  });

  it('collects up to 8 cultural references with kinds, rejecting duplicates', async () => {
    const { user } = renderRoute('/app/profiles/new');
    await user.type(await screen.findByLabelText('Brand name'), 'Eko Thread Co.');
    await user.selectOptions(screen.getByLabelText('Category'), 'Streetwear');
    await user.click(continueButton());
    await user.type(await screen.findByLabelText('What you sell'), 'Graphic tees and hoodies.');
    await user.click(continueButton());
    await user.click(await screen.findByRole('radio', { name: /Community/ }));
    await user.click(continueButton());
    await stepHeading('Cultural references');

    const name = screen.getByLabelText('Name');
    await user.type(name, 'Sample Brand B{Enter}');
    await user.selectOptions(screen.getByLabelText('Type'), 'Place');
    await user.type(name, 'Sample Store D{Enter}');
    await user.type(name, 'sample brand b{Enter}');
    expect(screen.getByText('“sample brand b” is already in your list')).toBeInTheDocument();

    for (let i = 3; i <= 8; i += 1) {
      await user.clear(name);
      await user.type(name, `Reference ${i}{Enter}`);
    }
    expect(screen.getByText(/8 of 8 added/)).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeDisabled();

    const list = screen.getByRole('list', { name: 'Your cultural references' });
    await user.click(within(list).getByRole('button', { name: 'Remove Reference 8' }));
    expect(screen.getByLabelText('Name')).toBeEnabled();

    await user.click(continueButton());
    await user.click(await screen.findByRole('button', { name: 'Save brief' }));
    await waitFor(() => expect(profilesState.requests).toHaveLength(1));
    const refs = profilesState.requests[0]?.body.referenceEntities ?? [];
    expect(refs).toHaveLength(7);
    expect(refs.slice(0, 2)).toEqual([
      { name: 'Sample Brand B', kindHint: 'Brand' },
      { name: 'Sample Store D', kindHint: 'Place' },
    ]);
  });

  it('keeps an unsaved draft in memory when leaving and coming back, until "Start over"', async () => {
    const { user } = renderRoute('/app/profiles/new');
    await user.type(await screen.findByLabelText('Brand name'), 'Half-finished');
    await user.click(screen.getAllByRole('link', { name: /Plans/ })[0]!);
    await screen.findByRole('heading', { level: 1, name: 'Plans' });

    await user.click(screen.getAllByRole('link', { name: /New/ })[0]!);
    expect(await screen.findByText('We kept your unsaved answers from earlier in this session.')).toBeInTheDocument();
    expect(screen.getByLabelText('Brand name')).toHaveValue('Half-finished');

    await user.click(screen.getByRole('button', { name: 'Start over' }));
    expect(screen.getByLabelText('Brand name')).toHaveValue('');
    expect(Object.keys(localStorage).concat(Object.keys(sessionStorage)).join()).not.toContain('Half-finished');
  });
});
