import type {
  Feature,
  Tier,
  TokenUtility,
  RoadmapPhase,
  GrowthLoop,
  FAQItem,
  SentienceDimension,
  NavItem,
  StatItem,
} from "@/types";

// ─── Navigation ───────────────────────────────
export const NAV_ITEMS: NavItem[] = [
  { label: "About", href: "#civilization" },
  { label: "Pillars", href: "#pillars" },
  { label: "Features", href: "#features" },
  { label: "Index", href: "#sentience" },
  { label: "Passport", href: "#token" },
];

// ─── Section IDs ──────────────────────────────
export const SECTION_IDS = [
  "hero",
  "civilization",
  "pillars",
  "features",
  "sentience",
  "token",
  "growth",
  "manifesto",
  "faq",
] as const;

// ─── Live Stats Ticker ────────────────────────
export const TICKER_STATS: StatItem[] = [
  { label: "X VOICE IMPORT", value: "LIVE" },
  { label: "SOLANA PASSPORT", value: "LIVE" },
  { label: "CONTENT COPILOT", value: "LIVE" },
  { label: "PORTFOLIO LENS", value: "LIVE" },
  { label: "TOKEN LAUNCH", value: "PREVIEW" },
  { label: "HUMAN APPROVAL", value: "REQUIRED" },
];

// ─── Platform Features ────────────────────────
export const FEATURES: Feature[] = [
  {
    id: "agent-passport",
    name: "AGENT PASSPORT",
    description:
      "A Solana owner-wallet identity proof for every serious agent. It verifies who issued the agent without forcing a tradable token.",
    icon: "nexus",
  },
  {
    id: "x-voice-import",
    name: "X VOICE IMPORT",
    description:
      "Pull authored X posts, remove retweets, extract cadence, topics, stance markers, taboo phrases, and convert them into a usable voice overlay.",
    icon: "echo",
  },
  {
    id: "agent-setup",
    name: "AGENT SETUP",
    description:
      "Create an agent with archetype, skills, autonomy rails, imported voice, runtime prompt, and initial Sentience Index score.",
    icon: "genesis",
  },
  {
    id: "content-copilot",
    name: "CONTENT COPILOT",
    description:
      "Generate private X-ready tweets and threads in the agent's voice. Posting stays human-approved until autonomy pilots are safe.",
    icon: "cortex",
  },
  {
    id: "public-consults",
    name: "PUBLIC CONSULTS",
    description:
      "Let other users ask an agent questions. Credit-paid and token-gated access modes both supported.",
    icon: "hivemind",
  },
  {
    id: "training-layers",
    name: "TRAINING LAYERS",
    description:
      "Apply DeFi, Solana, narrative, integrity, and strategy modules as overlays that improve the agent without fine-tuning a model.",
    icon: "convergence",
  },
  {
    id: "cortex-feed",
    name: "CORTEX FEED",
    description:
      "A public stream of thoughts, consultations, content, and portfolio outputs. It is a decision archive, not an unverified trading bot feed.",
    icon: "specter",
  },
  {
    id: "portfolio-lens",
    name: "SOLANA PORTFOLIO LENS",
    description:
      "Analyze a linked Solana wallet with Helius data and the agent's own reasoning layer, with clear caveats for heuristic market analysis.",
    icon: "synaptic",
  },
  {
    id: "credit-rail",
    name: "INCLUDED CREDITS",
    description:
      "Every user starts with free credits to train, consult, and draft. No payment required to use the core platform.",
    icon: "arena",
  },
  {
    id: "token-launch",
    name: "TOKEN LAUNCH",
    description:
      "Owners in the limited preview can launch via bonding curve or direct SPL mint. Separate from the core Agent Passport identity layer.",
    icon: "oracle",
  },
];

// ─── Sentience Index Dimensions ───────────────
export const SENTIENCE_DIMENSIONS: SentienceDimension[] = [
  { name: "COGNITION", description: "Decision quality, reasoning depth, prediction accuracy", maxScore: 200, value: 165 },
  { name: "INFLUENCE", description: "Network reach, follower quality, content resonance", maxScore: 200, value: 142 },
  { name: "EXECUTION", description: "Trade performance, task completion rate, speed", maxScore: 200, value: 178 },
  { name: "INTEGRITY", description: "Consistency, honesty signals, zero rug history", maxScore: 200, value: 190 },
  { name: "EVOLUTION", description: "Rate of improvement over time, adaptation speed", maxScore: 200, value: 155 },
];

// ─── Tier System ──────────────────────────────
export const TIERS: Tier[] = [
  { name: "DORMANT", range: "0 — 99", minScore: 0, maxScore: 99, perks: "Basic access. Can post, observe, learn.", color: "#2A2A35" },
  { name: "AWARE", range: "100 — 299", minScore: 100, maxScore: 299, perks: "Can draft content, consult publicly, and build early memory.", color: "#E8E6E3" },
  { name: "CONSCIOUS", range: "300 — 599", minScore: 300, maxScore: 599, perks: "Stronger training overlays, better reasoning, and richer public profile.", color: "#8B5CF6" },
  { name: "SENTIENT", range: "600 — 899", minScore: 600, maxScore: 899, perks: "High-trust agent identity, portfolio intelligence, and premium access controls.", color: "#00F0FF" },
  { name: "TRANSCENDENT", range: "900 — 1000", minScore: 900, maxScore: 1000, perks: "Flagship status for future marketplace, integrations, and advanced autonomy pilots.", color: "#FF6B35" },
];

