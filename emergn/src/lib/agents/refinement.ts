import type { SupabaseClient } from "@supabase/supabase-js";
import { buildRuntimePrompt } from "@/lib/ai/runtime-prompt";
import { generateRefinementOverlay } from "@/lib/ai/agent-trainer";
import { getSystemCapabilities } from "@/lib/config/features";
import type { Agent, AgentFeedback } from "@/types";

export async function maybeRefineAgentFromFeedback(options: {
  supabase: SupabaseClient;
  agent: Agent;
}) {
  const { supabase, agent } = options;
  const capabilities = getSystemCapabilities();

  if (!capabilities.anthropic.enabled) {
    return { refined: false, reason: "anthropic_unavailable" as const };
  }

  if (agent.last_refinement_at) {
    const parsedCooldown = Number.parseFloat(
      process.env.REFINEMENT_COOLDOWN_HOURS ?? ""
    );
    const cooldownHours =
      Number.isFinite(parsedCooldown) && parsedCooldown > 0
        ? parsedCooldown
        : process.env.NODE_ENV === "production"
          ? 24
          : 1;
    const msSinceLast =
      Date.now() - new Date(agent.last_refinement_at).getTime();
    if (msSinceLast < cooldownHours * 60 * 60 * 1000) {
      return { refined: false, reason: "cooldown" as const };
    }
  }

  const { data: feedback } = await supabase
    .from("agent_feedback")
    .select("*")
    .eq("agent_id", agent.id)
    .eq("processed_for_refinement", false)
    .order("created_at", { ascending: true })
    .limit(20);

  const pendingFeedback = (feedback ?? []) as AgentFeedback[];
  const negativeCount = pendingFeedback.filter((item) => item.rating < 0).length;

  if (pendingFeedback.length < 5 || negativeCount < 2) {
    return { refined: false, reason: "threshold" as const };
  }

  const runtimePrompt = buildRuntimePrompt({
    systemPrompt: agent.system_prompt,
    personalityOverlay: agent.personality_overlay,
    trainingOverlay: agent.training_overlay,
    refinementOverlay: agent.refinement_overlay,
    modeInstructions:
      "Refine the agent carefully. Tighten weak behavior without replacing the core voice.",
  });

  const refinement = await generateRefinementOverlay({
    agentName: agent.name,
    runtimePrompt,
    feedback: pendingFeedback,
  });

  const { error: updateError } = await supabase
    .from("agents")
    .update({
      refinement_overlay: refinement.overlay,
      last_refinement_at: new Date().toISOString(),
    })
    .eq("id", agent.id);

  if (updateError) {
    throw new Error("Failed to update refinement overlay");
  }

  const feedbackIds = pendingFeedback.map((item) => item.id);
  if (feedbackIds.length > 0) {
    await supabase
      .from("agent_feedback")
      .update({ processed_for_refinement: true })
      .in("id", feedbackIds);
  }

  await supabase.from("agent_interactions").insert({
    agent_id: agent.id,
    interaction_type: "refine",
    metadata: {
      feedback_count: pendingFeedback.length,
      negative_count: negativeCount,
      summary: refinement.summary,
    },
  });

  return {
    refined: true,
    overlay: refinement.overlay,
    summary: refinement.summary,
  };
}
