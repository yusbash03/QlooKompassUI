import { screen } from '@testing-library/react';
import { expectNoAxeViolations } from '@/test/axe';
import { renderRoute } from '@/test/renderRoute';

describe('/dev/ui component gallery', () => {
  it('renders every section in both themes and passes axe', { timeout: 30_000 }, async () => {
    renderRoute('/dev/ui');
    // The gallery is the largest lazy chunk; under a parallel full run its first transform can take several seconds.
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Component gallery' }, { timeout: 12_000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'light theme' })).toHaveAttribute('data-theme', 'light');
    expect(screen.getByRole('region', { name: 'dark theme' })).toHaveAttribute('data-theme', 'dark');
    expect(
      screen.getAllByRole('heading', { name: 'Your customers’ tastes overlap with minimalist streetwear brands' }),
    ).toHaveLength(2);

    const error = vi.spyOn(console, 'error').mockImplementation(() => {}); // the deliberate missing-key chip logs
    await expectNoAxeViolations(document.body);
    error.mockRestore();
  });
});
