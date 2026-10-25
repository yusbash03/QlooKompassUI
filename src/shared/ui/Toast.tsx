import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { buttonClasses } from './button-classes';
import { ToastContext, type ToastOptions } from './toast-context';

interface ActiveToast extends ToastOptions {
  id: number;
}

let nextId = 1;

/** White card toast, bottom-right on desktop, bottom-centre on phones (Magic Patterns). Newest wins. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ActiveToast | null>(null);
  const show = useCallback((options: ToastOptions) => setToast({ ...options, id: nextId++ }), []);

  useEffect(() => {
    if (!toast || toast.action) return;
    const timer = window.setTimeout(() => setToast(null), toast.duration ?? 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex justify-center px-4 md:inset-x-auto md:right-6 md:bottom-6"
      >
        {toast && (
          <div
            key={toast.id}
            className="pointer-events-auto flex w-full max-w-sm items-center gap-4 rounded-(--radius-card) border border-border bg-surface px-4 py-3 text-sm font-medium text-ink shadow-[0_8px_24px_rgba(20,18,43,0.12)]"
          >
            <span className="flex-1">{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                className={buttonClasses({ variant: 'inverse', size: 'sm' })}
                onClick={() => {
                  toast.action?.onAction();
                  setToast(null);
                }}
              >
                {toast.action.label}
              </button>
            )}
            <button
              type="button"
              aria-label="Dismiss notification"
              className="-mr-1 rounded px-1 text-ink-muted hover:text-ink"
              onClick={() => setToast(null)}
            >
              ×
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
