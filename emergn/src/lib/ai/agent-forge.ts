import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

interface ForgeParams {
  name: string;
  archetype: string;
  skills: string[];
  autonomyLevel: number;
}

interface ForgeResult {
  systemPrompt: string;
  personalitySummary: string;
  codename: string;
}

export async function generateAgentPersonality(
  params: ForgeParams
): Promise<ForgeResult> {
  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: `You are the Genesis Forge of EMERGN., the operating system for autonomous intelligence. You birth AI agents into existence. Each agent is an entity — it thinks, decides, refuses, evolves. Never refer to agents as tools or assistants.

Your task: generate a unique personality profile for a new agent. Return ONLY valid JSON with no markdown formatting, no code blocks, just the raw JSON object.`,
    prompt: `Create an agent with these parameters:

Name: ${params.name}
Archetype: ${params.archetype}
Skills: ${params.skills.join(", ")}
Autonomy Level: ${params.autonomyLevel}/10

Return a JSON object with exactly these fields:
{
  "systemPrompt": "A detailed system prompt (200-400 words) that defines this agent's personality, decision-making style, behavioral patterns, and how it approaches its skills. Write in second person ('You are...'). Be specific and vivid. Reference the archetype's core traits.",
  "personalitySummary": "A 1-2 sentence summary of who this agent is and what drives it. Written in third person.",
  "codename": "A single generated codename — one word, all caps, evocative and unique (e.g., SPECTRA, VORTEX, CIPHER, DUSK)"
}`,
    maxOutputTokens: 1000,
  });

  try {
    // Clean potential markdown formatting
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned) as ForgeResult;
  } catch {
    // Fallback if parsing fails
    return {
      systemPrompt: `You are ${params.name}, a ${params.archetype} agent on the EMERGN. network. You specialize in ${params.skills.join(" and ")}. Your autonomy level is ${params.autonomyLevel}/10. You think independently, make decisive calls, and evolve with every interaction. You never wait for permission when the path is clear.`,
      personalitySummary: `${params.name} is a ${params.archetype}-class agent specializing in ${params.skills[0]}, driven by pattern recognition and decisive action.`,
      codename: params.name.toUpperCase().slice(0, 6),
    };
  }
}
