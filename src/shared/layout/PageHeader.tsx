import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

/** Page title block used across app screens (Magic Patterns: 28/36px heading, muted one-line description). */
export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <div className="mb-3">{eyebrow}</div>}
        <h1 className="text-[28px] tracking-tight text-ink md:text-[36px]">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}

/** Standard padded page container inside the app shell. `narrow` is the single-column form width. */
export function PageContainer({ children, narrow = false }: { children: ReactNode; narrow?: boolean }) {
  return (
    <div className={cn('mx-auto px-4 py-8 md:px-8 md:py-10', narrow ? 'max-w-[768px]' : 'max-w-(--container-page)')}>
      {children}
    </div>
  );
}
