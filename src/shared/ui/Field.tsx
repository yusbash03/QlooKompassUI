import { ChevronDown } from 'lucide-react';
import { useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { controlClasses, errorClasses, hintClasses, labelClasses } from './field-classes';

interface FieldChromeProps {
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  className?: string;
}

/** Label → hint → control → counter/error, matching the Magic Patterns brief form. */
function FieldChrome({
  label,
  hint,
  error,
  optional,
  className,
  id,
  footer,
  children,
}: FieldChromeProps & {
  id?: string;
  footer?: ReactNode;
  children: (ids: { id: string; describedBy: string | undefined }) => ReactNode;
}) {
  const generated = useId();
  const controlId = id ?? generated;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col', className)}>
      <label htmlFor={controlId} className={labelClasses}>
        {label}
        {optional && <span className="font-normal text-ink-muted"> (optional)</span>}
      </label>
      {hint && (
        <div id={hintId} className={cn(hintClasses, 'mt-0.5')}>
          {hint}
        </div>
      )}
      <div className="mt-1.5">{children({ id: controlId, describedBy })}</div>
      {(error || footer) && (
        <div className="mt-1.5 flex items-start justify-between gap-3">
          {error ? (
            <p id={errorId} className={errorClasses}>
              {error}
            </p>
          ) : (
            <span />
          )}
          {footer}
        </div>
      )}
    </div>
  );
}

interface TextareaFieldProps extends Omit<ComponentProps<'textarea'>, 'className'>, FieldChromeProps {
  /** Current length, for the "n / max" counter (pass from useWatch). */
  count?: number;
}

export function TextareaField({
  label,
  hint,
  error,
  optional,
  className,
  id,
  count,
  maxLength,
  ...rest
}: TextareaFieldProps) {
  const counter =
    maxLength !== undefined && count !== undefined ? (
      <span className={cn('shrink-0 text-xs', count > maxLength ? 'text-danger' : 'text-ink-muted')}>
        {count} / {maxLength}
      </span>
    ) : undefined;

  return (
    <FieldChrome
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      className={className}
      id={id}
      footer={counter}
    >
      {({ id: controlId, describedBy }) => (
        <textarea
          id={controlId}
          rows={3}
          className={cn(controlClasses, 'min-h-20 py-2.5 leading-relaxed')}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
      )}
    </FieldChrome>
  );
}

interface SelectFieldProps extends Omit<ComponentProps<'select'>, 'className'>, FieldChromeProps {
  options: readonly { value: string; label: string }[];
  placeholder?: string;
  /** Narrow selects (category) don't need the full row. */
  controlClassName?: string;
}

export function SelectField({
  label,
  hint,
  error,
  optional,
  className,
  controlClassName,
  id,
  options,
  placeholder,
  ...rest
}: SelectFieldProps) {
  return (
    <FieldChrome label={label} hint={hint} error={error} optional={optional} className={className} id={id}>
      {({ id: controlId, describedBy }) => (
        <div className={cn('relative', controlClassName)}>
          <select
            id={controlId}
            className={cn(controlClasses, 'h-10 appearance-none pr-9')}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            {...rest}
          >
            {placeholder !== undefined && <option value="">{placeholder}</option>}
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-muted"
          />
        </div>
      )}
    </FieldChrome>
  );
}
