import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Logo } from '@/shared/ui/Logo';
import { Textile } from '@/shared/ui/Textile';

/** Split layout on desktop, single column on mobile (Magic Patterns sign-in / create account). */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid min-h-dvh bg-bg lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-[#14122B] p-12 text-[#F4F1EA] lg:flex lg:flex-col lg:justify-between">
        <Textile className="text-[#F4F1EA] opacity-[0.07]" />
        <Link to="/" className="relative self-start rounded-md" aria-label="Kulture Compass home">
          <Logo tone="onDark" />
        </Link>
        <div className="relative max-w-md">
          <p className="font-heading text-[38px] leading-tight font-semibold tracking-tight">
            Cultural research for clothing brands.
          </p>
          <p className="mt-4 leading-relaxed text-[#B9B5D6]">
            Every recommendation in your plan links back to the data it came from.
          </p>
        </div>
        <p className="relative text-xs text-[#B9B5D6]">Powered by Qloo cultural intelligence</p>
      </aside>

      <main id="main" className="flex flex-col items-center justify-center px-4 py-12 md:px-8">
        <Link to="/" className="mb-10 self-center rounded-md lg:hidden" aria-label="Kulture Compass home">
          <Logo />
        </Link>
        <div className="w-full max-w-sm">
          <h1 className="text-[30px] tracking-tight text-ink">{title}</h1>
          <p className="mt-1.5 text-sm text-ink-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-8 flex flex-col items-center gap-3 text-sm text-ink-muted">{footer}</div>
        </div>
      </main>
    </div>
  );
}
