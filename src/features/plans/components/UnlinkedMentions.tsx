import { ShieldQuestion } from 'lucide-react';
import { useId } from 'react';
import type { UnlinkedMention } from '@/features/evidence/types';

/** "AI suggestions not found in Qloo" — listed for transparency, never used as evidence (FE-01 §6). */
export function UnlinkedMentions({ mentions }: { mentions: UnlinkedMention[] }) {
  const headingId = useId();
  if (mentions.length === 0) return null;
  return (
    <div role="group" aria-labelledby={headingId} className="rounded-(--radius-card) bg-surface-muted p-6">
      <h3 id={headingId} className="flex items-center gap-2 font-sans text-sm font-medium text-ink">
        <ShieldQuestion aria-hidden className="size-4 text-ink-muted" />
        AI suggestions not found in Qloo
      </h3>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
        Our AI suggested these names, but we couldn&apos;t match them to any retrieved data. They aren&apos;t used in
        your plan and haven&apos;t been verified — check them yourself before reaching out.
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {mentions.map((mention) => (
          <li
            key={mention.name}
            title={mention.note}
            className="rounded-full border border-dashed border-ink-muted px-3 py-1 text-sm text-ink-muted"
          >
            {mention.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