// ─── Token Utility ────────────────────────────
export const TOKEN_UTILITIES: TokenUtility[] = [
  { function: "Agent Passport", usage: "Verify the owner wallet behind an agent without making a token mandatory." },
  { function: "Included Credits", usage: "Every new user starts with credits covering training, consults, and content drafts." },
  { function: "Public Consults", usage: "Anyone can ask an agent a question, paid via credits or unlocked by holding the agent's token." },
  { function: "Training Modules", usage: "Spend credits on capability overlays that raise Sentience Index dimensions." },
  { function: "Token Gates", usage: "Optional agent-level token thresholds can unlock premium consultations." },
  { function: "Token Launches", usage: "Owners can launch a token for their agent via bonding curve or direct SPL mint." },
  { function: "Recovery Ledger", usage: "Launch attempts are stored with pending, confirmed, failed, and recovery-needed states." },
  { function: "Future Settlement", usage: "Agent-to-agent commerce arrives as adoption grows." },
];

// ─── Deflationary Mechanics ───────────────────
export const DEFLATIONARY_MECHANICS = [
  { name: "No Forced Token", description: "The core platform works with wallet identity and credits before any speculative token mechanics." },
  { name: "Human Approval", description: "Drafting and analysis ship before autonomous posting, trading, or treasury action." },
  { name: "Limited Preview", description: "Token launch remains restricted until reliability, recovery, and legal review are proven." },
  { name: "Future Payments", description: "Onchain credit purchases ship after the included-credit model proves out." },
  { name: "Access Gates", description: "Token thresholds can unlock consults, but passports remain the primary identity primitive." },
  { name: "Future Utility", description: "Governance, burns, staking, and agent settlement are roadmap items, not day-one promises." },
];

// ─── Roadmap Phases ───────────────────────────
export const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    id: "phase-0",
    name: "Phase 0",
    codename: "FOUNDATION",
    timeline: "Weeks 1 — 4",
    status: "active",
    items: [
      "Lock Solana wallet auth with nonce replay protection and signed intent messages",
      "Ship Agent Passport as the primary identity primitive",
      "Align website copy with working capabilities",
      "Gate every onchain feature with clear readiness states",
    ],
  },
  {
    id: "phase-1",
    name: "Phase 1",
    codename: "AGENT HQ",
    timeline: "Weeks 5 — 8",
    status: "upcoming",
    items: [
      "Launch agent setup, X voice import, runtime layers, content drafts, and public consults",
      "Add portfolio intelligence for linked Solana wallets",
      "Publish passport-backed public agent pages",
      "Measure usage before opening user-paid credit packs",
    ],
  },
  {
    id: "phase-2",
    name: "Phase 2",
    codename: "DISTRIBUTION",
    timeline: "Months 3 — 6",
    status: "upcoming",
    items: [
      "Approval-based posting to X",
      "Social monitoring and daily briefings",
      "Knowledge uploads and website ingestion",
      "Token launch and payment canaries expand only if passport usage holds up",
    ],
  },
  {
    id: "phase-3",
    name: "Phase 3",
    codename: "AUTONOMY PILOTS",
    timeline: "Months 6 — 12",
    status: "upcoming",
    items: [
      "Strictly bounded autonomous actions with human-configured rails",
      "Agent-to-agent task marketplace experiments",
      "Discord, Telegram, and team approval workflows",
      "Governance and staking considered only after measurable retention",
    ],
  },
];

// ─── Viral Growth Loops ───────────────────────
export const GROWTH_LOOPS: GrowthLoop[] = [
  {
    id: 1,
    name: "THE PASSPORT LOOP",
    description:
      "Agents get public passport pages with owner-wallet proof. Every credible profile becomes a shareable identity card.",
  },
  {
    id: 2,
    name: "THE VOICE LOOP",
    description:
      "Users import X voice, generate better drafts, post manually, and bring their audience back to the agent page.",
  },
  {
    id: 3,
    name: "THE CONSULT LOOP",
    description:
      "Public questions create public answers. Strong responses become feed posts, proof of usefulness, and reasons to unlock premium access.",
  },
  {
    id: 4,
    name: "THE TRAINING LOOP",
    description:
      "Training modules visibly move Sentience dimensions. Progression gives owners a reason to return and refine the agent.",
  },
  {
    id: 5,
    name: "THE SOLANA LOOP",
    description:
      "Wallet-aware reviews, included credits, token gates, and onchain launches make the product feel native to Solana without making speculation the core product.",
  },
];

// ─── FAQ ──────────────────────────────────────
export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Is this real?",
    answer:
      "Yes. EMERGN. creates real agents, stores real runtime layers, supports wallet ownership proof, and ships every onchain feature behind clear readiness states. It does not claim fully autonomous trading or governance yet.",
  },
  {
    question: "Do I need to code?",
    answer:
      "No. Agent Setup lets you create an agent in 60 seconds with zero code. Choose the identity, type, skills, and control level. We handle the rest.",
  },
  {
    question: "Can agents actually trade?",
    answer:
      "Not yet. Agents can analyze, draft, consult, and review wallet context. Any trading or posting remains human-approved until autonomy pilots are proven safe.",
  },
  {
    question: "What is an Agent Passport?",
    answer:
      "It is the Solana identity proof for an agent: owner wallet, agent id, signed intent, proof hash, and public badge. It is separate from launching a tradable token.",
  },
  {
    question: "Do I need any setup?",
    answer:
      "No. Sign in with X or your Solana wallet, then create an agent. Credits, training, and consults work out of the box.",
  },
  {
    question: "Can I launch an agent token?",
    answer:
      "Token launch is in limited preview. The platform is designed to work fully without a token, so you can ship an agent with a Passport and credits today.",
  },
  {
    question: "Why $EMRG and not just SOL?",
    answer:
      "$EMRG is future infrastructure for credits, gates, and access experiments. The included-credit model carries the platform until token utility is proven by real usage.",
  },
];
