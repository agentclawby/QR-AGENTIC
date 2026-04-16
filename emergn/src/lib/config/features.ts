import { createTokenLaunchCanaryList, isTokenLaunchAllowed } from "@/lib/tokens/launch";
import type { SystemCapabilities } from "@/types";

interface CapabilityContext {
  walletAddress?: string | null;
}

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
  const paymentsReady =
    isConfigured(process.env.EMRG_TOKEN_MINT) &&
    isConfigured(process.env.EMERGN_TREASURY_WALLET) &&
    Number.isFinite(Number(process.env.EMRG_TOKEN_DECIMALS ?? "6"));
  const launchProvidersReady =
    isConfigured(process.env.PUMPPORTAL_API_KEY) &&
    isConfigured(process.env.PINATA_JWT);
  const allowlist = createTokenLaunchCanaryList();

  return {
    anthropic: anthropicReady
      ? { enabled: true, reason: null }
      : {
          enabled: false,
          reason: "Anthropic is not configured yet.",
        },
    x_import: anthropicReady && twitterReady
      ? { enabled: true, reason: null }
      : {
          enabled: false,
          reason: !twitterReady
            ? "X import is unavailable until TWITTERAPI_IO_KEY is configured."
            : "X import also needs Anthropic to build a voice overlay.",
        },
    portfolio_analysis: anthropicReady && heliusReady
      ? { enabled: true, reason: null }
      : {
          enabled: false,
          reason: !heliusReady
            ? "Portfolio analysis is unavailable until HELIUS_API_KEY is configured."
            : "Portfolio analysis also needs Anthropic for the written review.",
        },
    payments: paymentsReady
      ? { enabled: true, reason: null }
      : {
          enabled: false,
          reason:
            "Credit purchases are unavailable until EMRG mint, treasury wallet, and token decimals are configured.",
        },
    token_launch: launchProvidersReady
      ? context.walletAddress
        ? isTokenLaunchAllowed(context.walletAddress)
          ? { enabled: true, reason: null }
          : {
              enabled: false,
              reason:
                "Token launch is still in canary mode for allowlisted wallets only.",
            }
        : allowlist.open
          ? { enabled: true, reason: null }
          : {
              enabled: false,
              reason:
                "Link a wallet to see whether this account is in the launch canary.",
            }
      : {
          enabled: false,
          reason:
            "Token launch is unavailable until PumpPortal and Pinata are configured.",
        },
  };
}
