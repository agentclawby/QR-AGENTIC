"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[/app] runtime error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-ember-orange">
        Signal lost
      </p>
      <h1 className="mb-3 font-headline text-2xl font-bold uppercase tracking-[0.1em] text-neural-white">
        We&apos;re rebooting the grid.
      </h1>
      <p className="mb-8 max-w-md font-mono text-xs text-neural-white/50">
        The network hit an unexpected state. Your registry is intact. Retry,
        or fall back to the network.
      </p>

      {process.env.NODE_ENV !== "production" && (
        <pre className="mb-6 max-w-xl overflow-x-auto border border-ghost-gray/30 bg-ghost-gray/10 p-3 text-left font-mono text-[10px] text-neural-white/60">
          {error.message}
          {error.digest ? `\n\ndigest: ${error.digest}` : ""}
        </pre>
      )}

      <div className="flex gap-3">
        <Button variant="primary" size="md" onClick={reset}>
          Retry
        </Button>
        <Button variant="ghost" size="md" href="/app">
          Back to the network
        </Button>
      </div>
    </div>
  );
}
