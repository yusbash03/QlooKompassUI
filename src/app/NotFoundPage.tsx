import { Link } from 'react-router';
import { buttonClasses } from '@/shared/ui/button-classes';
import { CompassIllustration, Textile } from '@/shared/ui/Textile';

export function NotFoundPage() {
  return (
    <main
      id="main"
      className="relative flex min-h-[70dvh] flex-col items-center justify-center gap-4 overflow-hidden px-4 text-center"
    >
      <Textile />
      <CompassIllustration rotate={-110} className="relative" />
      <p className="relative font-mono text-sm text-primary">404</p>
      <h1 className="relative text-[28px] text-ink">Page not found</h1>
      <p className="relative max-w-md text-ink-muted">
        This page is off the map — it doesn&apos;t exist, or it belongs to another account.
      </p>
      <Link to="/" className={`relative ${buttonClasses()}`}>
        Back to home
      </Link>
    </main>
  );
}
