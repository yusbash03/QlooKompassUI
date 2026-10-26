/**
 * Scroll a report card into view and move focus to it (cards carry tabIndex={-1}), so "Used in" links and
 * "Open experiment" land keyboard and screen-reader users on the target too. Respects reduced motion.
 */
export function revealElement(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? true;
  el.scrollIntoView?.({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
  el.focus({ preventScroll: true });
}
