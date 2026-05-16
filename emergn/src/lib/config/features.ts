import { createTokenLaunchCanaryList, isTokenLaunchAllowed } from "@/lib/tokens/launch";
import type { SystemCapabilities } from "@/types";

interface CapabilityContext {
  walletAddress?: string | null;
}

export const V1_PAYMENTS_DISABLED_REASON =
  "Credits are included with your account during launch.";

function isConfigured(value: string | undefined | null) {
  if (!value) return false;

  const normalized = value.trim();
  if (!normalized) return false;

  return (
    !normalized.startsWith("PASTE_") &&
    !normalized.startsWith("YOUR_") &&
    !normalized.includes("example") &&
    !normalized.includes("changeme")
  );
}

export function getSystemCapabilities(
  context: CapabilityContext = {}
): SystemCapabilities {
  const anthropicReady = isConfigured(process.env.ANTHROPIC_API_KEY);
  const twitterReady = isConfigured(process.env.TWITTERAPI_IO_KEY);
  const heliusReady = isConfigured(process.env.HELIUS_API_KEY);
  const higgsfieldReady = isConfigured(process.env.HIGGSFIELD_API_KEY);
  const launchProvidersReady =
    isConfigured(process.env.PUMPPORTAL_API_KEY) &&
    isConfigured(process.env.PINATA_JWT);
  const allowlist = createTokenLaunchCanaryList();

  return {
    anthropic: anthropicReady
      ? { enabled: true, reason: null }
      : {
          enabled: false,
          reason: "This feature is temporarily unavailable.",
        },
    x_import: anthropicReady && twitterReady
      ? { enabled: true, reason: null }
      : {
          enabled: false,
          reason: "X voice import is temporarily unavailable.",
        },
    portfolio_analysis: anthropicReady && heliusReady
      ? { enabled: true, reason: null }
      : {
          enabled: false,
          reason: "Portfolio analysis is temporarily unavailable.",
        },
    agent_passport: context.walletAddress
      ? { enabled: true, reason: null }
      : {
          enabled: false,
          reason: "Link a Solana wallet to issue an Agent Passport.",
        },
    passport_image: higgsfieldReady
      ? { enabled: true, reason: null }
      : {
          enabled: false,
          reason: "Passport image rendering is temporarily unavailable.",
        },
    payments: {
      enabled: false,
      reason: V1_PAYMENTS_DISABLED_REASON,
    },
    token_launch: launchProvidersReady
      ? context.walletAddress
        ? isTokenLaunchAllowed(context.walletAddress)
          ? { enabled: true, reason: null }
          : {
              enabled: false,
              reason: "Token launch is in limited preview.",
            }
        : allowlist.open
          ? { enabled: true, reason: null }
          : {
              enabled: false,
              reason: "Link a wallet to access token launch.",
            }
      : {
          enabled: false,
          reason: "Token launch is in limited preview.",
        },
  };
}
