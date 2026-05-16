import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { cleanJsonResponse } from "@/lib/ai/runtime-prompt";
import type { AgentFeedback, TrainingModule } from "@/types";

interface TrainingContextResult {
  overlay: string;
  summary: string;
}

interface RefinementResult {
  overlay: string;
  summary: string;
}

export async function generateTrainingOverlay(options: {
  agentName: string;
  runtimePrompt: string;
  module: TrainingModule;
}): Promise<TrainingContextResult> {
  try {
    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: options.runtimePrompt,
      prompt: `You are refining an AI agent with a new training module.

Agent: ${options.agentName}
Module: ${options.module.name}
Description: ${options.module.description}
Training prompt: ${options.module.prompt_template}

Return ONLY valid JSON:
{
  "overlay": "A concise overlay that adds this capability without overriding the core personality.",
  "summary": "One short sentence describing what improved."
}`,
      maxOutputTokens: 900,
    });

    return JSON.parse(cleanJsonResponse(text)) as TrainingContextResult;
  } catch (error) {
    console.error(
      "[agent-trainer] training generation or parse failed, using fallback:",
      error instanceof Error ? error.message : error
    );
    return {
      overlay: `${options.module.name}: Apply this capability when it improves signal quality. Stay consistent with the agent's voice and judgment while drawing on ${options.module.description.toLowerCase()}.`,
      summary: `Applied ${options.module.name} training.`,
    };
  }
}

export async function generateRefinementOverlay(options: {
  agentName: string;
  runtimePrompt: string;
  feedback: AgentFeedback[];
}): Promise<RefinementResult> {
  const feedbackSummary = options.feedback
    .map((item, index) => {
      const note = item.feedback_text?.trim() || "No written note.";
      return `${index + 1}. Rating ${item.rating}: ${note}`;
    })
    .join("\n");

  try {
    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: options.runtimePrompt,
      prompt: `You are refining an agent based on user feedback.

Agent: ${options.agentName}

Feedback:
${feedbackSummary}

Create a refinement overlay that tightens the agent's behavior without changing its identity.

Return ONLY valid JSON:
{
  "overlay": "A concise behavior overlay focused on reducing repeated weaknesses and improving usefulness.",
  "summary": "One short sentence explaining what changed."
}`,
      maxOutputTokens: 900,
    });

    return JSON.parse(cleanJsonResponse(text)) as RefinementResult;
  } catch (error) {
    console.error(
      "[agent-trainer] refinement generation or parse failed, using fallback:",
      error instanceof Error ? error.message : error
    );
    return {
      overlay:
        "Tighten conclusions, avoid repeating weak or generic statements, surface clearer caveats when confidence is low, and lead with the most actionable insight first.",
      summary: "Applied a conservative refinement overlay.",
    };
  }
}
