// X OAuth token storage. Tokens come from the Supabase auth callback
// (`session.provider_token` / `provider_refresh_token`) and are written to
// `x_post_tokens` via the service role. Reads also use the service role —
// tokens never leave the server boundary.

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export interface UpsertXPostTokenInput {
  userId: string;
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: string | null;
  scope?: string | null;
  xUserId?: string | null;
  xHandle?: string | null;
}

export async function upsertXPostToken(
  admin: SupabaseClient,
  input: UpsertXPostTokenInput
) {
  const { error } = await admin.from("x_post_tokens").upsert(
    {
      user_id: input.userId,
      access_token: input.accessToken,
      refresh_token: input.refreshToken ?? null,
      expires_at: input.expiresAt ?? null,
      scope: input.scope ?? null,
      x_user_id: input.xUserId ?? null,
      x_handle: input.xHandle ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) throw error;
}

export interface XPostToken {
  user_id: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  x_user_id: string | null;
  x_handle: string | null;
}

export async function getXPostToken(
  admin: SupabaseClient,
  userId: string
): Promise<XPostToken | null> {
  const { data } = await admin
    .from("x_post_tokens")
    .select(
      "user_id, access_token, refresh_token, expires_at, x_user_id, x_handle"
    )
    .eq("user_id", userId)
    .maybeSingle<XPostToken>();
  return data ?? null;
}
