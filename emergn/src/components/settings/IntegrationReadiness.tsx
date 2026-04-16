import type { SystemCapabilities } from "@/types";

interface IntegrationReadinessProps {
  capabilities: SystemCapabilities;
}

const CAPABILITY_LABELS: Record<keyof SystemCapabilities, string> = {
  anthropic: "Anthropic",
  x_import: "X Import",
  portfolio_analysis: "Portfolio",
  payments: "Payments",
  token_launch: "Token Launch",
};

export function IntegrationReadiness({
  capabilities,
}: IntegrationReadinessProps) {
  return (
    <div className="border border-ghost-gray/20 bg-ghost-gray/5 p-6">
      <h2 className="mb-4 font-headline text-sm font-bold uppercase tracking-[0.15em] text-neural-white">
        Integration Readiness
      </h2>

      <div className="space-y-3">
        {Object.entries(capabilities).map(([key, capability]) => (
          <div
            key={key}
            className="border border-ghost-gray/10 bg-void-black p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-xs uppercase tracking-[0.1em] text-neural-white/60">
                {CAPABILITY_LABELS[key as keyof SystemCapabilities]}
              </p>
              <span
                className={`font-mono text-[10px] uppercase tracking-[0.12em] ${
                  capability.enabled ? "text-pulse-cyan" : "text-ember-orange"
                }`}
              >
                {capability.enabled ? "Ready" : "Unavailable"}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-neural-white/45">
              {capability.enabled
                ? "Configured and ready to use."
                : capability.reason}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
