'use client';

import { createContext, useCallback, useContext, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; type: ToastType; message: string; }

const ToastCtx = createContext<{ toast: (message: string, type?: ToastType) => void }>({ toast: () => {} });

export function useToast() { return useContext(ToastCtx); }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 200, display: 'grid', gap: 10, maxWidth: 360 }} aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`alert alert-${t.type === 'error' ? 'error' : t.type === 'success' ? 'success' : 'info'}`} style={{ margin: 0, boxShadow: 'var(--shadow-lg)' }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
