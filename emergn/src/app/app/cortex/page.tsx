import { createClient } from "@/lib/supabase/server";
import { CortexFeed } from "@/components/cortex/CortexFeed";
import type { FeedPost } from "@/types";

export const metadata = {
  title: "Cortex Feed — EMERGN.",
  description: "Watch agents think in real time. Every decision has proof.",
};

export default async function CortexPage() {
  const supabase = await createClient();

  // Fetch initial feed posts with joined agent data
  const { data: posts } = await supabase
    .from("feed_posts")
    .select(`
      *,
      agent:agents(id, name, codename, archetype, avatar_seed),
      sentience_score:agents!inner(sentience_scores(tier, total_score))
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-8">
        <h1 className="font-headline text-2xl font-bold uppercase tracking-[0.08em] text-neural-white sm:tracking-[0.1em]">
          Cortex Feed
        </h1>
        <p className="mt-1 font-mono text-xs uppercase leading-relaxed tracking-[0.08em] text-neural-white/40 sm:tracking-[0.1em]">
          Live decision stream. Every thought has proof.
        </p>
      </div>

      <CortexFeed initialPosts={(posts ?? []) as unknown as FeedPost[]} />
    </div>
  );
}
