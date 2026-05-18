"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** Set while the parent's confirm action is in flight so we show a spinner. */
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

/**
 * Brand-aligned confirmation modal for destructive or expensive actions
 * (agent delete, account unlink, token launch final submit).
 *
 * - Escape closes; ENTER confirms (when focus is on the confirm button or the
 *   surface).
 * - Click outside the panel closes via the backdrop button (true overlay
 *   button so keyboard-only users can also dismiss).
 * - Focuses the confirm button on open and traps focus inside the panel.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    // Focus the first button inside the panel on open so keyboard users can
    // ENTER to confirm or TAB out to cancel. The Button primitive owns its
    // own internal ref for magnetic hover, so we focus via DOM query instead
    // of a forwarded ref.
    const firstButton = panelRef.current?.querySelector<HTMLButtonElement>(
      "button:not([disabled])",
    );
    firstButton?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel, loading]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="confirm-dialog"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[110] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          <button
            type="button"
            aria-label="Dismiss dialog"
            disabled={loading}
            onClick={onCancel}
            className="absolute inset-0 bg-void-black/80 backdrop-blur-sm focus:outline-none disabled:cursor-not-allowed"
          />
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 8, scale: 0.98, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 4, scale: 0.98, filter: "blur(4px)" }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "relative w-full max-w-md border bg-void-black px-6 py-6 font-body text-neural-white shadow-[0_0_60px_rgba(0,240,255,0.08)]",
              destructive ? "border-ember-orange/60" : "border-pulse-cyan/40",
            )}
          >
            <h2
              id="confirm-dialog-title"
              className="font-headline text-base uppercase tracking-wider"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-3 text-sm leading-relaxed text-neural-white/70">
                {description}
              </p>
            ) : null}
            <div className="mt-6 flex items-center justify-end gap-2">
              <Button
                variant={destructive ? "danger" : "primary"}
                onClick={() => void onConfirm()}
                loading={loading}
              >
                {confirmLabel}
              </Button>
              <Button
                variant="ghost"
                onClick={onCancel}
                disabled={loading}
              >
                {cancelLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
