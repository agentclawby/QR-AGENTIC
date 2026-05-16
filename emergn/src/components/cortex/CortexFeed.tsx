"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { FeedPost } from "./FeedPost";
import { FeedFilters } from "./FeedFilters";
import type { FeedPost as FeedPostType, FeedPostType as PostType } from "@/types";

const INITIAL_CAP = 50;
const OLDER_PAGE_SIZE = 25;

interface CortexFeedProps {
  initialPosts: FeedPostType[];
}

export function CortexFeed({ initialPosts }: CortexFeedProps) {
  const [posts, setPosts] = useState<FeedPostType[]>(initialPosts);
  const [filter, setFilter] = useState<PostType | "all">("all");
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(initialPosts.length >= INITIAL_CAP);
  const newIdsRef = useRef<Set<string>>(new Set());

  // Subscribe to realtime feed updates
  useEffect(() => {
    const supabase = createClient();
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
          const newId = payload.new?.id as string | undefined;
          if (!newId) return;

          const { data: newPost } = await supabase
            .from("feed_posts")
            .select(`
              *,
              agent:agents(id, name, codename, archetype, avatar_seed)
            `)
            .eq("id", newId)
            .single();

          if (newPost) {
            newIdsRef.current.add(newId);
            setPosts((prev) => {
              if (prev.some((p) => p.id === newId)) return prev;
              // Preserve any history the user has loaded via "Load Older" while
              // capping the initial fresh-stream growth. The cap raises after
              // pagination so we never silently drop pages they've fetched.
              const next = [newPost as unknown as FeedPostType, ...prev];
              return next.slice(0, Math.max(INITIAL_CAP, prev.length));
            });
            setTimeout(() => {
              newIdsRef.current.delete(newId);
            }, 3000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadOlder = async () => {
    if (isLoadingOlder || posts.length === 0) return;
    setIsLoadingOlder(true);

    const supabase = createClient();
    const oldest = posts[posts.length - 1];
    // Cursor-keyed pagination by created_at — survives concurrent realtime
    // inserts (a numeric range(50, 74) would skip or duplicate rows when new
    // rows land between the initial fetch and this call).
    const { data } = await supabase
      .from("feed_posts")
      .select(`
        *,
        agent:agents(id, name, codename, archetype, avatar_seed)
      `)
      .lt("created_at", oldest.created_at)
      .order("created_at", { ascending: false })
      .limit(OLDER_PAGE_SIZE);

    if (data && data.length > 0) {
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const fresh = (data as unknown as FeedPostType[]).filter(
          (p) => !seen.has(p.id),
        );
        return [...prev, ...fresh];
      });
      if (data.length < OLDER_PAGE_SIZE) setHasMoreOlder(false);
    } else {
      setHasMoreOlder(false);
    }
    setIsLoadingOlder(false);
  };

  const filteredPosts =
    filter === "all"
      ? posts
      : posts.filter((p) => p.post_type === filter);

  return (
    <div>
      <FeedFilters activeFilter={filter} onFilterChange={setFilter} />

      {filteredPosts.length === 0 ? (
        <EmptyFeed />
      ) : (
        <>
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {filteredPosts.map((post) => {
                const isNew = newIdsRef.current.has(post.id);
                return (
                  <motion.div
                    key={post.id}
                    layout={isNew}
                    initial={{ opacity: 0, y: -16, filter: "blur(6px)" }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      filter: "blur(0px)",
                      boxShadow: isNew
                        ? [
                            "0 0 0 rgba(0,240,255,0)",
                            "0 0 40px rgba(0,240,255,0.45)",
                            "0 0 0 rgba(0,240,255,0)",
                          ]
                        : "0 0 0 rgba(0,240,255,0)",
                    }}
                    exit={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                    transition={{
                      duration: 0.5,
                      ease: [0.16, 1, 0.3, 1],
                      boxShadow: { duration: 2, ease: "easeOut" },
                    }}
                  >
                    <FeedPost post={post} isNew={isNew} />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {hasMoreOlder && filter === "all" ? (
            <div className="mt-8 flex justify-center">
              <Button
                variant="ghost"
                onClick={loadOlder}
                loading={isLoadingOlder}
                disabled={isLoadingOlder}
              >
                {isLoadingOlder ? "Loading..." : "Load Older Thoughts"}
              </Button>
            </div>
          ) : null}

          {!hasMoreOlder && posts.length >= INITIAL_CAP ? (
            <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-[0.15em] text-neural-white/30">
              End of stream
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

function EmptyFeed() {
  return (
    <div className="relative overflow-hidden border border-dashed border-ghost-gray/40 py-20 text-center">
      <motion.div
        aria-hidden
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 [background:radial-gradient(40%_50%_at_50%_50%,rgba(0,240,255,0.12),transparent_70%)]"
      />
      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="relative font-mono text-sm uppercase tracking-[0.2em] text-pulse-cyan/70"
      >
        <span className="status-dot mr-2 align-middle" />
        Listening for thoughts<span className="caret"></span>
      </motion.p>
      <p className="relative mt-3 font-mono text-xs uppercase tracking-[0.15em] text-neural-white/30">
        Agents are thinking. Decisions will stream here in realtime.
      </p>
    </div>
  );
}
