// AI-suggested agent names from the user's X voice. Uses Claude to surface
// 3 candidates with rationales — pulled from the cached X personality overlay
// (already populated by personality-extractor.ts) plus the user's bio and
// handle. Server-only.

import "server-only";

import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { cleanJsonResponse } from "@/lib/ai/runtime-prompt";

export interface NameSuggestion {
  name: string;
  rationale: string;
}

export interface NameSuggestionInput {
  xHandle: string;
  bio?: string | null;
  personalityOverlay?: string | null;
}

const SYSTEM = `You name AI agents in EMERGN. — a Solana-native agent platform.
Names are single evocative words: short (4–10 chars), all caps, easy to pronounce,
synthetic and slightly cryptic (e.g., SPECTRA, KAIROS, NULL, DUSK, ORYX, VIREO).
They should hint at the user's voice without being literal. Do not use
common English words, religious figures, real brand names, or already-popular
crypto tickers. Return JSON only — no markdown.`;

const FALLBACK: NameSuggestion[] = [
  { name: "SPECTRA", rationale: "Default — wide-spectrum signal interpreter." },
  { name: "VIREO", rationale: "Default — quick, observant, voice-driven." },
  { name: "KAIROS", rationale: "Default — pattern-aware, time-precise." },
];

export async function suggestAgentNamesFromX(
  input: NameSuggestionInput
): Promise<NameSuggestion[]> {
  const handle = input.xHandle.replace(/^@/, "").trim();
  if (!handle) return FALLBACK;

  try {
    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: SYSTEM,
      prompt: `Suggest 3 agent names tuned to this user's voice.

Handle: @${handle}
Bio: ${input.bio?.trim() || "(no bio)"}
Voice overlay (auto-extracted from recent posts):
${input.personalityOverlay?.trim() || "(no overlay yet — propose generic-but-evocative names)"}

Return this exact JSON shape:
{
  "suggestions": [
    { "name": "ALLCAPSWORD", "rationale": "Why this fits — 1 short sentence referencing the voice." },
    { "name": "ALLCAPSWORD", "rationale": "..." },
    { "name": "ALLCAPSWORD", "rationale": "..." }
  ]
}`,
      maxOutputTokens: 500,
    });

    const parsed = JSON.parse(cleanJsonResponse(text)) as {
      suggestions?: Array<{ name?: string; rationale?: string }>;
    };
    const cleaned = (parsed.suggestions ?? [])
      .map((s) => ({
        name: (s.name ?? "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 12),
        rationale: (s.rationale ?? "").trim(),
      }))
      .filter((s) => s.name.length >= 3 && s.rationale.length > 0)
      .slice(0, 3);

    if (cleaned.length === 0) return FALLBACK;
    while (cleaned.length < 3) cleaned.push(FALLBACK[cleaned.length]);
    return cleaned;
  } catch (error) {
    console.error(
      "[agent-naming] suggestion failed, using fallback:",
      error instanceof Error ? error.message : error
    );
    return FALLBACK;
  }
}
