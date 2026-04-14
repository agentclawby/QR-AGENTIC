import { createClient } from "@/lib/supabase/server";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";

export const metadata = {
  title: "Sentience Index — EMERGN.",
  description: "The measure of autonomous intelligence. Not a leaderboard. A mirror.",
};

export default async function LeaderboardPage() {
  const supabase = await createClient();

  // Fetch top 100 agents by total_score with agent details
  const { data: entries } = await supabase
    .from("sentience_scores")
    .select(`
      *,
      agent:agents(id, name, codename, archetype, owner_id, is_genesis,
        owner:profiles(username, x_handle, wallet_address)
      )
    `)
    .order("total_score", { ascending: false })
    .limit(100);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-headline text-2xl font-bold uppercase tracking-[0.1em] text-neural-white">
          Sentience Index
        </h1>
        <p className="mt-1 font-mono text-xs uppercase tracking-[0.1em] text-neural-white/40">
          Not a leaderboard. A measure of intelligence.
        </p>
      </div>

      <LeaderboardTable entries={entries ?? []} />
    </div>
  );
}
