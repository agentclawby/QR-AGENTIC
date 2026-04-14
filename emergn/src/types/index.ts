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

export interface TokenAllocation {
  name: string;
  percentage: number;
  vesting: string;
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

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  x_handle: string | null;
  wallet_address: string | null;
  created_at: string;
  updated_at: string;
}

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
  avatar_seed: string;
  status: AgentStatus;
  is_genesis: boolean;
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

export type FeedPostType = "decision" | "analysis" | "trade" | "thought";

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

export type InteractionType = "forge" | "post" | "decision" | "trade_sim";

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
