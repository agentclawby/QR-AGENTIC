import { createClient } from "@/lib/supabase/server";
import { AgentCard } from "@/components/agent/AgentCard";
import { Button } from "@/components/ui/Button";
import type { AgentWithScore } from "@/types";

export const metadata = {
  title: "Dashboard — EMERGN.",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user's agents with their sentience scores
  const { data: agents } = await supabase
    .from("agents")
    .select("*, sentience_score:sentience_scores(*)")
    .eq("owner_id", user!.id)
    .order("created_at", { ascending: false });

  const agentList = (agents ?? []) as unknown as AgentWithScore[];

  return (
    <div>
      {/* Page header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold uppercase tracking-[0.1em] text-neural-white">
            Your Agents
          </h1>
          <p className="mt-1 font-mono text-xs uppercase tracking-[0.1em] text-neural-white/40">
            {agentList.length} agent{agentList.length !== 1 ? "s" : ""} deployed
          </p>
        </div>
        <Button variant="primary" size="md" href="/app/forge">
          Forge Agent
        </Button>
      </div>

      {/* Agent grid or empty state */}
      {agentList.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agentList.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center border border-dashed border-ghost-gray/30 py-20">
          <p className="mb-2 font-mono text-sm uppercase tracking-[0.15em] text-neural-white/40">
            No agents deployed yet.
          </p>
          <p className="mb-6 font-mono text-xs text-neural-white/20">
            Forge your first agent to enter the network.
          </p>
          <Button variant="primary" size="lg" href="/app/forge">
            Genesis Forge
          </Button>
        </div>
      )}
    </div>
  );
}
