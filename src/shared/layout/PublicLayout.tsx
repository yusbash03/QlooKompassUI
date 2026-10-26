import { Database } from 'lucide-react';
import { Link, Outlet } from 'react-router';
import { useAuth } from '@/features/auth/auth-context';
import { buttonClasses } from '@/shared/ui/button-classes';
import { Logo } from '@/shared/ui/Logo';
import { MockModeBanner } from './MockModeBanner';
import { OfflineBanner } from './OfflineBanner';

const sectionLinks = [
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#evidence', label: 'Evidence' },
  { href: '/#who', label: "Who it's for" },
];

const linkClasses = 'rounded-sm text-sm text-ink-muted transition-colors duration-150 hover:text-ink';

/** Public header + footer from the Magic Patterns landing (Design/magic-patterns). */
export function PublicLayout() {
  const { status } = useAuth();

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <OfflineBanner />
      <MockModeBanner />
      <header className="sticky top-0 z-30 border-b border-border bg-bg">
        <div className="mx-auto flex h-16 max-w-(--container-page) items-center justify-between gap-4 px-4 md:px-8">
          <Link to="/" className="rounded-md" aria-label="Kulture Compass home">
            <Logo />
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
            {sectionLinks.map((link) => (
              <a key={link.href} href={link.href} className={linkClasses}>
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {status === 'authenticated' ? (
              <Link to="/app/plans" className={buttonClasses({ size: 'md' })}>
                Open app
              </Link>
            ) : (
              <>
                <Link
                  to="/sign-in"
                  className="hidden rounded-(--radius-input) px-3 py-2 text-sm font-medium text-ink hover:bg-surface-muted sm:inline-flex"
                >
                  Sign in
                </Link>
                <Link to="/sign-up" className={buttonClasses()}>
                  Get started free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-surface-muted">
        <div className="mx-auto grid max-w-(--container-page) gap-10 px-4 py-14 md:grid-cols-[2fr_1fr_1fr] md:px-8">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-muted">
              Cultural research and growth plans for clothing brands.
            </p>
          </div>
          <FooterNav
            title="Product"
            links={[
              { href: '/#how-it-works', label: 'How it works' },
              { to: '/sample', label: 'See a sample plan' },
              { href: '/#install', label: 'Install the app' },
            ]}
          />
          <FooterNav
            title="Account"
            links={[
              { to: '/sign-in', label: 'Sign in' },
              { to: '/sign-up', label: 'Create account' },
            ]}
          />
        </div>
        <div className="border-t border-border">
          <div className="mx-auto flex max-w-(--container-page) flex-col justify-between gap-3 px-4 py-6 text-xs text-ink-muted sm:flex-row sm:items-center md:px-8">
            <p>© {new Date().getFullYear()} Kulture Compass</p>
            <p className="inline-flex items-center gap-1.5">
              <Database aria-hidden className="size-3.5 text-evidence" />
              Powered by Qloo cultural intelligence
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

type FooterLink = { label: string } & ({ to: string; href?: never } | { href: string; to?: never });

function FooterNav({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <nav aria-label={title}>
      <h2 className="font-sans text-sm font-medium text-ink">{title}</h2>
      <ul className="mt-3 space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            {link.to ? (
              <Link to={link.to} className={linkClasses}>
                {link.label}
              </Link>
            ) : (
              <a href={link.href} className={linkClasses}>
                {link.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
