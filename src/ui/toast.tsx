'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export interface ToastMessage {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  durationMs?: number;
}

interface ToastContextValue {
  toast: (msg: Omit<ToastMessage, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback((msg: Omit<ToastMessage, 'id'>) => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { ...msg, id }]);
  }, []);

  // Auto-dismiss
  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) =>
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), t.durationMs ?? 4000),
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 9999,
          maxWidth: 360,
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            style={{
              background: t.variant === 'destructive' ? '#7f1d1d' : '#111',
              color: '#fff',
              padding: '10px 14px',
              borderRadius: 'var(--caspian-radius, 6px)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              pointerEvents: 'auto',
            }}
          >
            {t.title && <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{t.title}</p>}
            {t.description && (
              <p style={{ margin: '2px 0 0', fontSize: 13, opacity: 0.85 }}>{t.description}</p>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Graceful fallback: log to console if provider not mounted.
    return {
      toast: (msg: Omit<ToastMessage, 'id'>) =>
        console.log(`[caspian-toast] ${msg.title ?? ''}${msg.description ? ' — ' + msg.description : ''}`),
    };
  }
  return ctx;
}
