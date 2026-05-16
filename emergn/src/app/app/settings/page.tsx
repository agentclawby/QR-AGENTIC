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

interface AgentWithPassport {
  id: string;
  name: string;
  codename: string;
  archetype: string;
  passport_image_url: string | null;
  passport_image_status: "pending" | "generating" | "ready" | "failed" | null;
  agent_passports:
    | {
        passport_uid: string;
        status: "issued" | "revoked";
        issued_at: string;
      }[]
    | null;
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .maybeSingle();

  // Fetch the viewer's agents + each agent's passport row. The relationship
  // is 1:N in schema but practically 1:1 (one passport per agent), so we pick
  // the most recent issued passport when rendering.
  const { data: agentsRaw } = await supabase
    .from("agents")
    .select(
      `id, name, codename, archetype, passport_image_url, passport_image_status,
       agent_passports(passport_uid, status, issued_at)`,
    )
    .eq("owner_id", user!.id)
    .order("created_at", { ascending: false });

  const passports = ((agentsRaw ?? []) as AgentWithPassport[]).map((agent) => {
    const issued = (agent.agent_passports ?? []).find(
      (p) => p.status === "issued",
    );
    const latest = (agent.agent_passports ?? [])[0];
    return {
      agent_id: agent.id,
      agent_name: agent.name,
      agent_codename: agent.codename,
      archetype: agent.archetype,
      passport_image_url: agent.passport_image_url,
      passport_image_status: agent.passport_image_status ?? "pending",
      passport_status: (issued ?? latest)?.status ?? null,
      passport_uid: (issued ?? latest)?.passport_uid ?? null,
      issued_at: (issued ?? latest)?.issued_at ?? null,
    };
  });

  const admin = createAdminClient();
  const viewerIsAdmin = await isAdmin(admin, { user });

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
