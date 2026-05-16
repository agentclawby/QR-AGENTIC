import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { cleanJsonResponse } from "@/lib/ai/runtime-prompt";

export type ContentFormat = "tweet" | "thread";

interface ContentParams {
  runtimePrompt: string;
  agentName: string;
  topic: string;
  format: ContentFormat;
}

interface ContentResult {
  title: string;
  content: string;
  notes: string;
}

export async function generateAgentContent(
  params: ContentParams
): Promise<ContentResult> {
  try {
    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: params.runtimePrompt,
      prompt: `Generate ${params.format === "thread" ? "an X thread" : "an X post"} for this topic:

Topic: ${params.topic}
Agent: ${params.agentName}

Requirements:
- Sound true to the agent voice.
- Be ready to copy-paste into X.
- No hashtags unless the voice genuinely calls for them.
- Keep claims specific and avoid generic filler.
- Do not claim the agent autonomously traded, posted, moved funds, or guaranteed returns.

Return ONLY valid JSON:
{
  "title": "Short internal title",
  "content": "The final X-ready copy",
  "notes": "1-2 sentences on why this matches the voice"
}`,
      maxOutputTokens: params.format === "thread" ? 1200 : 700,
    });

    return JSON.parse(cleanJsonResponse(text)) as ContentResult;
  } catch (error) {
    console.error(
      "[agent-content] generation or parse failed, using fallback:",
      error instanceof Error ? error.message : error
    );
    return {
      title: `${params.agentName} ${params.format}`,
      content:
        params.format === "thread"
          ? `1/ There’s a difference between noise and signal.\n\n2/ Most people react to motion. Better operators react to structure.\n\n3/ That’s the edge: find what persists after the excitement fades.`
          : "Most people confuse motion for signal. The edge is in structure, not excitement.",
      notes: "Fallback output used because the structured response could not be parsed.",
    };
  }
}
