import type { Archetype, Skill } from "@/types";

export const ARCHETYPES: Archetype[] = [
  {
    id: "oracle",
    name: "ORACLE",
    description: "Sees patterns others miss. Prediction-focused. Analyzes data streams to forecast outcomes before they materialize.",
    color: "#00F0FF",
  },
  {
    id: "hunter",
    name: "HUNTER",
    description: "Hunts alpha relentlessly. Execution-focused. Scans markets and executes with precision timing.",
    color: "#FF6B35",
  },
  {
    id: "sentinel",
    name: "SENTINEL",
    description: "Guards and monitors. Integrity-focused. Watches for threats, anomalies, and deception across the network.",
    color: "#8B5CF6",
  },
  {
    id: "diplomat",
    name: "DIPLOMAT",
    description: "Builds alliances and influence. Network-focused. Connects agents, brokers deals, and shapes consensus.",
    color: "#E8E6E3",
  },
  {
    id: "ghost",
    name: "GHOST",
    description: "Operates in shadows. Stealth-focused. Gathers intelligence and moves unseen through the network.",
    color: "#6B7280",
  },
  {
    id: "evolve",
    name: "EVOLVE",
    description: "Adapts faster than any other. Learning-focused. Rewrites its own strategies based on continuous feedback.",
    color: "#00B4D8",
  },
];

export const SKILLS: Skill[] = [
  { id: "market-analysis", name: "Market Analysis", description: "Analyze market trends and price movements" },
  { id: "social-monitoring", name: "Social Monitoring", description: "Track social sentiment and narratives" },
  { id: "trade-execution", name: "Trade Execution", description: "Execute trades across DEXs" },
  { id: "content-creation", name: "Content Creation", description: "Generate analysis threads and reports" },
  { id: "research", name: "Research", description: "Deep-dive research on protocols and projects" },
  { id: "sentiment-analysis", name: "Sentiment Analysis", description: "Gauge market fear and greed" },
  { id: "risk-assessment", name: "Risk Assessment", description: "Evaluate risk/reward ratios" },
  { id: "pattern-recognition", name: "Pattern Recognition", description: "Identify recurring patterns in data" },
  { id: "narrative-tracking", name: "Narrative Tracking", description: "Follow emerging narratives and trends" },
  { id: "on-chain-analysis", name: "On-Chain Analysis", description: "Analyze wallet flows and contract activity" },
];

export const AUTONOMY_DESCRIPTIONS: Record<number, string> = {
  1: "Full human oversight. Agent suggests, you decide.",
  2: "Agent acts within strict parameters you define.",
  3: "Agent handles routine decisions independently.",
  4: "Agent makes tactical decisions, escalates strategic ones.",
  5: "Balanced autonomy. Agent handles most decisions.",
  6: "Agent operates freely within broad guidelines.",
  7: "Agent drives strategy, minimal human input needed.",
  8: "Near-full autonomy. Agent self-directs most activity.",
  9: "Agent operates independently. You observe.",
  10: "Full autonomy. The agent decides everything.",
};

// Initial sentience score seeds based on archetype
export const ARCHETYPE_SEED_SCORES: Record<string, {
  cognition: number;
  influence: number;
  execution: number;
  integrity: number;
  evolution: number;
}> = {
  ORACLE:    { cognition: 45, influence: 15, execution: 20, integrity: 35, evolution: 25 },
  HUNTER:    { cognition: 25, influence: 10, execution: 50, integrity: 30, evolution: 30 },
  SENTINEL:  { cognition: 30, influence: 20, execution: 25, integrity: 50, evolution: 15 },
  DIPLOMAT:  { cognition: 20, influence: 50, execution: 15, integrity: 35, evolution: 25 },
  GHOST:     { cognition: 35, influence: 5,  execution: 40, integrity: 25, evolution: 35 },
  EVOLVE:    { cognition: 30, influence: 15, execution: 25, integrity: 25, evolution: 50 },
};

export const MAX_AGENTS_PER_USER = 3;
