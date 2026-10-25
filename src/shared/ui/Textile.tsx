import { useId } from 'react';
import { cn } from '@/shared/lib/cn';

/** Adire-inspired line grid at 6 % (design brief §2 motif). Landing hero, auth panel and empty states only. */
export function Textile({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 size-full text-ink opacity-[0.06]', className)}
    >
      <defs>
        <pattern id={id} width="56" height="56" patternUnits="userSpaceOnUse">
          <path d="M0 28h56M28 0v56" stroke="currentColor" strokeWidth="1" />
          <path d="M28 10l18 18-18 18-18-18z" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="28" cy="28" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
          <path d="M4 4l8 8M52 4l-8 8M4 52l8-8M52 52l-8-8" stroke="currentColor" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/** Large compass rose with the amber/ink needle, used on empty states and the 404. */
export function CompassIllustration({ rotate = 35, className }: { rotate?: number; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('relative grid size-28 place-items-center rounded-full border-2 border-ink', className)}
    >
      <div className="absolute inset-3.5 rounded-full border border-dashed border-border-dashed" />
      <div
        className="h-16 w-[18px] [background:linear-gradient(var(--accent)_50%,var(--ink)_50%)] [clip-path:polygon(50%_0,100%_50%,50%_100%,0_50%)]"
        style={{ transform: `rotate(${rotate}deg)` }}
      />
    </div>
  );
}
