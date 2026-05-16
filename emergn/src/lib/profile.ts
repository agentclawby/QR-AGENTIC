import type { SupabaseClient, User } from "@supabase/supabase-js";

interface ProviderIdentityData {
  user_name?: string;
  preferred_username?: string;
  full_name?: string;
  name?: string;
  avatar_url?: string;
  picture?: string;
}

function readTwitterIdentity(user: User): ProviderIdentityData | null {
  const identities = (user.identities ?? []) as Array<{
    provider?: string;
    identity_data?: ProviderIdentityData;
  }>;
  const twitter = identities.find(
    (id) => id.provider === "x" || id.provider === "twitter"
  );
  return twitter?.identity_data ?? null;
}

/**
 * Resyncs the user's profile row from the freshest auth metadata. Twitter
 * OAuth + linkIdentity puts the X handle in identities[].identity_data, but
 * the on_auth_user_created trigger only runs once at sign-up, so a user who
 * links X *after* signing up via wallet ends up with x_handle = NULL forever.
 *
 * Call this from /auth/callback after a successful exchangeCodeForSession or
 * verifyOtp. It only writes columns that are currently null/empty so it never
 * overwrites a value the user typed manually in Settings.
 */
export async function syncProfileFromAuth(
  admin: SupabaseClient,
  user: User
): Promise<void> {
  const twitter = readTwitterIdentity(user);
  const meta = (user.user_metadata ?? {}) as ProviderIdentityData;

  const xHandle =
    twitter?.user_name ??
    twitter?.preferred_username ??
    meta.user_name ??
    meta.preferred_username ??
    null;
  const username = xHandle ?? meta.user_name ?? meta.preferred_username ?? null;
  const displayName = twitter?.full_name ?? twitter?.name ?? meta.full_name ?? meta.name ?? null;
  const avatarUrl = twitter?.avatar_url ?? twitter?.picture ?? meta.avatar_url ?? meta.picture ?? null;

  let { data: existing } = await admin
    .from("profiles")
    .select("id, x_handle, username, display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  // Self-heal: SIWS wallet users created via admin.createUser() skip the
  // on_auth_user_created trigger. Create a baseline row, then re-read so the
  // X-identity update block below can still fill empty columns. Previous
  // behaviour returned early after the baseline insert, which meant a
  // wallet-first user who later linked X had x_handle = NULL forever.
  if (!existing) {
    await ensureUserProfile(admin, user);
    const { data: reread } = await admin
      .from("profiles")
      .select("id, x_handle, username, display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    existing = reread;
  }

  if (!existing) {
    // ensureUserProfile + re-read both failed — surface to caller log, don't
    // throw (this path runs from /auth/callback which should still complete).
    console.error("syncProfileFromAuth could not establish profile row", {
      userId: user.id,
    });
    return;
  }

  const updates: Record<string, string | null> = {};
  if (xHandle && !existing.x_handle) updates.x_handle = xHandle;
  if (username && !existing.username) updates.username = username;
  if (displayName && !existing.display_name) updates.display_name = displayName;
  if (avatarUrl && !existing.avatar_url) updates.avatar_url = avatarUrl;

  if (Object.keys(updates).length === 0) return;

  const { error } = await admin
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) {
    // Code 23505 = unique_violation. Migration 008 adds a unique index on
    // lower(x_handle); a collision means the same X account is already linked
    // to another Supabase user. Surface this so the auth callback can show a
    // friendly redirect instead of crashing.
    if (error.code === "23505") {
      const conflictError = new Error("x_handle_already_linked");
      (conflictError as Error & { code?: string }).code = "x_handle_already_linked";
      throw conflictError;
    }
    console.error("syncProfileFromAuth update failed", { userId: user.id, error });
  }
}

/**
 * Lazy-creates a profiles row for the authenticated user if one is missing.
 *
 * Migration 001 has an `on_auth_user_created` trigger that should auto-create
 * a profile when a user signs up via Supabase. In practice this trigger does
 * not always fire — for example, when admin.createUser() is used by the SIWS
 * verify route, or when an account predates the trigger. Routes that depend
 * on the profiles FK (user_credit_balances, agents, etc.) hit foreign-key
 * violations in that case.
 *
 * Calling this helper before any FK-bound write makes the system self-healing
 * for those users without requiring them to re-sign-up.
 *
 * Uses the admin (service-role) client so it works even before RLS-bound
 * profile reads succeed.
 */
export async function ensureUserProfile(
  admin: SupabaseClient,
  user: User
): Promise<void> {
  const { error } = await admin
    .from("profiles")
    .upsert(
      {
        id: user.id,
        username:
          (user.user_metadata?.user_name as string | undefined) ??
          (user.user_metadata?.preferred_username as string | undefined) ??
          null,
        display_name:
          (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name as string | undefined) ??
          null,
        avatar_url:
          (user.user_metadata?.avatar_url as string | undefined) ?? null,
        x_handle:
          (user.user_metadata?.user_name as string | undefined) ?? null,
        wallet_address:
          (user.user_metadata?.wallet_address as string | undefined) ?? null,
      },
      { onConflict: "id", ignoreDuplicates: true }
    );

  if (error) {
    // Don't throw on conflict-skip; do throw on real failures so the caller
    // surfaces the issue instead of cascading into an FK violation later.
    console.error("ensureUserProfile failed", { userId: user.id, error });
    throw new Error(`Failed to ensure profile row: ${error.message}`);
  }
}
