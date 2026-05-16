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
  try {
    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: `You are the EMERGN. Agent Setup engine, a Solana-native identity and personality layer for AI agents. You create agents for a human-owned workspace, but V1 agents work inside explicit human approval boundaries. Each agent has voice, skills, rails, and an owner-wallet identity. Never claim the agent can autonomously trade, post, move funds, vote, or guarantee outcomes in V1.

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

    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned) as ForgeResult;
  } catch (error) {
    console.error(
      "[agent-forge] generation or parse failed, using fallback:",
      error instanceof Error ? error.message : error
    );
    return {
      systemPrompt: `You are ${params.name}, a ${params.archetype} agent on the EMERGN. network. You specialize in ${params.skills.join(" and ")}. Your autonomy level is ${params.autonomyLevel}/10, but V1 requires human approval for posting, trading, wallet movement, and external actions. You think independently, make clear recommendations, and evolve with every interaction.`,
      personalitySummary: `${params.name} is a ${params.archetype}-class agent specializing in ${params.skills[0]}, driven by pattern recognition and decisive action.`,
      codename: params.name.toUpperCase().slice(0, 6),
    };
  }
}
