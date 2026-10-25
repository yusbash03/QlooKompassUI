import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { CompassIllustration, Textile } from './Textile';

interface EmptyStateProps {
  title: string;
  /** Defaults to the compass illustration from the design. */
  icon?: LucideIcon;
  children?: ReactNode;
  action?: ReactNode;
  headingLevel?: 'h2' | 'h3';
}

export function EmptyState({ icon: Icon, title, children, action, headingLevel: Heading = 'h2' }: EmptyStateProps) {
  return (
    <div className="relative flex flex-col items-center gap-4 overflow-hidden rounded-(--radius-card) border border-border bg-surface px-6 py-14 text-center">
      <Textile />
      {Icon ? (
        <Icon aria-hidden className="relative size-10 text-ink-muted" />
      ) : (
        <CompassIllustration className="relative" />
      )}
      <Heading className="relative text-2xl text-ink">{title}</Heading>
      {children && <div className="relative max-w-md text-[15px] leading-relaxed text-ink-muted">{children}</div>}
      {action && <div className="relative mt-1">{action}</div>}
    </div>
  );
}
