import { cn } from '@/shared/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn('block animate-pulse rounded-md bg-surface-muted', className)} />;
}

/** Card-shaped placeholder while a report card or plan card loads. */
export function SkeletonCard({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="flex flex-col gap-2.5 rounded-(--radius-card) border border-border bg-surface p-5">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-3 w-2/5" />
      <Skeleton className="h-[18px] w-4/5" />
      <Skeleton className="h-2.5 w-full" />
      <Skeleton className="h-2.5 w-3/4" />
    </div>
  );
}
