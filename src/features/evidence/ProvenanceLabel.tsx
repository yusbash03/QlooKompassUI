import { Database, Sparkles } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

type Provenance = 'evidence' | 'ai';

const META = {
  evidence: {
    text: 'Retrieved from Qloo',
    icon: Database,
    pill: 'bg-evidence-bg text-evidence',
    plain: 'text-evidence',
  },
  ai: { text: 'AI-generated', icon: Sparkles, pill: 'bg-ai-bg text-ai', plain: 'text-ai' },
} as const;

/**
 * The two provenance classes (FE-01 §6): teal + database icon for data retrieved from Qloo, violet + sparkle icon for
 * AI interpretation. Always icon + text — never colour alone.
 */
export function ProvenanceLabel({
  kind,
  variant = 'plain',
  className,
}: {
  kind: Provenance;
  /** `plain` = coloured text (panel headers); `pill` = filled chip. */
  variant?: 'pill' | 'plain';
  className?: string;
}) {
  const meta = META[kind];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap',
        variant === 'pill' ? cn('rounded-full px-2.5 py-1', meta.pill) : meta.plain,
        className,
      )}
    >
      <Icon aria-hidden className="size-3.5" />
      {meta.text}
    </span>
  );
}
