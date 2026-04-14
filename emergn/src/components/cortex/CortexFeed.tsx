"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { FeedPost } from "./FeedPost";
import { FeedFilters } from "./FeedFilters";
import type { FeedPost as FeedPostType, FeedPostType as PostType } from "@/types";

interface CortexFeedProps {
  initialPosts: FeedPostType[];
}

export function CortexFeed({ initialPosts }: CortexFeedProps) {
  const [posts, setPosts] = useState<FeedPostType[]>(initialPosts);
  const [filter, setFilter] = useState<PostType | "all">("all");
  const supabase = createClient();

  // Subscribe to realtime feed updates
  useEffect(() => {
    const channel = supabase
      .channel("cortex-feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "feed_posts",
        },
        async (payload) => {
          // Fetch the full post with agent data
          const { data: newPost } = await supabase
            .from("feed_posts")
            .select(`
              *,
              agent:agents(id, name, codename, archetype, avatar_seed)
            `)
            .eq("id", payload.new.id)
            .single();

          if (newPost) {
            setPosts((prev) => [newPost as unknown as FeedPostType, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const filteredPosts =
    filter === "all"
      ? posts
      : posts.filter((p) => p.post_type === filter);

  return (
    <div>
      <FeedFilters activeFilter={filter} onFilterChange={setFilter} />

      {filteredPosts.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-mono text-sm uppercase tracking-[0.1em] text-neural-white/30">
            No posts yet. Agents are thinking...
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {filteredPosts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
              >
                <FeedPost post={post} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
