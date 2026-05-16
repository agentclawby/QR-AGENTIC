// Server-only Higgsfield REST client.
//
// Auth is the long-lived bearer token from `~/.config/higgsfield/credentials.json`
// (mint with `higgsfield auth login`). Set HIGGSFIELD_API_KEY in the environment.
//
// Endpoints discovered by inspecting the official Go CLI:
//   POST /agents/jobs                  body: {job_set_type, params}     -> [id]
//   GET  /agents/jobs/{id}             -> {id, status, result_url}
//   GET  /agents/balance               -> {credits}
//
// Status terminal values: "completed" | "failed" | "cancelled".

import "server-only";

const DEFAULT_BASE = "https://fnf.higgsfield.ai";
const DEFAULT_MODEL = "gpt_image_2";
const POLL_INTERVAL_MS = 4000;
const POLL_TIMEOUT_MS = 4 * 60 * 1000;

export interface HiggsfieldJob {
  id: string;
  status: "queued" | "in_progress" | "completed" | "failed" | "cancelled" | string;
  result_url?: string | null;
  min_result_url?: string | null;
  job_set_type?: string;
  display_name?: string;
}

export interface SubmitImageOptions {
  prompt: string;
  jobSetType?: string;
  params?: Record<string, unknown>;
}

function getConfig() {
  const apiKey = process.env.HIGGSFIELD_API_KEY?.trim();
  const base = process.env.HIGGSFIELD_API_BASE?.trim() || DEFAULT_BASE;
  const model = process.env.HIGGSFIELD_MODEL_ID?.trim() || DEFAULT_MODEL;
  return { apiKey, base, model };
}

export function isHiggsfieldConfigured(): boolean {
  const { apiKey } = getConfig();
  return Boolean(apiKey && !apiKey.startsWith("PASTE_") && !apiKey.startsWith("YOUR_"));
}

async function hf<T>(
  path: string,
  init: { method?: string; body?: unknown } = {}
): Promise<T> {
  const { apiKey, base } = getConfig();
  if (!apiKey) throw new Error("HIGGSFIELD_API_KEY is not configured");

  const res = await fetch(`${base}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "emergn-server/1.0",
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Higgsfield ${path} ${res.status}: ${detail.slice(0, 240)}`);
  }
  return res.json() as Promise<T>;
}

export async function getBalance(): Promise<number> {
  const { credits } = await hf<{ credits: number }>("/agents/balance");
  return credits;
}

export async function submitImage(opts: SubmitImageOptions): Promise<string> {
  const { model } = getConfig();
  const body = {
    job_set_type: opts.jobSetType ?? model,
    params: {
      prompt: opts.prompt,
      aspect_ratio: "1:1",
      resolution: "2k",
      quality: "high",
      ...opts.params,
    },
  };
  const ids = await hf<string[]>("/agents/jobs", { method: "POST", body });
  if (!Array.isArray(ids) || !ids[0]) {
    throw new Error("Higgsfield submit returned no job id");
  }
  return ids[0];
}

export async function getJob(id: string): Promise<HiggsfieldJob> {
  return hf<HiggsfieldJob>(`/agents/jobs/${id}`);
}

export async function pollUntilReady(id: string): Promise<HiggsfieldJob> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() <= deadline) {
    const job = await getJob(id);
    if (job.status === "completed") return job;
    if (job.status === "failed" || job.status === "cancelled") {
      throw new Error(`Higgsfield job ${id} ${job.status}`);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error(`Higgsfield job ${id} timed out after ${POLL_TIMEOUT_MS}ms`);
}

export async function downloadResult(url: string): Promise<Buffer> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to download Higgsfield result ${res.status}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

// DB-backed daily budget tracker. We count `passport_image_generated` rows
// in agent_interactions over the last 24h — survives process restart,
// matches the canonical audit trail, and gives operators a real number to
// reason about. The audit row is written by the orchestrator after a
// successful render, so no separate `recordUsage()` call is needed.

import { createAdminClient } from "@/lib/supabase/admin";

export async function checkBudget(): Promise<
  { ok: true } | { ok: false; reason: string }
> {
  const limit = Number(process.env.HIGGSFIELD_DAILY_BUDGET ?? 100);
  if (!Number.isFinite(limit) || limit <= 0) return { ok: true };

  try {
    const admin = createAdminClient();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error } = await admin
      .from("agent_interactions")
      .select("id", { count: "exact", head: true })
      .eq("interaction_type", "passport_image_generated")
      .gte("created_at", since);

    if (error) {
      // Don't block users on a budget query failure — log and proceed.
      console.warn("[higgsfield] budget query failed, proceeding:", error.message);
      return { ok: true };
    }
    if ((count ?? 0) >= limit) {
      return {
        ok: false,
        reason: `Daily Higgsfield budget reached (${limit} passports / 24h)`,
      };
    }
    return { ok: true };
  } catch (err) {
    console.warn(
      "[higgsfield] budget check threw, proceeding:",
      err instanceof Error ? err.message : err
    );
    return { ok: true };
  }
}
