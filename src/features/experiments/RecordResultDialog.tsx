import { useId, useState, type FormEvent } from 'react';
import type { Experiment } from '@/features/evidence/types';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/Button';
import { Dialog, DialogClose } from '@/shared/ui/Dialog';
import { TextareaField } from '@/shared/ui/Field';
import { TextField } from '@/shared/ui/TextField';
import type { MatchedRule } from './outcome-store';

export interface RecordedResult {
  status: 'Concluded' | 'Abandoned';
  observedResult: string | null;
  resultNotes: string | null;
  matched: MatchedRule | null;
}

interface RecordResultDialogProps {
  experiment: Experiment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (result: RecordedResult) => void;
  saving: boolean;
}

/** "Record result" (Magic Patterns): outcome, observed result, did it meet the threshold, notes. */
export function RecordResultDialog({ experiment, open, onOpenChange, onSave, saving }: RecordResultDialogProps) {
  const ids = useId();
  const [status, setStatus] = useState<RecordedResult['status']>('Concluded');
  const [observed, setObserved] = useState('');
  const [met, setMet] = useState<'yes' | 'no' | ''>('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ observed?: string; met?: string }>({});
  const concluded = status === 'Concluded';

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (concluded && !observed.trim()) next.observed = 'Enter what you measured, e.g. +26% vs previous 14 days.';
    if (concluded && !met) next.met = 'Choose whether it met the threshold.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSave({
      status,
      observedResult: concluded ? observed.trim() : observed.trim() || null,
      resultNotes: notes.trim() || null,
      matched: concluded ? (met === 'yes' ? 'success' : 'failure') : null,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Record result"
      description={
        <>
          Threshold: <span className="text-ink">{experiment.successThreshold}</span>
        </>
      }
      actions={
        <>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button type="submit" form={`${ids}-form`} loading={saving}>
            Save result
          </Button>
        </>
      }
    >
      <form id={`${ids}-form`} onSubmit={submit} noValidate className="flex flex-col gap-5">
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink">Outcome</legend>
          <div className="grid grid-cols-2 gap-2">
            {(['Concluded', 'Abandoned'] as const).map((value) => (
              <label
                key={value}
                className={cn(
                  'flex cursor-pointer items-center gap-2.5 rounded-(--radius-input) border px-3 py-2.5 text-sm',
                  'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus',
                  status === value ? 'border-primary text-ink' : 'border-border text-ink-muted',
                )}
              >
                <input
                  type="radio"
                  name={`${ids}-status`}
                  value={value}
                  checked={status === value}
                  onChange={() => setStatus(value)}
                  className="accent-[var(--primary)]"
                />
                {value}
              </label>
            ))}
          </div>
        </fieldset>

        <TextField
          label="Observed result"
          optional={!concluded}
          placeholder="e.g. +26% vs previous 14 days"
          value={observed}
          onChange={(e) => setObserved(e.target.value)}
          error={errors.observed}
          maxLength={200}
        />

        {concluded && (
          <fieldset aria-describedby={errors.met ? `${ids}-met-error` : undefined}>
            <legend className={cn('mb-2 text-sm font-medium', errors.met ? 'text-danger' : 'text-ink')}>
              Did it meet the threshold?
            </legend>
            <div className="flex gap-2">
              {(['yes', 'no'] as const).map((value) => (
                <label
                  key={value}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-(--radius-input) border px-3 py-2 text-sm',
                    'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus',
                    met === value ? 'border-primary text-ink' : 'border-border text-ink-muted',
                  )}
                >
                  <input
                    type="radio"
                    name={`${ids}-met`}
                    value={value}
                    checked={met === value}
                    onChange={() => setMet(value)}
                    className="accent-[var(--primary)]"
                  />
                  {value === 'yes' ? 'Yes' : 'No'}
                </label>
              ))}
            </div>
            {errors.met && (
              <p id={`${ids}-met-error`} className="mt-1.5 text-xs text-danger">
                {errors.met}
              </p>
            )}
          </fieldset>
        )}

        <TextareaField
          label="Notes"
          optional
          placeholder="Anything that might have affected the result"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
          count={notes.length}
        />
      </form>
    </Dialog>
  );
}
