import { Check } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export type StepState = 'pending' | 'active' | 'done' | 'failed' | 'skipped';

export interface ProgressStep {
  id: string;
  label: string;
  state: StepState;
  /** Backend-produced detail only (e.g. "4 of 9 Qloo requests complete") — never invented. */
  detail?: string | null;
}

const STATE_TEXT: Record<StepState, string> = {
  pending: 'Not started',
  active: 'In progress',
  done: 'Done',
  failed: 'Failed',
  skipped: 'Skipped',
};

/** Vertical stepper for research progress (component sheet §8, design 3g/3h). */
export function ProgressSteps({ steps, label }: { steps: ProgressStep[]; label: string }) {
  return (
    <ol aria-label={label} className="flex flex-col">
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        return (
          <li key={step.id} className="flex gap-3.5" aria-current={step.state === 'active' ? 'step' : undefined}>
            <div className="flex flex-col items-center">
              <Marker state={step.state} />
              {!last && (
                <span
                  aria-hidden
                  className={cn('min-h-3 w-0.5 flex-1', step.state === 'done' ? 'bg-strong' : 'bg-border')}
                />
              )}
            </div>
            <div className={cn('pb-3.5', last && 'pb-0')}>
              <p
                className={cn(
                  'text-sm font-semibold',
                  step.state === 'pending' || step.state === 'skipped' ? 'text-ink-muted' : 'text-ink',
                  step.state === 'failed' && 'text-danger',
                )}
              >
                {step.label}
                <span className="sr-only"> — {STATE_TEXT[step.state]}</span>
              </p>
              {(step.detail || step.state === 'done') && (
                <p className="text-xs text-ink-muted">{step.detail ?? 'Done'}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Marker({ state }: { state: StepState }) {
  const base = 'grid size-[22px] shrink-0 place-items-center rounded-full text-[11px] font-bold';
  if (state === 'done') {
    return (
      <span aria-hidden className={cn(base, 'bg-strong text-white')}>
        <Check className="size-3.5" strokeWidth={3} />
      </span>
    );
  }
  if (state === 'failed') {
    return (
      <span aria-hidden className={cn(base, 'bg-danger text-white')}>
        !
      </span>
    );
  }
  if (state === 'active') {
    return (
      <span aria-hidden className={cn(base, 'border-4 border-primary-soft bg-primary motion-safe:animate-pulse')} />
    );
  }
  return <span aria-hidden className={cn(base, 'border-2 border-border-strong bg-surface')} />;
}
