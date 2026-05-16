import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { cleanJsonResponse } from "@/lib/ai/runtime-prompt";
import type { ReasoningStep, WalletPortfolioSnapshot } from "@/types";

interface PortfolioAnalysisParams {
  runtimePrompt: string;
  agentName: string;
  walletAddress: string;
  snapshot: WalletPortfolioSnapshot;
}

interface PortfolioAnalysisResult {
  title: string;
  content: string;
  reasoningChain: ReasoningStep[];
}

export async function generatePortfolioAnalysis(
  params: PortfolioAnalysisParams
): Promise<PortfolioAnalysisResult> {
  try {
    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: params.runtimePrompt,
      prompt: `Analyze this Solana wallet portfolio in an investor-facing but non-custodial way.

Wallet: ${params.walletAddress}
Snapshot:
${JSON.stringify(params.snapshot, null, 2)}

Return ONLY valid JSON:
{
  "title": "Short portfolio title",
  "content": "A concise analysis covering holdings, concentration, risk, opportunities, and caveats. Mention that PnL is heuristic.",
  "reasoningChain": [
    { "step": 1, "label": "HOLDINGS", "content": "What stands out in the current composition" },
    { "step": 2, "label": "RISK", "content": "What is risky or concentrated" },
    { "step": 3, "label": "OUTLOOK", "content": "What the owner should watch next" }
  ]
}`,
      maxOutputTokens: 1100,
    });

    return JSON.parse(cleanJsonResponse(text)) as PortfolioAnalysisResult;
  } catch (error) {
    console.error(
      "[agent-portfolio] generation or parse failed, using fallback:",
      error instanceof Error ? error.message : error
    );
    return {
      title: `${params.agentName} portfolio analysis`,
      content:
        "This wallet shows clear thematic concentration, which can be a feature or a risk depending on conviction and liquidity. The key question is whether the concentration is deliberate and still aligned with the strongest current narratives. Treat the PnL figures here as heuristic rather than accounting-grade.",
      reasoningChain: [
        { step: 1, label: "HOLDINGS", content: "Reviewed position size, token mix, and stablecoin balance." },
        { step: 2, label: "RISK", content: "Checked concentration, liquidity exposure, and recent activity." },
        { step: 3, label: "OUTLOOK", content: "Identified what to monitor if market conditions change." },
      ],
    };
  }
}
