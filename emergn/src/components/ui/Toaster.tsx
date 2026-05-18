"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type ToastVariant = "info" | "success" | "warning" | "error";

interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
}

interface Toast extends Required<Omit<ToastInput, "description">> {
  id: string;
  description?: string;
}

interface ToastContextValue {
  push: (toast: ToastInput) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 4000;

const VARIANT_STYLES: Record<ToastVariant, string> = {
  info: "border-pulse-cyan/40 shadow-[0_0_24px_rgba(0,240,255,0.08)]",
  success: "border-pulse-cyan/60 shadow-[0_0_28px_rgba(0,240,255,0.12)]",
  warning: "border-ember-orange/60 shadow-[0_0_28px_rgba(255,107,53,0.14)]",
  error: "border-ember-orange/80 shadow-[0_0_28px_rgba(255,107,53,0.2)]",
};

const VARIANT_GLYPH: Record<ToastVariant, string> = {
  info: "◆",
  success: "◉",
  warning: "△",
  error: "✕",
};

const VARIANT_GLYPH_COLOR: Record<ToastVariant, string> = {
  info: "text-pulse-cyan",
  success: "text-pulse-cyan",
  warning: "text-ember-orange",
  error: "text-ember-orange",
};

/**
 * Tiny in-house toast system. We don't pull in `sonner` because framer-motion
 * is already in the bundle and the brand has specific styling rules
 * (no rounded corners, scanline-aligned border glow) that a generic library
 * would force us to override anyway.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (input: ToastInput) => {
      const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const toast: Toast = {
        id,
        title: input.title,
        description: input.description,
        variant: input.variant ?? "info",
        durationMs: input.durationMs ?? DEFAULT_DURATION,
      };
      setToasts((prev) => [...prev.slice(-4), toast]);

      const timer = setTimeout(() => dismiss(id), toast.durationMs);
      timersRef.current.set(id, timer);
      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const value = useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within <ToastProvider>");
  }
  return ctx;
}

function Toaster({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-6 right-6 z-[120] flex w-full max-w-[380px] flex-col gap-2"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: 40, filter: "blur(4px)" }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "pointer-events-auto border bg-void-black/95 backdrop-blur-sm px-4 py-3 font-mono text-sm text-neural-white",
              VARIANT_STYLES[toast.variant],
            )}
            role="status"
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={cn("mt-0.5 select-none", VARIANT_GLYPH_COLOR[toast.variant])}
              >
                {VARIANT_GLYPH[toast.variant]}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-headline text-[13px] uppercase tracking-wider">
                  {toast.title}
                </div>
                {toast.description ? (
                  <div className="mt-1 text-[12px] leading-snug text-neural-white/70">
                    {toast.description}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="ml-2 -mr-1 -mt-1 px-1 text-neural-white/40 transition-colors hover:text-neural-white focus-visible:text-neural-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-pulse-cyan"
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
