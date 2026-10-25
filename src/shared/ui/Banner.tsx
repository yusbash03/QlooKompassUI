import { CircleAlert, Info, TriangleAlert, WifiOff } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

// Every tone pairs colour with an icon or text so meaning never relies on colour alone.
const tones = {
  info: 'border border-border bg-surface text-ink',
  /** "Sample plan · synthetic data" */
  sample: 'border border-dashed border-border-dashed bg-surface-muted text-ink',
  /** Striped ink strip, amber mono text — unmistakably not real data. */
  mock: 'bg-[repeating-linear-gradient(135deg,#14122B_0_10px,#22203d_10px_20px)] font-mono text-xs font-medium tracking-wide text-[#FBBF24]',
  offline: 'bg-[#14122B] text-[#F4F1EA]',
  limitations: 'bg-warning-bg text-ink',
  /** "Some fields need attention…", plan failure reason. */
  danger: 'border border-danger bg-surface text-danger',
} as const;

export type BannerTone = keyof typeof tones;

interface BannerProps {
  tone?: BannerTone;
  /** Bold lead-in, e.g. "Limitations". */
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  /** Danger banners announce assertively; everything else politely. */
  role?: 'alert' | 'status';
  /** Full-bleed strip (no radius/side borders), for app-level banners. */
  strip?: boolean;
  className?: string;
}

function ToneIcon({ tone }: { tone: BannerTone }) {
  const cls = 'mt-0.5 size-4 shrink-0';
  if (tone === 'offline') return <WifiOff aria-hidden className={cls} />;
  if (tone === 'danger') return <CircleAlert aria-hidden className={cls} />;
  if (tone === 'limitations') return <TriangleAlert aria-hidden className={cn(cls, 'text-moderate')} />;
  if (tone === 'info') return <Info aria-hidden className={cn(cls, 'text-ink-muted')} />;
  return null;
}

export function Banner({ tone = 'info', title, children, action, role, strip = false, className }: BannerProps) {
  return (
    <div
      role={role ?? (tone === 'danger' ? 'alert' : 'status')}
      className={cn(
        'flex items-start gap-3 px-4 py-3 text-sm leading-relaxed',
        strip ? 'rounded-none border-x-0 border-t-0 py-2.5' : 'rounded-(--radius-input)',
        tones[tone],
        className,
      )}
    >
      <ToneIcon tone={tone} />
      <div className="min-w-0 flex-1">
        {title && <strong className="mr-1.5 font-medium">{title}</strong>}
        {children}
      </div>
      {action && <div className="-my-1 shrink-0">{action}</div>}
    </div>
  );
}
