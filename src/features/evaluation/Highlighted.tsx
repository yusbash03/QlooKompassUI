import type { ReactNode } from 'react';

function escape(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Marks every occurrence of `names` in `text` — used for names not found in retrieved data. */
export function Highlighted({ text, names }: { text: string; names: readonly string[] }): ReactNode {
  if (names.length === 0) return text;
  const pattern = new RegExp(
    `(${[...names]
      .sort((a, b) => b.length - a.length)
      .map(escape)
      .join('|')})`,
    'gi',
  );
  return text.split(pattern).map((part, index) =>
    index % 2 === 1 ? (
      <mark
        key={index}
        className="rounded-sm bg-warning-bg px-0.5 text-ink underline decoration-moderate decoration-dotted underline-offset-2"
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}
