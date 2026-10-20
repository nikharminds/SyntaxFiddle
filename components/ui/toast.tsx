"use client";

import * as React from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info";

export type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastItem = {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
};

const TOAST_ICONS: Record<ToastVariant, React.ComponentType<{ size?: number; className?: string }>> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const TOAST_ICON_STYLES: Record<ToastVariant, string> = {
  success: "text-emerald-400",
  error: "text-red-400",
  info: "text-sky-400",
};

const ToastContext = React.createContext<(toast: ToastInput) => void>(() => undefined);

export function useToast() {
  return React.useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const timers = React.useRef<Set<number>>(new Set());

  const dismiss = React.useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    timers.current.delete(id);
  }, []);

  const toast = React.useCallback(
    (input: ToastInput) => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current.slice(-2), { id, variant: "success", ...input }]);
      const timer = window.setTimeout(() => dismiss(id), 3000);
      timers.current.add(timer);
    },
    [dismiss]
  );

  React.useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => window.clearTimeout(timer));
      pending.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        role="status"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-xs flex-col gap-2"
      >
        {toasts.map((item) => {
          const Icon = TOAST_ICONS[item.variant];
          return (
            <div
              key={item.id}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3 shadow-lg shadow-black/40",
                "animate-toast-in"
              )}
            >
              <Icon size={16} className={cn("mt-0.5 shrink-0", TOAST_ICON_STYLES[item.variant])} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-100">{item.title}</p>
                {item.description ? (
                  <p className="mt-0.5 break-all font-mono text-xs text-zinc-400">
                    {item.description}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
