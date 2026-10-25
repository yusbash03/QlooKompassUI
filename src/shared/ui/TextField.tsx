import { Eye, EyeOff } from 'lucide-react';
import { useId, useState, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { controlClasses, errorClasses, hintClasses, labelClasses } from './field-classes';

interface TextFieldProps extends ComponentProps<'input'> {
  label: ReactNode;
  hint?: ReactNode;
  /** Rendered below the control (e.g. the live password checklist). */
  below?: ReactNode;
  error?: string;
  /** Rendered inside the input row, after the input (e.g. a show/hide toggle). */
  trailing?: ReactNode;
  optional?: boolean;
}

export function TextField({ label, hint, below, error, trailing, optional, id, className, ...rest }: TextFieldProps) {
  const generated = useId();
  const inputId = id ?? generated;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const belowId = below ? `${inputId}-below` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={cn('flex flex-col', className)}>
      <label htmlFor={inputId} className={labelClasses}>
        {label}
        {optional && <span className="font-normal text-ink-muted"> (optional)</span>}
      </label>
      {hint && (
        <div id={hintId} className={cn(hintClasses, 'mt-0.5')}>
          {hint}
        </div>
      )}
      <div className="relative mt-1.5">
        <input
          id={inputId}
          className={cn(controlClasses, 'h-10', trailing && 'pr-11')}
          aria-invalid={error ? true : undefined}
          aria-describedby={[hintId, belowId, errorId].filter(Boolean).join(' ') || undefined}
          {...rest}
        />
        {trailing && <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>}
      </div>
      {below && (
        <div id={belowId} className="mt-2">
          {below}
        </div>
      )}
      {error && (
        <p id={errorId} className={cn(errorClasses, 'mt-1.5')}>
          {error}
        </p>
      )}
    </div>
  );
}

export function PasswordField(props: Omit<TextFieldProps, 'type' | 'trailing'>) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="rounded-md p-2 text-ink-muted hover:text-ink"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          {visible ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
        </button>
      }
    />
  );
}
