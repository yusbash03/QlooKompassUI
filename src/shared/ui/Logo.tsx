import { cn } from '@/shared/lib/cn';

type LogoTone = 'auto' | 'onDark';

/**
 * Compass mark whose amber north needle forms a stylised "K" (design brief §2; artwork from the Magic Patterns landing).
 * `auto` follows the theme tokens; `onDark` is for always-dark surfaces (sidebar, auth panel). Decorative — the wordmark
 * or the surrounding link carries the accessible name.
 */
export function LogoMark({ className, tone = 'auto' }: { className?: string; tone?: LogoTone }) {
  const disc = tone === 'onDark' ? 'fill-inverse-ink' : 'fill-ink';
  const line = tone === 'onDark' ? 'stroke-inverse' : 'stroke-bg';
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('size-8 shrink-0', className)}>
      <circle cx="16" cy="16" r="16" className={disc} />
      <circle cx="16" cy="16" r="11.5" fill="none" className={line} strokeOpacity="0.25" strokeWidth="1" />
      <path d="M12 8.5v15" className={line} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M13.2 16.4l6.3 7" className={line} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M12.6 16.6L22.6 6.4l-4.1 10.2z" className="fill-accent" />
    </svg>
  );
}

export function Logo({
  className,
  compact = false,
  tone = 'auto',
}: {
  className?: string;
  compact?: boolean;
  tone?: LogoTone;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark tone={tone} />
      <span
        className={cn(
          'font-heading text-[17px] font-semibold tracking-tight',
          tone === 'onDark' ? 'text-inverse-ink' : 'text-ink',
          compact && 'sr-only',
        )}
      >
        Kulture Compass
      </span>
    </span>
  );
}
