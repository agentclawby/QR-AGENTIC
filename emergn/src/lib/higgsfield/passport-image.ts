// Orchestrates: build prompt → submit Higgsfield job → poll → download →
// upload to Supabase Storage → patch agents.passport_image_url.
//
// Designed to be called fire-and-forget from server actions (the forge flow)
// or synchronously from API routes (passport issue fallback). All errors are
// caught and surfaced as `passport_image_status='failed'` so the UI can react.

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  checkBudget,
  downloadResult,
  isHiggsfieldConfigured,
  pollUntilReady,
  submitImage,
} from "./client";
import { buildPassportPrompt, type PassportPromptInput } from "./passport-prompt";

const STORAGE_BUCKET = "passports";

export interface GeneratePassportInput extends PassportPromptInput {
  agentId: string;
  ownerId: string;
}

export interface GeneratePassportResult {
  status: "ready" | "failed" | "skipped";
  url?: string;
  reason?: string;
}

// Owner-scoped status mutation. Defense-in-depth: even if a caller passes a
// stale or attacker-controlled agentId, the WHERE on owner_id prevents writes
// to a different user's agent. Service-role bypasses RLS, so this filter is
// our only safety net on this code path.
async function setStatus(
  agentId: string,
  ownerId: string,
  status: "generating" | "ready" | "failed",
  url?: string | null
) {
  const admin = createAdminClient();
  const patch: Record<string, unknown> = { passport_image_status: status };
  if (url !== undefined) patch.passport_image_url = url;
  await admin
    .from("agents")
    .update(patch)
    .eq("id", agentId)
    .eq("owner_id", ownerId);
}

export async function markGenerating(agentId: string, ownerId: string) {
  await setStatus(agentId, ownerId, "generating");
}

export async function generatePassportImage(
  input: GeneratePassportInput
): Promise<GeneratePassportResult> {
  if (!isHiggsfieldConfigured()) {
    return { status: "skipped", reason: "Higgsfield not configured" };
  }
  const budget = await checkBudget();
  if (!budget.ok) {
    await setStatus(input.agentId, input.ownerId, "failed");
    return { status: "failed", reason: budget.reason };
  }

  try {
    await setStatus(input.agentId, input.ownerId, "generating");

    const prompt = buildPassportPrompt(input);
    const jobId = await submitImage({ prompt });

    const job = await pollUntilReady(jobId);
    if (!job.result_url) throw new Error("Higgsfield job completed without result_url");

    const buffer = await downloadResult(job.result_url);
    const admin = createAdminClient();
    const objectPath = `${input.agentId}.png`;

    const { error: uploadErr } = await admin.storage
      .from(STORAGE_BUCKET)
      .upload(objectPath, buffer, {
        contentType: "image/png",
        upsert: true,
        cacheControl: "3600",
      });
    if (uploadErr) throw uploadErr;

    const { data: pub } = admin.storage.from(STORAGE_BUCKET).getPublicUrl(objectPath);
    const publicUrl = pub.publicUrl;

    await setStatus(input.agentId, input.ownerId, "ready", publicUrl);

    // agent_interactions has no user_id column — owner context is denormalised
    // onto the row in migration 011 (so RLS doesn't subquery agents per row),
    // and also written to metadata for human/audit visibility.
    await admin.from("agent_interactions").insert({
      agent_id: input.agentId,
      owner_id: input.ownerId,
      interaction_type: "passport_image_generated",
      metadata: {
        owner_id: input.ownerId,
        job_id: jobId,
        result_url: publicUrl,
      },
    });

    return { status: "ready", url: publicUrl };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error("[higgsfield] passport image generation failed:", reason);
    await setStatus(input.agentId, input.ownerId, "failed");
    return { status: "failed", reason };
  }
}
