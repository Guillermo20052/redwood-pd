'use client';

import Link from 'next/link';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type ToastAction = { label: string; href: string };

type ToastItem = {
  id: string;
  message: string;
  duration: number;
  action?: ToastAction;
};

type ShowToastFn = (
  message: string,
  options?: { duration?: number; action?: ToastAction }
) => void;

const ToastContext = createContext<ShowToastFn | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback<ShowToastFn>((message, options) => {
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
    const duration = options?.duration ?? 4000;
    const item: ToastItem = {
      id,
      message,
      duration,
      action: options?.action,
    };
    setToasts((prev) => [...prev, item]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const value = useMemo(() => showToast, [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-relevant="additions">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast-item" role="status">
            <p className="toast-message">{toast.message}</p>
            {toast.action && (
              <Link href={toast.action.href} className="toast-action">
                {toast.action.label}
              </Link>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ShowToastFn {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
