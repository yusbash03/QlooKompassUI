import { useId } from 'react';
import { cn } from '@/shared/lib/cn';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  /** Visually hide the label (it stays the accessible name). */
  hideLabel?: boolean;
  className?: string;
}

/** On/off switch (`role="switch"`), e.g. "Make available offline", "Include partnership ideas". */
export function Switch({ checked, onCheckedChange, label, disabled, hideLabel, className }: SwitchProps) {
  const id = useId();
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          'relative h-6 w-[42px] shrink-0 rounded-full transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60',
          checked ? 'bg-primary' : 'bg-border-strong',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'absolute top-[3px] size-[18px] rounded-full bg-white shadow-sm transition-[left] duration-150',
            checked ? 'left-[21px]' : 'left-[3px]',
          )}
        />
      </button>
      <label htmlFor={id} className={cn('text-[13px] font-medium text-ink', hideLabel && 'sr-only')}>
        {label}
      </label>
    </span>
  );
}
