import { LoaderCircle } from 'lucide-react';

export function FullPageStatus({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60dvh] items-center justify-center gap-3 text-ink-muted"
    >
      <LoaderCircle aria-hidden className="size-5 animate-spin" />
      <span>{label}</span>
    </div>
  );
}
