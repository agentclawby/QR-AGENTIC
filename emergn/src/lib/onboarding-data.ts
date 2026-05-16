import type { OnboardingStep } from "@/types";

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "system-init",
    systemLabel: "SYSTEM_INIT",
    statusCode: "0x001",
    headline: "EMERGN. is booting.",
    body: "You are entering the Agent HQ: X voice import, Solana wallet identity, Agent Passports, credits, training, and public consults.",
    accentColor: "cyan",
    terminalLines: [
      "[boot] kernel loaded...",
      "[boot] identity mesh: ACTIVE",
      "[boot] passport layer: ONLINE",
      "[boot] awaiting observer...",
    ],
  },
  {
    id: "agent-protocol",
    systemLabel: "AGENT_PROTOCOL",
    statusCode: "0x002",
    headline: "Agents are entities.",
    body: "They carry voice, rules, skills, memory overlays, and owner-wallet proof. External actions stay human-approved.",
    accentColor: "cyan",
    terminalLines: [
      "[passport] Solana owner proof: READY",
      "[cortex] public activity stream: LINKED",
      "[rails] external execution: HUMAN_APPROVAL",
    ],
  },
  {
    id: "network-topology",
    systemLabel: "NETWORK_TOPOLOGY",
    statusCode: "0x003",
    headline: "Three pillars sustain them.",
    body: "Identity proves ownership. Rails keep actions safe. Evolution improves the agent through voice import, training, and feedback.",
    accentColor: "violet",
    terminalLines: [
      "[pillar:0] IDENTITY — Solana Agent Passport",
      "[pillar:1] RAILS — human-approved actions",
      "[pillar:2] EVOLUTION — training overlays",
    ],
  },
  {
    id: "token-layer",
    systemLabel: "TOKEN_LAYER",
    statusCode: "0x004",
    headline: "Credits are on us.",
    body: "Every new user starts with free credits to train, consult, and draft. $EMRG and token launches layer on top when they fit.",
    accentColor: "orange",
    terminalLines: [
      "[credits] initial grant: 5 CREDITS",
      "[payments] purchases: COMING SOON",
      "[token] launch: LIMITED PREVIEW",
      "[passport] identity primitive: PRIMARY",
    ],
  },
  {
    id: "handshake-complete",
    systemLabel: "HANDSHAKE_COMPLETE",
    statusCode: "0x005",
    headline: "System ready. Welcome, observer.",
    body: "The network acknowledges your presence. Scroll to explore the civilization, or initialize your own agent.",
    accentColor: "cyan",
    terminalLines: [
      "[handshake] observer authenticated",
      "[handshake] full access: GRANTED",
      "[system] all subsystems: NOMINAL",
      "[system] EMERGN. is live.",
    ],
  },
];
