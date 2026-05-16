import type {
  Agent,
  Profile,
  SystemCapabilities,
  UserCreditBalance,
} from "@/types";

// Per-action credit cost. Single-pool model: every action costs N credits
// from balance.action_credits. Adjust here if pricing shifts.
export const ACTION_COST = {
  train: 1,
  consult: 1,
  content: 1,
  x_retrain: 2,
} as const;

// Centralizes the seven *DisabledReason blocks. Single source of truth keeps
// the UI tabs and any future pages from drifting on which conditions block
// which feature.
export interface AgentGates {
  think: { enabled: boolean; reason: string | null };
  consult: { enabled: boolean; reason: string | null };
  content: { enabled: boolean; reason: string | null };
  portfolio: { enabled: boolean; reason: string | null };
  passport: { enabled: boolean; reason: string | null };
  training: { enabled: boolean; reason: string | null };
  xRetrain: { enabled: boolean; reason: string | null };
  tokenLaunch: { enabled: boolean; reason: string | null };
}

interface ComputeAgentGatesArgs {
  agent: Agent;
  capabilities: SystemCapabilities;
  viewerProfile: Profile | null;
  viewerCredits: UserCreditBalance | null;
  isOwner: boolean;
}

function gate(reason: string | null) {
  return { enabled: reason === null, reason };
}

function suspensionReason(profile: Profile | null): string | null {
  if (!profile) return null;
  const suspended = (profile as Profile & { suspended_at?: string | null })
    .suspended_at;
  if (!suspended) return null;
  return "Your account is paused. Reach out to support to restore access.";
}

function insufficientCreditsReason(
  credits: UserCreditBalance | null,
  cost: number,
): string | null {
  const available = credits?.action_credits ?? 0;
  if (available < cost) {
    return `Need ${cost} credit${cost === 1 ? "" : "s"}; you have ${available}.`;
  }
  return null;
}

export function computeAgentGates({
  capabilities,
  viewerProfile,
  viewerCredits,
  isOwner,
}: ComputeAgentGatesArgs): AgentGates {
  const suspended = suspensionReason(viewerProfile);
  const anthropicReason = capabilities.anthropic.enabled
    ? null
    : capabilities.anthropic.reason;

  const portfolioReason =
    suspended ??
    (!capabilities.portfolio_analysis.enabled
      ? capabilities.portfolio_analysis.reason
      : !viewerProfile?.wallet_address
        ? "Link a wallet in Settings before running a portfolio review."
        : null);

  const passportReason =
    suspended ??
    (!capabilities.agent_passport.enabled
      ? capabilities.agent_passport.reason
      : !isOwner
        ? "Only the owner can issue this Agent Passport."
        : null);

  const trainingReason =
    suspended ??
    anthropicReason ??
    (!isOwner
      ? "Only the agent owner can train this agent."
      : insufficientCreditsReason(viewerCredits, ACTION_COST.train));

  const xRetrainReason =
    suspended ??
    (!capabilities.x_import.enabled
      ? capabilities.x_import.reason
      : !isOwner
        ? "Only the agent owner can retrain on X."
        : !viewerProfile?.x_handle
          ? "Link your X account in Settings before retraining."
          : insufficientCreditsReason(viewerCredits, ACTION_COST.x_retrain));

  const consultReason =
    suspended ??
    anthropicReason ??
    insufficientCreditsReason(viewerCredits, ACTION_COST.consult);

  const contentReason =
    suspended ??
    anthropicReason ??
    (!isOwner
      ? "Owner-only content drafting."
      : insufficientCreditsReason(viewerCredits, ACTION_COST.content));

  const tokenLaunchReason =
    suspended ??
    (!capabilities.token_launch.enabled
      ? capabilities.token_launch.reason
      : !isOwner
        ? "Only the agent owner can launch a token."
        : !viewerProfile?.wallet_address
          ? "Link your owner wallet in Settings before launching a token."
          : null);

  return {
    think: gate(suspended ?? anthropicReason),
    consult: gate(consultReason),
    content: gate(contentReason),
    portfolio: gate(portfolioReason),
    passport: gate(passportReason),
    training: gate(trainingReason),
    xRetrain: gate(xRetrainReason),
    tokenLaunch: gate(tokenLaunchReason),
  };
}

export type ConsultAccessMode =
  | "owner"
  | "token_holder"
  | "credit"
  | "blocked";

interface ConsultAccessArgs {
  isOwner: boolean;
  tokenHolder: boolean;
  credits: UserCreditBalance | null;
}

// What does the *next* consultation cost? Used by the ConsultAgent CTA to
// show an honest cost preview before the click.
export function describeConsultAccess({
  isOwner,
  tokenHolder,
  credits,
}: ConsultAccessArgs): {
  mode: ConsultAccessMode;
  label: string;
  cost: string;
} {
  if (isOwner) return { mode: "owner", label: "Owner", cost: "Free" };
  if (tokenHolder)
    return { mode: "token_holder", label: "Token holder", cost: "Free" };

  const available = credits?.action_credits ?? 0;
  if (available >= ACTION_COST.consult) {
    return {
      mode: "credit",
      label: "Costs 1 credit",
      cost: `${available} credit${available === 1 ? "" : "s"} left`,
    };
  }

  return {
    mode: "blocked",
    label: "Out of credits",
    cost: "Earn or wait for grant",
  };
}
