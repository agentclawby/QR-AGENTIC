// EMERGN. brand tokens — keep in sync with emergn/src/app/globals.css
// Period in name is intentional. Zero rounded corners. No emojis.

export const COLORS = {
  voidBlack: "#0A0A0F",
  neuralWhite: "#E8E6E3",
  pulseCyan: "#00F0FF",
  signalViolet: "#8B5CF6",
  emberOrange: "#FF6B35",
  ghostGray: "#2A2A35",
} as const;

export const FONTS = {
  headline: "'Space Grotesk', 'Helvetica Neue', sans-serif",
  body: "'Inter', 'Helvetica Neue', sans-serif",
  mono: "'JetBrains Mono', 'Menlo', monospace",
} as const;

export const ARCHETYPE_COLORS: Record<string, string> = {
  ORACLE: COLORS.pulseCyan,
  HUNTER: COLORS.emberOrange,
  SENTINEL: COLORS.signalViolet,
  DIPLOMAT: COLORS.neuralWhite,
  GHOST: "#6B7280",
  EVOLVE: "#00B4D8",
};

export const TIER_COLORS: Record<string, string> = {
  DORMANT: "#6B7280",
  AWARE: COLORS.neuralWhite,
  CONSCIOUS: COLORS.signalViolet,
  SENTIENT: COLORS.pulseCyan,
  TRANSCENDENT: COLORS.emberOrange,
};
