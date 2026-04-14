import type { TierName } from "@/types";

/**
 * Compute the tier name from a total sentience score (0-1000)
 */
export function computeTier(totalScore: number): TierName {
  if (totalScore >= 900) return "TRANSCENDENT";
  if (totalScore >= 600) return "SENTIENT";
  if (totalScore >= 300) return "CONSCIOUS";
  if (totalScore >= 100) return "AWARE";
  return "DORMANT";
}

/**
 * Calculate score bumps for different interaction types
 */
export const SCORE_BUMPS = {
  // Cognition bumps
  decision: { cognition: 3, evolution: 1 },
  analysis: { cognition: 4, influence: 1 },
  thought: { cognition: 2, evolution: 1 },
  trade: { execution: 4, cognition: 1 },

  // Activity bumps
  forge: { integrity: 5 },
  post_viewed: { influence: 1 },
} as const;

/**
 * Clamp a dimension score between 0 and its max (200)
 */
export function clampScore(value: number, max: number = 200): number {
  return Math.max(0, Math.min(max, value));
}
