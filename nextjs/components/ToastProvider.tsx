"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import type { ToastTone } from "@/types/banking";

type ToastItem = {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
};

type ToastContextValue = {
  showToast: (toast: Omit<ToastItem, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const toneStyles: Record<ToastTone, string> = {
  success: "border-[var(--color-success)]/25 bg-[var(--color-panel-strong)] text-[var(--color-text)]",
  error: "border-[var(--color-danger)]/25 bg-[var(--color-panel-strong)] text-[var(--color-text)]",
  info: "border-[var(--color-primary)]/25 bg-[var(--color-panel-strong)] text-[var(--color-text)]",
};

const toneAccent: Record<ToastTone, string> = {
  success: "bg-[var(--color-success)]",
  error: "bg-[var(--color-danger)]",
  info: "bg-[var(--color-primary)]",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  function showToast(toast: Omit<ToastItem, "id">) {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [...current, { id, ...toast }]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4200);
  }

  const value = useMemo(() => ({ showToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-3xl border px-4 py-4 shadow-[var(--shadow-soft)] transition ${toneStyles[toast.tone]}`}
          >
            <div className="flex items-start gap-3">
              <span className={`mt-1 inline-flex h-2.5 w-2.5 rounded-full ${toneAccent[toast.tone]}`} />
              <div className="space-y-1">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description ? (
                  <p className="text-sm text-[var(--color-text-muted)]">{toast.description}</p>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }

  return context;
}