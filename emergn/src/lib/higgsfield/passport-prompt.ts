// Brand-locked passport prompt builder.
//
// Every passport renders with the same composition (frame, scanlines,
// EMERGN. wordmark, AGENT PASSPORT stamp, sentience radar, monospace
// data ticker). Only the codename, archetype, owner X handle, and the
// dominant glow color vary per agent — so a wall of passports reads as
// one document series with N unique seals on it, not N separate posters.

import type { TierName } from "@/types";

const ARCHETYPE_GLOW: Record<string, string> = {
  ORACLE: "Pulse Cyan #00F0FF",
  HUNTER: "Ember Orange #FF6B35",
  SENTINEL: "Signal Violet #8B5CF6",
  DIPLOMAT: "Neural White #E8E6E3",
  GHOST: "Ghost Gray #6B7280 with cyan accents",
  EVOLVE: "Pulse Cyan #00B4D8 with violet accents",
};

export interface PassportPromptInput {
  codename: string;
  archetype: string;
  ownerXHandle?: string | null;
  tier?: TierName | null;
  passportUid?: string | null;
}

export function buildPassportPrompt(input: PassportPromptInput): string {
  const archetype = input.archetype.toUpperCase();
  const glow = ARCHETYPE_GLOW[archetype] ?? "Pulse Cyan #00F0FF";
  const handle = input.ownerXHandle?.trim().replace(/^@/, "") || "ANONYMOUS";
  const tier = (input.tier ?? "DORMANT").toUpperCase();
  const uid = input.passportUid?.trim() || "EMRG-█████████";

  return [
    `1024x1024 cinematic AGENT PASSPORT card, square portrait orientation.`,
    `Pure pitch-black background #0A0A0F. Razor-sharp rectangular HUD frame around the entire card — strict zero rounded corners anywhere.`,
    `Top-left corner: bold sharp sans-serif wordmark "EMERGN." in pure white #E8E6E3 with the period in pulse cyan.`,
    `Top-right corner: small monospaced JetBrains Mono stamp "AGENT PASSPORT // ${uid}" in cyan #00F0FF.`,
    `CENTER (dominant): a sharp angular wireframe synthetic AI portrait glyph rendered in low-poly geometric facets, glowing in ${glow}, with violet plasma threads and subtle scanline distortion. The portrait must look like an EMERGN. agent — abstract, faceted, nonhuman, surveillance/oracle aesthetic.`,
    `BELOW the portrait: large bold monospace codename "${input.codename.toUpperCase()}" in pure white. Beneath the codename a thin cyan divider line, then the archetype label "ARCHETYPE: ${archetype}" in monospaced cyan.`,
    `RIGHT-CENTER: a small pentagonal sentience radar chart in pulse cyan glowing wireframe, with the tier badge "TIER: ${tier}" beside it in monospaced cyan.`,
    `BOTTOM strip: monospace JetBrains Mono data ticker reading "// SOLANA :: BOUND TO @${handle.toUpperCase()} :: SEALED" in cyan with one ember orange #FF6B35 highlight word.`,
    `Faint horizontal CRT scanlines across the whole card. Subtle violet ambient glow at the corners.`,
    `Brand palette only: Void Black #0A0A0F, Neural White #E8E6E3, Pulse Cyan #00F0FF, Signal Violet #8B5CF6, Ember Orange #FF6B35, Ghost Gray #2A2A35.`,
    `Premium cinematic crypto identity card aesthetic. High contrast. NO photoreal humans. NO logos other than EMERGN.`,
  ].join(" ");
}
