"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureUserProfile } from "@/lib/profile";
import {
  suggestAgentNamesFromX,
  type NameSuggestion,
} from "@/lib/ai/agent-naming";

interface CacheRow {
  source_handle: string | null;
  raw_profile: { description?: string | null } | null;
  personality_overlay: string | null;
  suggested_names: NameSuggestion[] | null;
  ingested_at: string | null;
}

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface ProfileRow {
  x_handle: string | null;
  display_name: string | null;
}

export async function getAgentNameSuggestions(): Promise<{
  suggestions: NameSuggestion[];
  source: "cache" | "fresh" | "fallback";
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { suggestions: [], source: "fallback" };
  }

  const admin = createAdminClient();
  await ensureUserProfile(admin, user);

  // 1. Cache hit short-circuits everything — but only when fresh.
  const cacheRes = await admin
    .from("x_personality_cache")
    .select("source_handle, raw_profile, personality_overlay, suggested_names, ingested_at")
    .eq("profile_id", user.id)
    .maybeSingle<CacheRow>();
  const cache = cacheRes.data;

  const ingestedAt = cache?.ingested_at ? Date.parse(cache.ingested_at) : 0;
  const cacheFresh =
    Number.isFinite(ingestedAt) && Date.now() - ingestedAt < CACHE_TTL_MS;

  if (cache?.suggested_names && cache.suggested_names.length > 0 && cacheFresh) {
    return { suggestions: cache.suggested_names, source: "cache" };
  }

  // 2. Pull whatever profile context we have. Even without the X cache we can
  //    name-suggest from the handle alone — fresh signups should not block.
  const profileRes = await admin
    .from("profiles")
    .select("x_handle, display_name")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();
  const profile = profileRes.data;

  const handle = (cache?.source_handle ?? profile?.x_handle ?? "").trim();
  if (!handle) {
    return { suggestions: [], source: "fallback" };
  }

  const suggestions = await suggestAgentNamesFromX({
    xHandle: handle,
    bio: cache?.raw_profile?.description ?? profile?.display_name ?? null,
    personalityOverlay: cache?.personality_overlay ?? null,
  });

  // Persist back to cache when a row exists so subsequent forge sessions skip
  // the AI call. Don't insert a new row here — that's owned by the X-ingest
  // pipeline which writes the full profile/posts payload.
  if (cache) {
    await admin
      .from("x_personality_cache")
      .update({ suggested_names: suggestions })
      .eq("profile_id", user.id);
  }

  return { suggestions, source: "fresh" };
}
