import { cn } from '@/shared/lib/cn';
import { Tooltip } from '@/shared/ui/Tooltip';
import { QUALITY_TOOLTIP, type EvidenceQuality } from './types';

const STYLES: Record<EvidenceQuality, string> = {
  Strong: 'border-strong text-strong',
  Moderate: 'border-moderate text-moderate',
  Weak: 'border-weak text-weak',
};

/**
 * Outlined evidence-strength pill ("Strong evidence"). Deterministic quality from backend rules — never a confidence %.
 * Focusable so keyboard users get the explanatory tooltip too.
 */
export function QualityPill({
  quality,
  short = false,
  className,
}: {
  quality: EvidenceQuality;
  /** "Strong" instead of "Strong evidence" (tight table cells). */
  short?: boolean;
  className?: string;
}) {
  return (
    <Tooltip content={QUALITY_TOOLTIP}>
      <button
        type="button"
        aria-label={`${quality} evidence. ${QUALITY_TOOLTIP}`}
        className={cn(
          'inline-flex shrink-0 cursor-help items-center gap-1.5 rounded-full border bg-surface px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
          STYLES[quality],
          className,
        )}
      >
        <span aria-hidden className="size-1.5 rounded-full bg-current" />
        {short ? quality : `${quality} evidence`}
      </button>
    </Tooltip>
  );
}
