import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { LinkedAccounts } from "@/components/settings/LinkedAccounts";
import { IntegrationReadiness } from "@/components/settings/IntegrationReadiness";
import { getSystemCapabilities } from "@/lib/config/features";
import type { Profile } from "@/types";

export const metadata = {
  title: "Settings — EMERGN.",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const capabilities = getSystemCapabilities({
    walletAddress: profile?.wallet_address ?? null,
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="font-headline text-2xl font-bold uppercase tracking-[0.1em] text-neural-white">
          Settings
        </h1>
        <p className="mt-1 font-mono text-xs uppercase tracking-[0.1em] text-neural-white/40">
          Manage your identity and connections.
        </p>
      </div>

      <div className="space-y-8">
        <ProfileForm profile={profile as Profile} />
        <LinkedAccounts profile={profile as Profile} />
        <IntegrationReadiness capabilities={capabilities} />
      </div>
    </div>
  );
}
