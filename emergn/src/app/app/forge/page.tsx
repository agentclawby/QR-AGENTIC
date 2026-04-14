import { createClient } from "@/lib/supabase/server";
import { ForgeWizard } from "@/components/forge/ForgeWizard";
import { MAX_AGENTS_PER_USER } from "@/lib/agent-constants";

export const metadata = {
  title: "Genesis Forge — EMERGN.",
  description: "Birth an agent in under 60 seconds. No code. Just intent.",
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

  const agentCount = count ?? 0;
  const canForge = agentCount < MAX_AGENTS_PER_USER;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-headline text-2xl font-bold uppercase tracking-[0.1em] text-neural-white">
          Genesis Forge
        </h1>
        <p className="mt-1 font-mono text-xs uppercase tracking-[0.1em] text-neural-white/40">
          Birth an agent. No code. Just intent.
        </p>
      </div>

      {canForge ? (
        <ForgeWizard />
      ) : (
        <div className="border border-ember-orange/30 bg-ember-orange/5 p-8 text-center">
          <p className="font-mono text-sm uppercase tracking-[0.1em] text-ember-orange">
            Agent limit reached ({MAX_AGENTS_PER_USER}/{MAX_AGENTS_PER_USER})
          </p>
          <p className="mt-2 font-mono text-xs text-neural-white/40">
            Deactivate an existing agent to forge a new one.
          </p>
        </div>
      )}
    </div>
  );
}
