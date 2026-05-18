import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { LinkedAccounts } from "@/components/settings/LinkedAccounts";
import { IntegrationReadiness } from "@/components/settings/IntegrationReadiness";
import { SettingsPassports } from "@/components/settings/SettingsPassports";
import type { Profile } from "@/types";

export const metadata = {
  title: "Settings — EMERGN.",
};

export default async function SettingsPage() {
  console.log("[settings] render start");
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("[settings] no authenticated user:", userError);
    throw new Error("Not authenticated");
  }

  console.log("[settings] user resolved:", user.id);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[settings] profile fetch failed:", profileError);
  }

  console.log("[settings] profile fetched:", Boolean(profile));

  // Fetch agents and passports as separate queries — the previous joined
  // select had a `agent_passports(...)` relation embed which can fail
  // silently if the FK or RLS isn't aligned. Splitting them isolates failures.
  const { data: agentsList, error: agentsError } = await supabase
    .from("agents")
    .select("id, name, codename, archetype, passport_image_url, passport_image_status")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (agentsError) {
    console.error("[settings] agents fetch failed:", agentsError);
  }

  console.log("[settings] agents fetched:", agentsList?.length ?? 0);

  let passportsByAgent: Record<
    string,
    { passport_uid: string; status: "issued" | "revoked"; issued_at: string }[]
  > = {};

  if (agentsList && agentsList.length > 0) {
    const agentIds = agentsList.map((a) => a.id);
    const { data: passportRows, error: passportError } = await supabase
      .from("agent_passports")
      .select("agent_id, passport_uid, status, issued_at")
      .in("agent_id", agentIds);

    if (passportError) {
      console.error("[settings] passport fetch failed:", passportError);
    }

    passportsByAgent = (passportRows ?? []).reduce(
      (acc, row) => {
        const list = acc[row.agent_id] ?? [];
        list.push({
          passport_uid: row.passport_uid,
          status: row.status,
          issued_at: row.issued_at,
        });
        acc[row.agent_id] = list;
        return acc;
      },
      {} as typeof passportsByAgent,
    );
  }

  const passports = (agentsList ?? []).map((agent) => {
    const rows = passportsByAgent[agent.id] ?? [];
    const issued = rows.find((p) => p.status === "issued");
    const latest = rows[0];
    return {
      agent_id: agent.id,
      agent_name: agent.name ?? "Unnamed agent",
      agent_codename: agent.codename ?? "",
      archetype: agent.archetype ?? "GHOST",
      passport_image_url: agent.passport_image_url,
      passport_image_status: agent.passport_image_status ?? "pending",
      passport_status: (issued ?? latest)?.status ?? null,
      passport_uid: (issued ?? latest)?.passport_uid ?? null,
      issued_at: (issued ?? latest)?.issued_at ?? null,
    };
  });

  console.log("[settings] passports mapped:", passports.length);

  let viewerIsAdmin = false;
  try {
    const admin = createAdminClient();
    viewerIsAdmin = await isAdmin(admin, { user });
  } catch (error) {
    console.error("[settings] admin check failed:", error);
  }

  if (!profile) {
    console.error("[settings] profile row missing for user:", user.id);
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="font-headline text-2xl font-bold uppercase tracking-[0.08em] text-neural-white sm:tracking-[0.1em]">
            Settings
          </h1>
          <p className="mt-1 font-mono text-xs uppercase leading-relaxed tracking-[0.08em] text-ember-orange/80 sm:tracking-[0.1em]">
            Profile not initialized yet — please reload, or sign out and back in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="font-headline text-2xl font-bold uppercase tracking-[0.08em] text-neural-white sm:tracking-[0.1em]">
          Settings
        </h1>
        <p className="mt-1 font-mono text-xs uppercase leading-relaxed tracking-[0.08em] text-neural-white/40 sm:tracking-[0.1em]">
          Manage your identity and connections.
        </p>
      </div>

      <div className="space-y-8">
        <ProfileForm profile={profile as Profile} />
        <LinkedAccounts profile={profile as Profile} />
        <SettingsPassports passports={passports} />
        {viewerIsAdmin ? <IntegrationReadiness /> : null}
      </div>
    </div>
  );
}
