import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { safeGetUser } from "@/lib/supabase/safe-auth";
import { isAdmin } from "@/lib/admin";
import { AppShell } from "@/components/app/AppShell";
import type { Profile } from "@/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  // safeGetUser bounds Supabase round-trips to 2.5s + circuit-breaks when
  // the project is unreachable, so anonymous browsing never hangs the
  // request even with a flaky upstream.
  const { user } = await safeGetUser(supabase);

  // Anonymous browsing is allowed for /app, /app/cortex, /app/leaderboard,
  // /app/agent/[id], /app/tokens. Gated routes (/app/forge, /app/settings,
  // /app/admin) are handled at the middleware layer and never reach this
  // layout without a logged-in user.
  let profile: Profile | null = null;
  let viewerIsAdmin = false;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = (data ?? null) as Profile | null;

    const admin = createAdminClient();
    viewerIsAdmin = await isAdmin(admin, { user });
  }

  return (
    <AppShell profile={profile} isAdmin={viewerIsAdmin}>
      {children}
    </AppShell>
  );
}
