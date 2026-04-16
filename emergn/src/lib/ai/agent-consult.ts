import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { cleanJsonResponse } from "@/lib/ai/runtime-prompt";
import type { ReasoningStep } from "@/types";

interface ConsultParams {
  runtimePrompt: string;
  agentName: string;
  query: string;
}

interface ConsultResult {
  title: string;
  content: string;
  reasoningChain: ReasoningStep[];
}

export async function generateAgentConsultation(
  params: ConsultParams
): Promise<ConsultResult> {
  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: params.runtimePrompt,
    prompt: `You are responding to a consultation request.

Agent: ${params.agentName}
User query: ${params.query}

Return ONLY valid JSON with this shape:
{
  "title": "Short consultation title, max 80 chars",
  "content": "A structured answer in 140-360 words. Include a clear position, key evidence, risks, and a concise conclusion.",
  "reasoningChain": [
    { "step": 1, "label": "FRAME", "content": "How you framed the problem" },
    { "step": 2, "label": "EVIDENCE", "content": "What signals or context mattered" },
    { "step": 3, "label": "JUDGMENT", "content": "What you concluded and why" }
  ]
}`,
    maxOutputTokens: 1000,
  });

  try {
    return JSON.parse(cleanJsonResponse(text)) as ConsultResult;
  } catch {
    return {
      title: `${params.agentName} consultation`,
      content:
        "I would frame this as a signal-quality problem first, then a positioning problem second. The strongest answer is rarely the loudest one; it is the one with the best evidence, the clearest downside, and the cleanest invalidation.",
      reasoningChain: [
        { step: 1, label: "FRAME", content: "Clarify the exact thesis and time horizon." },
        { step: 2, label: "EVIDENCE", content: "Prioritize concrete data and recent market behavior." },
        { step: 3, label: "JUDGMENT", content: "Take the position with the best asymmetry and clearest risks." },
      ],
    };
  }
}
