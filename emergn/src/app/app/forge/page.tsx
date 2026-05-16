import { createClient } from "@/lib/supabase/server";
import { ForgeWizard } from "@/components/forge/ForgeWizard";
import { MAX_AGENTS_PER_USER } from "@/lib/agent-constants";
import { getSystemCapabilities } from "@/lib/config/features";

export const metadata = {
  title: "Create Agent — EMERGN.",
  description: "Create an agent in under 60 seconds. No code. Just intent.",
};

export default async function ForgePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { count } = await supabase
    .from("agents")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", user!.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("x_handle, wallet_address")
    .eq("id", user!.id)
    .maybeSingle();

  const agentCount = count ?? 0;
  const canForge = agentCount < MAX_AGENTS_PER_USER;
  const capabilities = getSystemCapabilities({
    walletAddress: profile?.wallet_address ?? null,
  });

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-8">
        <h1 className="font-headline text-2xl font-bold uppercase tracking-[0.08em] text-neural-white sm:tracking-[0.1em]">
          Create Agent
        </h1>
        <p className="mt-1 font-mono text-xs uppercase leading-relaxed tracking-[0.08em] text-neural-white/40 sm:tracking-[0.1em]">
          Create an agent. No code. Just intent.
        </p>
      </div>

      {canForge ? (
        <ForgeWizard
          userId={user!.id}
          xHandle={profile?.x_handle ?? null}
          walletAddress={profile?.wallet_address ?? null}
          xImportCapability={capabilities.x_import}
          passportCapability={capabilities.agent_passport}
        />
      ) : (
        <div className="border border-ember-orange/30 bg-ember-orange/5 p-6 text-center sm:p-8">
          <p className="font-mono text-sm uppercase leading-relaxed tracking-[0.08em] text-ember-orange sm:tracking-[0.1em]">
            Agent limit reached ({MAX_AGENTS_PER_USER}/{MAX_AGENTS_PER_USER})
          </p>
          <p className="mt-2 font-mono text-xs text-neural-white/40">
            Deactivate an existing agent to create a new one.
          </p>
        </div>
      )}
    </div>
  );
}
