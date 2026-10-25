import { Database, Plus, X } from 'lucide-react';
import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/Button';
import { controlClasses } from '@/shared/ui/field-classes';
import { MAX_REFERENCES, REFERENCE_KINDS, type ReferenceKindHint } from './profile-options';
import type { ProfileFormInput, ProfileFormValues } from './profileSchema';

/** Up to 8 `{ name, kindHint }` references (US-C2). Names are matched in Qloo later — unmatched ones are listed, never guessed. */
export function ReferenceEntitiesField() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ProfileFormInput, unknown, ProfileFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: 'referenceEntities' });

  const [name, setName] = useState('');
  const [kind, setKind] = useState<ReferenceKindHint>('Brand');
  const [addError, setAddError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const nameInput = useRef<HTMLInputElement>(null);
  const ids = useId();
  const full = fields.length >= MAX_REFERENCES;

  const add = () => {
    const trimmed = name.trim();
    if (!trimmed) return setAddError('Type a name first');
    if (trimmed.length > 100) return setAddError('Use 100 characters or fewer');
    if (fields.some((f) => f.name.toLowerCase() === trimmed.toLowerCase())) {
      return setAddError(`“${trimmed}” is already in your list`);
    }
    append({ name: trimmed, kindHint: kind });
    setAnnouncement(`Added ${trimmed}. ${fields.length + 1} of ${MAX_REFERENCES}.`);
    setName('');
    setAddError(null);
    nameInput.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      add();
    }
  };

  const listError = errors.referenceEntities?.message ?? errors.referenceEntities?.root?.message;

  return (
    <div className="flex flex-col gap-4">
      <p id={`${ids}-help`} className="text-sm font-medium text-ink">
        Brands, creators, places or shows your customers love
      </p>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-1.5 sm:w-44">
          <label htmlFor={`${ids}-kind`} className="text-xs text-ink-muted">
            Type
          </label>
          <select
            id={`${ids}-kind`}
            value={kind}
            onChange={(e) => setKind(e.target.value as ReferenceKindHint)}
            disabled={full}
            className={cn(controlClasses, 'h-10')}
          >
            {REFERENCE_KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor={`${ids}-name`} className="text-xs text-ink-muted">
            Name
          </label>
          <input
            id={`${ids}-name`}
            ref={nameInput}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={full}
            placeholder="Type a name and press Enter"
            aria-describedby={`${ids}-help ${ids}-note${addError ? ` ${ids}-error` : ''}`}
            aria-invalid={addError ? true : undefined}
            className={cn(controlClasses, 'h-10')}
          />
        </div>
        <Button variant="secondary" onClick={add} disabled={full}>
          <Plus aria-hidden className="size-4" />
          Add
        </Button>
      </div>
      {addError && (
        <p id={`${ids}-error`} className="text-xs text-danger">
          {addError}
        </p>
      )}
      {listError && <p className="text-xs text-danger">{listError}</p>}

      {fields.length > 0 && (
        <ul aria-label="Your cultural references" className="flex flex-wrap gap-2">
          {fields.map((field, index) => {
            const itemError = errors.referenceEntities?.[index]?.name?.message;
            return (
              <li
                key={field.id}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border bg-surface py-1 pr-1.5 pl-3 text-sm text-ink',
                  itemError ? 'border-danger' : 'border-border',
                )}
                title={itemError}
              >
                {field.name}
                <select
                  aria-label={`Type for ${field.name}`}
                  className="h-6 rounded-full border-0 bg-surface-muted px-2 text-xs font-medium text-ink-muted"
                  {...register(`referenceEntities.${index}.kindHint`)}
                >
                  {REFERENCE_KINDS.map((k) => (
                    <option key={k.value} value={k.value}>
                      {k.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    remove(index);
                    setAnnouncement(`Removed ${field.name}.`);
                  }}
                  className="rounded-full p-1 text-ink-muted hover:bg-surface-muted hover:text-ink"
                  aria-label={`Remove ${field.name}`}
                >
                  <X aria-hidden className="size-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-xs text-ink-muted">
        {fields.length} of {MAX_REFERENCES} added
        {full && ' — that’s the maximum.'}
      </p>

      <p
        id={`${ids}-note`}
        className="flex items-start gap-2 rounded-(--radius-input) bg-evidence-bg px-4 py-3 text-sm leading-relaxed text-evidence"
      >
        <Database aria-hidden className="mt-0.5 size-4 shrink-0" />
        We&apos;ll look these up in Qloo — anything we can&apos;t match is listed, not guessed.
      </p>
      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}
