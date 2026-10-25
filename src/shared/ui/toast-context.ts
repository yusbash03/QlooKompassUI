import { createContext, useContext } from 'react';

export interface ToastOptions {
  message: string;
  action?: { label: string; onAction: () => void };
  /** ms; default 5000. Toasts with an action stay until dismissed or acted on. */
  duration?: number;
}

export const ToastContext = createContext<((toast: ToastOptions) => void) | null>(null);

export function useToast(): (toast: ToastOptions) => void {
  const show = useContext(ToastContext);
  if (!show) throw new Error('useToast must be used inside <ToastProvider>');
  return show;
}
