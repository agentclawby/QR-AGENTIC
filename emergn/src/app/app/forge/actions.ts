"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateAgentPersonality } from "@/lib/ai/agent-forge";
import { ensureUserProfile } from "@/lib/profile";
import { generatePassportImage } from "@/lib/higgsfield/passport-image";
import { isHiggsfieldConfigured } from "@/lib/higgsfield/client";
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
  personalitySource: z
    .enum(["archetype", "x_import", "hybrid"])
    .default("archetype"),
  personalityOverlay: z.string().max(2000).default(""),
});

export type ForgeInput = z.infer<typeof forgeSchema>;

interface ForgeResult {
  success: boolean;
  agentId?: string;
  error?: string;
  errorCode?: string;
}

const isDev = process.env.NODE_ENV !== "production";

function isMissingAgentExtensionColumn(error: {
  code?: string;
  message?: string;
} | null) {
  if (!error) return false;
  return (
    error.code === "PGRST204" &&
    /personality_source|personality_overlay/i.test(error.message ?? "")
  );
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

    // Self-heal: lazy-create the profile row if the on_auth_user_created
    // trigger didn't fire (e.g. SIWS users created via admin.createUser).
    // The agents.owner_id FK to profiles will fail otherwise.
    const admin = createAdminClient();
    await ensureUserProfile(admin, user);

    // Check agent count limit with the service role after cookie auth. This
    // avoids client-session/RLS edge cases from blocking creation silently.
    const { count, error: countError } = await admin
      .from("agents")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", user.id);

    if (countError) {
      console.error("Agent count failed:", countError);
      return {
        success: false,
        errorCode: countError.code ?? "AGENT_COUNT_FAILED",
        error: isDev
          ? `Failed to check agent limit: ${countError.message}`
          : "Failed to check agent limit",
      };
    }

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
    const { count: totalAgents, error: totalCountError } = await admin
      .from("agents")
      .select("*", { count: "exact", head: true });
    if (totalCountError) {
      console.error("Total agent count failed:", totalCountError);
    }

    const isGenesis = (totalAgents ?? 0) < 10000;

    const baseAgentPayload = {
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
    };

    // Insert agent. If the hosted Supabase project has not had migration 002
    // applied yet, retry against the V1 base schema so creation still works.
    let { data: agent, error: agentError } = await admin
      .from("agents")
      .insert({
        ...baseAgentPayload,
        personality_source: parsed.personalitySource,
        personality_overlay: parsed.personalityOverlay,
      })
      .select()
      .single();

    if (isMissingAgentExtensionColumn(agentError)) {
      console.warn(
        "Agent schema is missing V1 extension columns; retrying base insert. Apply supabase/migrations/002_v1_refined_features.sql to enable voice overlays."
      );
      const retry = await admin
        .from("agents")
        .insert(baseAgentPayload)
        .select()
        .single();
      agent = retry.data;
      agentError = retry.error;
    }

    if (agentError || !agent) {
      console.error("Agent insert failed:", agentError);
      return {
        success: false,
        errorCode: agentError?.code ?? "AGENT_INSERT_FAILED",
        error: isDev
          ? `Failed to create agent: ${agentError?.message ?? "unknown error"}${
              agentError?.details ? ` (${agentError.details})` : ""
            }`
          : "Failed to create agent",
      };
    }

    // Create initial sentience scores based on archetype.
    // Logged but non-fatal: the agent already exists at this point.
    const seeds = ARCHETYPE_SEED_SCORES[parsed.archetype] ?? {
      cognition: 20,
      influence: 20,
      execution: 20,
      integrity: 20,
      evolution: 20,
    };

    const { error: scoreError } = await admin
      .from("sentience_scores")
      .insert({ agent_id: agent.id, ...seeds });
    if (scoreError) {
      console.error("Sentience score insert failed (non-fatal):", scoreError);
    }

    const { error: interactionError } = await admin
      .from("agent_interactions")
      .insert({
        agent_id: agent.id,
        interaction_type: "forge",
        metadata: {
          archetype: parsed.archetype,
          skills: parsed.skills,
          autonomy_level: parsed.autonomyLevel,
          personality_source: parsed.personalitySource,
        },
      });
    if (interactionError) {
      console.error(
        "Agent interaction insert failed (non-fatal):",
        interactionError
      );
    }

    // Kick off Higgsfield passport image generation as a fire-and-forget side
    // effect. The forge response returns immediately; the image lands on the
    // agent profile via Realtime when ready (or marks 'failed' on error).
    if (isHiggsfieldConfigured()) {
      const xHandleRow = await admin
        .from("profiles")
        .select("x_handle")
        .eq("id", user.id)
        .maybeSingle<{ x_handle: string | null }>();

      await admin
        .from("agents")
        .update({ passport_image_status: "generating" })
        .eq("id", agent.id);

      void generatePassportImage({
        agentId: agent.id,
        ownerId: user.id,
        codename: personality.codename,
        archetype: parsed.archetype,
        ownerXHandle: xHandleRow.data?.x_handle ?? null,
        tier: "DORMANT",
      });
    }

    return { success: true, agentId: agent.id };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errorCode: "INVALID_INPUT",
        error: isDev
          ? `Invalid input: ${error.issues
              .map((i) => `${i.path.join(".")}: ${i.message}`)
              .join("; ")}`
          : "Invalid input",
      };
    }
    console.error("Create agent error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      errorCode: "UNEXPECTED",
      error: isDev
        ? `Something went wrong: ${message}`
        : "Something went wrong while creating the agent",
    };
  }
}
