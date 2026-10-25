import { screen, waitFor } from '@testing-library/react';
import { authState } from '@/test/msw/handlers/auth';
import { editProfileElsewhere, profilesState, seedProfile } from '@/test/msw/handlers/profiles';
import { renderRoute } from '@/test/renderRoute';

beforeEach(() => {
  authState.refreshValid = true;
});

async function saveFromReview(user: ReturnType<typeof renderRoute>['user']) {
  await user.click(screen.getByRole('button', { name: /Review/ }));
  await user.click(await screen.findByRole('button', { name: 'Save brief' }));
}

describe('edit brief', () => {
  it('loads the saved brief into the form', async () => {
    const profile = seedProfile();
    renderRoute(`/app/profiles/${profile.id}/edit`);

    expect(await screen.findByLabelText('Brand name')).toHaveValue('Eko Thread Co.');
    expect(screen.getByLabelText('Category')).toHaveValue('Streetwear');
  });

  it('saves with If-Match and stays on the page', async () => {
    const profile = seedProfile();
    const { user, router } = renderRoute(`/app/profiles/${profile.id}/edit`);
    const brand = await screen.findByLabelText('Brand name');
    await user.clear(brand);
    await user.type(brand, 'Eko Thread & Co.');
    await saveFromReview(user);

    expect(await screen.findByText('Changes saved.')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/app/profiles/${profile.id}/edit`);
    expect(profilesState.requests[0]).toMatchObject({
      method: 'PUT',
      ifMatch: '"1"',
      body: { brandName: 'Eko Thread & Co.', referenceEntities: [{ name: 'Sample Brand B', kindHint: 'Brand' }] },
    });

    // The next save uses the new ETag from the PUT response.
    await saveFromReview(user);
    await waitFor(() => expect(profilesState.requests[1]?.ifMatch).toBe('"2"'));
  });

  it('on 412 asks to reload, then shows the latest version', async () => {
    const profile = seedProfile();
    const { user } = renderRoute(`/app/profiles/${profile.id}/edit`);
    await screen.findByLabelText('Brand name');
    editProfileElsewhere(profile.id, { brandName: 'Renamed In Another Tab' });

    await saveFromReview(user);

    const dialog = await screen.findByRole('dialog', { name: 'This brief changed elsewhere — reload?' });
    expect(dialog).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reload latest' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await screen.findByLabelText('Brand name')).toHaveValue('Renamed In Another Tab');

    await saveFromReview(user);
    expect(await screen.findByText('Changes saved.')).toBeInTheDocument();
    expect(profilesState.requests.at(-1)?.ifMatch).toBe('"2"');
  });

  it('"Keep editing" closes the conflict dialog without losing edits', async () => {
    const profile = seedProfile();
    const { user } = renderRoute(`/app/profiles/${profile.id}/edit`);
    const brand = await screen.findByLabelText('Brand name');
    await user.type(brand, ' (draft)');
    editProfileElsewhere(profile.id, { brandName: 'Other' });

    await saveFromReview(user);
    await user.click(await screen.findByRole('button', { name: 'Keep editing' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Edit Brand' }));
    expect(screen.getByLabelText('Brand name')).toHaveValue('Eko Thread Co. (draft)');
  });

  it('shows "not found" for a missing or foreign brief', async () => {
    renderRoute('/app/profiles/00000000-0000-4000-8000-999999999999/edit');
    expect(await screen.findByRole('heading', { name: 'Brief not found' })).toBeInTheDocument();
  });
});
