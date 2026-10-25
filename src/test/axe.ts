import axe from 'axe-core';

/**
 * Runs axe-core on a rendered subtree and fails with a readable list of violations.
 * Colour contrast needs real layout and painting, which jsdom lacks — that rule runs in the Playwright pass instead.
 */
export async function expectNoAxeViolations(container: Element = document.body): Promise<void> {
  const results = await axe.run(container, {
    rules: {
      'color-contrast': { enabled: false },
      // Landmark rules are page-level; component snippets rendered in isolation aren't pages.
      region: { enabled: false },
    },
  });
  const violations = results.violations.map(
    (v) => `${v.id} (${v.impact ?? 'n/a'}): ${v.help}\n    ${v.nodes.map((n) => n.target.join(' ')).join('\n    ')}`,
  );
  expect(violations).toEqual([]);
}
