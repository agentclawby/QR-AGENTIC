import type { SupabaseClient, User } from "@supabase/supabase-js";

function parseEnvList(value: string | undefined, lower = false): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => {
      const trimmed = entry.trim();
      return lower ? trimmed.toLowerCase() : trimmed;
    })
    .filter(Boolean);
}

interface AdminAllowlists {
  emails: string[];
  userIds: string[];
  xHandles: string[];
  wallets: string[];
}

function readAllowlists(): AdminAllowlists {
  return {
    emails: parseEnvList(process.env.ADMIN_USER_EMAILS, true),
    userIds: parseEnvList(process.env.ADMIN_USER_IDS),
    xHandles: parseEnvList(process.env.ADMIN_X_HANDLES, true).map((h) =>
      h.replace(/^@/, ""),
    ),
    wallets: parseEnvList(process.env.ADMIN_WALLETS),
  };
}

export class AdminAccessError extends Error {
  status = 403;
  constructor(message = "Admin access required") {
    super(message);
    this.name = "AdminAccessError";
  }
}

interface IsAdminContext {
  user: Pick<User, "id" | "email"> | null | undefined;
}

// Admin = profiles.role === 'admin'
//   OR auth.email matches ADMIN_USER_EMAILS
//   OR auth.id matches ADMIN_USER_IDS
//   OR profile.x_handle matches ADMIN_X_HANDLES
//   OR profile.wallet_address matches ADMIN_WALLETS
//
// Multiple sources because Supabase auth methods produce different identifiers:
// SIWS users have synthetic <pubkey>@wallet.emergn.xyz emails, Twitter OAuth
// users may have null emails. Once a row in `profiles` has role='admin', no
// env entry is required.
export async function isAdmin(
  supabase: SupabaseClient,
  context: IsAdminContext,
): Promise<boolean> {
  const user = context.user;
  if (!user) return false;

  const allow = readAllowlists();

  if (user.email && allow.emails.includes(user.email.toLowerCase())) {
    return true;
  }
  if (allow.userIds.includes(user.id)) {
    return true;
  }

  if (allow.xHandles.length === 0 && allow.wallets.length === 0) {
    // Skip the profile lookup entirely if env doesn't reference handle/wallet —
    // we still need it for role check below.
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("role, x_handle, wallet_address")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("isAdmin: profile lookup failed", error.message);
    return false;
  }

  if (data?.role === "admin") return true;

  const handle = data?.x_handle?.toLowerCase().replace(/^@/, "") ?? null;
  if (handle && allow.xHandles.includes(handle)) return true;

  const wallet = data?.wallet_address ?? null;
  if (wallet && allow.wallets.includes(wallet)) return true;

  return false;
}

export async function requireAdmin(
  supabase: SupabaseClient,
  context: IsAdminContext,
): Promise<void> {
  const ok = await isAdmin(supabase, context);
  if (!ok) throw new AdminAccessError();
}

export interface AdminAuditEntry {
  actorId: string;
  targetUserId?: string | null;
  action: string;
  payload?: Record<string, unknown>;
}

export async function recordAdminAudit(
  supabase: SupabaseClient,
  entry: AdminAuditEntry,
): Promise<void> {
  const { error } = await supabase.from("admin_audit_log").insert({
    actor_id: entry.actorId,
    target_user_id: entry.targetUserId ?? null,
    action: entry.action,
    payload: entry.payload ?? {},
  });

  if (error) {
    console.error("recordAdminAudit: insert failed", error.message);
  }
}
