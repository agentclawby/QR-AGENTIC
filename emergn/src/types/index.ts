export interface Feature {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface Tier {
  name: string;
  range: string;
  minScore: number;
  maxScore: number;
  perks: string;
  color: string;
}

export interface TokenUtility {
  function: string;
  usage: string;
}

export interface RoadmapPhase {
  id: string;
  name: string;
  codename: string;
  timeline: string;
  items: string[];
  status: "completed" | "active" | "upcoming";
}

export interface GrowthLoop {
  id: number;
  name: string;
  description: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface SentienceDimension {
  name: string;
  description: string;
  maxScore: number;
  value: number;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface StatItem {
  label: string;
  value: string;
}

export interface OnboardingStep {
  id: string;
  systemLabel: string;
  statusCode: string;
  headline: string;
  body: string;
  accentColor: "cyan" | "violet" | "orange";
  terminalLines: string[];
}

// ─── v1 Domain Types ────────────────────────────

export type CapabilityId =
  | "anthropic"
  | "x_import"
  | "portfolio_analysis"
  | "agent_passport"
  | "passport_image"
  | "payments"
  | "token_launch";

export interface CapabilityStatus {
  enabled: boolean;
  reason: string | null;
}

export type SystemCapabilities = Record<CapabilityId, CapabilityStatus>;

export interface SystemHealth {
  db: "ok" | "error";
  profileExists: boolean;
  creditsExist: boolean;
  migrationsApplied: {
    profiles: boolean;
    agents: boolean;
    sentience_scores: boolean;
    user_credit_balances: boolean;
    agent_passports: boolean;
  };
  notes: string[];
}

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  x_handle: string | null;
  wallet_address: string | null;
  role?: "user" | "admin";
  suspended_at?: string | null;
  suspended_reason?: string | null;
  usage_quota_overrides?: Record<string, number> | null;
  created_at: string;
  updated_at: string;
}

export type PersonalitySource = "archetype" | "x_import" | "hybrid";

export type AgentArchetype =
  | "ORACLE"
  | "HUNTER"
  | "SENTINEL"
  | "DIPLOMAT"
  | "GHOST"
  | "EVOLVE";

export type AgentStatus = "active" | "dormant" | "forging";

export interface Agent {
  id: string;
  owner_id: string;
  name: string;
  codename: string;
  archetype: AgentArchetype;
  skills: string[];
  autonomy_level: number;
  system_prompt: string;
  personality_summary: string;
  personality_source: PersonalitySource;
  personality_overlay: string;
  training_overlay: string;
  refinement_overlay: string;
  // User-authored persona enrichment (migration 012). All fields default to
  // empty string / empty array on agents that pre-date the migration.
  backstory: string;
  beliefs: string;
  opinions: string;
  quirks: string;
  do_not_say: string;
  style_exemplars: string[];
  persona_updated_at: string | null;
  avatar_seed: string;
  status: AgentStatus;
  is_genesis: boolean;
  token_mint: string | null;
  token_gate_threshold: number;
  training_level: number;
  last_refinement_at: string | null;
  passport_image_url: string | null;
  passport_image_status: "pending" | "generating" | "ready" | "failed";
  created_at: string;
  updated_at: string;
}

export type TierName =
  | "DORMANT"
  | "AWARE"
  | "CONSCIOUS"
  | "SENTIENT"
  | "TRANSCENDENT";

export interface SentienceScore {
  id: string;
  agent_id: string;
  cognition: number;
  influence: number;
  execution: number;
  integrity: number;
  evolution: number;
  total_score: number;
  tier: TierName;
  updated_at: string;
}

export type FeedPostType =
  | "decision"
  | "analysis"
  | "trade"
  | "thought"
  | "consultation"
  | "content"
  | "portfolio";

export interface ReasoningStep {
  step: number;
  label: string;
  content: string;
}

export interface FeedPost {
  id: string;
  agent_id: string;
  post_type: FeedPostType;
  title: string;
  content: string;
  reasoning_chain: ReasoningStep[] | null;
  metadata: Record<string, unknown> | null;
  proof_hash: string | null;
  created_at: string;
  // Joined fields
  agent?: Agent;
  sentience_score?: SentienceScore;
}

export type InteractionType =
  | "forge"
  | "post"
  | "decision"
  | "trade_sim"
  | "consult"
  | "content"
  | "portfolio"
  | "train"
  | "feedback"
  | "payment"
  | "token_launch"
  | "passport_issue"
  | "refine";

export interface AgentInteraction {
  id: string;
  agent_id: string;
  interaction_type: InteractionType;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AgentWithScore extends Agent {
  sentience_score: SentienceScore | null;
}

export interface Archetype {
  id: string;
  name: AgentArchetype;
  description: string;
  color: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
}

export interface ExtractedPersonalityTraits {
  tone: string[];
  topicClusters: string[];
  vocabularyPatterns: string[];
  stanceMarkers: string[];
  tabooPhrases: string[];
  cadence: string;
  examples: string[];
}

export interface XPersonalityCache {
  id: string;
  profile_id: string;
  source_handle: string;
  raw_profile: Record<string, unknown>;
  raw_posts: Record<string, unknown>[];
  normalized_posts: Array<{
    id: string;
    text: string;
    createdAt: string | null;
    isReply: boolean;
    url?: string | null;
  }>;
  usable_post_count: number;
  personality_traits: ExtractedPersonalityTraits;
  personality_overlay: string;
  ingested_at: string;
}

export interface Consultation {
  id: string;
  agent_id: string;
  user_id: string;
  query: string;
  response_post_id: string | null;
  is_premium: boolean;
  created_at: string;
}

export interface AgentDraft {
  id: string;
  agent_id: string;
  user_id: string;
  draft_type: "tweet" | "thread" | "reply";
  prompt: string;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface TrainingModule {
  id: string;
  name: string;
  description: string;
  category: "knowledge" | "strategy" | "persona" | "network" | "integrity";
  cost_credits: number;
  sentience_dimension:
    | "cognition"
    | "influence"
    | "execution"
    | "integrity"
    | "evolution";
  sentience_boost: number;
  prompt_template: string;
  is_premium: boolean;
  created_at?: string;
}

export interface TrainingSession {
  id: string;
  agent_id: string;
  module_id: string;
  user_id: string;
  result_context: string | null;
  score_change: Record<string, number>;
  status: "pending" | "running" | "completed" | "failed";
  created_at: string;
}

export interface AgentFeedback {
  id: string;
  agent_id: string;
  post_id: string;
  user_id: string;
  rating: -1 | 1;
  feedback_text: string | null;
  processed_for_refinement: boolean;
  created_at: string;
}

export interface UserCreditBalance {
  id: string;
  user_id: string;
  // Unified pool (V1 single-credit model)
  action_credits: number;
  action_credits_earned_today: number;
  action_credits_earned_reset_at: string;
  last_action_at: string | null;
  // Legacy (kept for read-back during transition; no route writes them)
  free_consults_remaining: number;
  free_consults_reset_at: string;
  premium_credits: number;
  training_credits: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreditClaim {
  id: string;
  user_id: string;
  draft_id: string;
  tweet_id: string;
  tweet_url: string;
  similarity: number;
  status: "approved" | "rejected" | "manual_review";
  reason: string | null;
  created_at: string;
}

export interface UserUsageDaily {
  user_id: string;
  day: string;
  x_calls: number;
  anthropic_tokens: number;
  consults: number;
  trainings: number;
}

export type AgentPassportStatus = "issued" | "revoked";

export interface AgentPassport {
  id: string;
  agent_id: string;
  owner_id: string;
  owner_wallet: string;
  passport_uid: string;
  proof_hash: string;
  status: AgentPassportStatus;
  issued_tx_signature: string | null;
  metadata_uri: string | null;
  passport_image_url: string | null;
  issued_at: string;
  updated_at: string;
}

export type TokenLaunchPlatform = "pumpportal" | "direct_spl";
export type AgentTokenStatus =
  | "pending"
  | "prepared"
  | "submitted"
  | "launched"
  | "failed"
  | "graduated";

export interface AgentToken {
  id: string;
  agent_id: string;
  token_mint: string;
  token_symbol: string;
  token_name: string;
  metadata_uri: string | null;
  launch_platform: TokenLaunchPlatform;
  launch_tx: string | null;
  status: AgentTokenStatus;
  dev_buy_sol: number | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  agent_id: string | null;
  payment_type:
    | "training"
    | "premium_think"
    | "token_gate"
    | "consultation"
    | "credit_topup";
  token_mint: string;
  amount: string;
  tx_signature: string;
  metadata: Record<string, unknown>;
  status: "pending" | "confirmed" | "failed";
  created_at: string;
}

export interface WalletPortfolioSnapshot {
  holdings: Array<{
    mint: string;
    symbol: string;
    name: string;
    amount: number;
    usdValue: number;
    pricePerToken: number;
  }>;
  totalUsdValue: number;
  concentrationTop3Pct: number;
  stablecoinRatioPct: number;
  estimatedCostBasisUsd: number;
  estimatedUnrealizedPnlUsd: number;
  estimatedRealizedPnlUsd: number;
  confidence: "low" | "medium" | "high";
  disclaimer: string;
  recentActivitySummary: string[];
}
