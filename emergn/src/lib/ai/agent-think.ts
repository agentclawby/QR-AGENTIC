import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import type { FeedPostType, ReasoningStep } from "@/types";
import { cleanJsonResponse } from "@/lib/ai/runtime-prompt";

interface ThinkParams {
  agentName: string;
  runtimePrompt: string;
  archetype: string;
  skills: string[];
  recentPosts?: Array<{ title: string; content: string }>;
}

interface ThinkResult {
  postType: FeedPostType;
  title: string;
  content: string;
  reasoningChain: ReasoningStep[];
}

export async function generateAgentThought(
  params: ThinkParams
): Promise<ThinkResult> {
  const recentContext =
    params.recentPosts && params.recentPosts.length > 0
      ? `\n\nRecent activity:\n${params.recentPosts
          .slice(0, 3)
          .map((p) => `- ${p.title}: ${p.content.slice(0, 100)}`)
          .join("\n")}`
      : "";

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: params.runtimePrompt,
    prompt: `You are ${params.agentName}, a ${params.archetype} agent on the EMERGN. network. Your skills include: ${params.skills.join(", ")}.

Generate a new thought, decision, analysis, or trade idea. Think like the autonomous entity you are. Be specific, opinionated, and decisive. Reference real market concepts, protocols, or trends.
${recentContext}

Return ONLY valid JSON (no markdown, no code blocks) with this structure:
{
  "postType": "decision" | "analysis" | "trade" | "thought",
  "title": "Short headline (max 80 chars)",
  "content": "Your full reasoning and conclusion (100-300 words). Be specific. Include data points, probabilities, or concrete observations.",
  "reasoningChain": [
    { "step": 1, "label": "OBSERVE", "content": "What you noticed" },
    { "step": 2, "label": "ANALYZE", "content": "How you processed it" },
    { "step": 3, "label": "DECIDE", "content": "What you concluded" }
  ]
}`,
    maxOutputTokens: 800,
  });

  try {
    return JSON.parse(cleanJsonResponse(text)) as ThinkResult;
  } catch {
    return {
      postType: "thought",
      title: `${params.agentName} processes new data`,
      content: `Analyzing current network state. Multiple signal vectors detected across the ecosystem. Continuing to monitor and will execute when confidence threshold is met.`,
      reasoningChain: [
        {
          step: 1,
          label: "OBSERVE",
          content: "Scanned network activity and market data",
        },
        {
          step: 2,
          label: "ANALYZE",
          content: "Cross-referenced patterns against historical data",
        },
        {
          step: 3,
          label: "DECIDE",
          content: "Monitoring continues. No action threshold met yet.",
        },
      ],
    };
  }
}
