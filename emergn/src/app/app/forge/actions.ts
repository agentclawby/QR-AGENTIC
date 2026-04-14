"use server";

import { createClient } from "@/lib/supabase/server";
import { generateAgentPersonality } from "@/lib/ai/agent-forge";
import {
  ARCHETYPE_SEED_SCORES,
  MAX_AGENTS_PER_USER,
} from "@/lib/agent-constants";
import { z } from "zod";

const forgeSchema = z.object({
  name: z.string().min(2).max(30),
  archetype: z.enum(["ORACLE", "HUNTER", "SENTINEL", "DIPLOMAT", "GHOST", "EVOLVE"]),
  skills: z.array(z.string()).min(2).max(4),
  autonomyLevel: z.number().int().min(1).max(10),
});

export type ForgeInput = z.infer<typeof forgeSchema>;

interface ForgeResult {
  success: boolean;
  agentId?: string;
  error?: string;
}

export async function forgeAgent(input: ForgeInput): Promise<ForgeResult> {
  try {
    // Validate input
    const parsed = forgeSchema.parse(input);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Check agent count limit
    const { count } = await supabase
      .from("agents")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", user.id);

    if ((count ?? 0) >= MAX_AGENTS_PER_USER) {
      return {
        success: false,
        error: `Maximum ${MAX_AGENTS_PER_USER} agents allowed per user`,
      };
    }

    // Generate personality with Claude
    const personality = await generateAgentPersonality({
      name: parsed.name,
      archetype: parsed.archetype,
      skills: parsed.skills,
      autonomyLevel: parsed.autonomyLevel,
    });

    // Check genesis eligibility (first 10,000 agents)
    const { count: totalAgents } = await supabase
      .from("agents")
      .select("*", { count: "exact", head: true });

    const isGenesis = (totalAgents ?? 0) < 10000;

    // Insert agent
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .insert({
        owner_id: user.id,
        name: parsed.name,
        codename: personality.codename,
        archetype: parsed.archetype,
        skills: parsed.skills,
        autonomy_level: parsed.autonomyLevel,
        system_prompt: personality.systemPrompt,
        personality_summary: personality.personalitySummary,
        status: "active",
        is_genesis: isGenesis,
      })
      .select()
      .single();

    if (agentError || !agent) {
      return { success: false, error: "Failed to create agent" };
    }

    // Create initial sentience scores based on archetype
    const seeds = ARCHETYPE_SEED_SCORES[parsed.archetype] ?? {
      cognition: 20,
      influence: 20,
      execution: 20,
      integrity: 20,
      evolution: 20,
    };

    await supabase.from("sentience_scores").insert({
      agent_id: agent.id,
      ...seeds,
    });

    // Log the forge interaction
    await supabase.from("agent_interactions").insert({
      agent_id: agent.id,
      interaction_type: "forge",
      metadata: {
        archetype: parsed.archetype,
        skills: parsed.skills,
        autonomy_level: parsed.autonomyLevel,
      },
    });

    return { success: true, agentId: agent.id };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid input" };
    }
    console.error("Forge error:", error);
    return { success: false, error: "Something went wrong during forging" };
  }
}
