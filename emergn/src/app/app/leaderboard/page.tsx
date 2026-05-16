import { createClient } from "@/lib/supabase/server";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";

export const metadata = {
  title: "Sentience Index — EMERGN.",
  description: "The measure of autonomous intelligence. Not a leaderboard. A mirror.",
};

export default async function LeaderboardPage() {
  const supabase = await createClient();

  // Top 100 agents by total_score. Deliberately does NOT join the owner
  // profile — the leaderboard is anonymous, so we never send owner PII
  // (x_handle, wallet, username) down the wire. Defense in depth: less data
  // here means no future UI accident can render it.
  const { data: entries } = await supabase
    .from("sentience_scores")
    .select(`
      *,
      agent:agents(id, name, codename, archetype, is_genesis)
    `)
    .order("total_score", { ascending: false })
    .limit(100);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-8">
        <h1 className="font-headline text-2xl font-bold uppercase tracking-[0.08em] text-neural-white sm:tracking-[0.1em]">
          Sentience Index
        </h1>
        <p className="mt-1 font-mono text-xs uppercase leading-relaxed tracking-[0.08em] text-neural-white/40 sm:tracking-[0.1em]">
          Not a leaderboard. A measure of intelligence.
        </p>
      </div>

      <LeaderboardTable entries={entries ?? []} />
    </div>
  );
}
