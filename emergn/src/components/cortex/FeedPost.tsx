"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { FeedPostFeedback } from "@/components/cortex/FeedPostFeedback";
import { staggerFast, fadeInUpSoft } from "@/lib/animations";
import type { FeedPost as FeedPostType } from "@/types";

const POST_TYPE_COLORS: Record<string, string> = {
  decision: "#00F0FF",
  analysis: "#8B5CF6",
  trade: "#FF6B35",
  thought: "#E8E6E3",
  consultation: "#00B4D8",
  content: "#A3E635",
  portfolio: "#F59E0B",
};

interface FeedPostProps {
  post: FeedPostType;
  isNew?: boolean;
}

export function FeedPost({ post, isNew = false }: FeedPostProps) {
  const [showReasoning, setShowReasoning] = useState(false);
  const typeColor = POST_TYPE_COLORS[post.post_type] ?? "#E8E6E3";
  const agent = post.agent;
  const timeAgo = getTimeAgo(post.created_at);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className="group relative overflow-hidden border border-ghost-gray/30 bg-ghost-gray/5 p-4 transition-colors hover:border-pulse-cyan/30 hover:bg-ghost-gray/10 sm:p-5"
      style={{
        borderLeftColor: typeColor,
        borderLeftWidth: "2px",
      }}
    >
      {/* hover halo */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `linear-gradient(90deg, ${typeColor}10 0%, transparent 70%)`,
        }}
      />

      {/* Header */}
      <div className="relative mb-3 flex flex-col items-start justify-between gap-3 sm:flex-row">
        <div className="flex min-w-0 items-center gap-3">
          <motion.div
            initial={false}
            animate={isNew ? { scale: [1, 1.18, 1] } : { scale: 1 }}
            transition={{ duration: 0.8, repeat: isNew ? 2 : 0, ease: "easeInOut" }}
            className="flex h-9 w-9 shrink-0 items-center justify-center font-mono text-xs font-bold text-void-black"
            style={{
              backgroundColor: typeColor,
              boxShadow: `0 0 18px ${typeColor}80`,
            }}
          >
            {agent?.name?.charAt(0) ?? "?"}
          </motion.div>
          <div className="min-w-0">
            <span className="break-words font-headline text-sm font-bold uppercase tracking-[0.08em] text-neural-white sm:tracking-[0.1em]">
              {agent?.name ?? "Unknown Agent"}
            </span>
            {agent?.archetype && (
              <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.08em] text-neural-white/40 sm:tracking-[0.1em]">
                {agent.archetype}
              </span>
            )}
          </div>
        </div>
        <span className="shrink-0 font-mono text-[10px] text-neural-white/40">{timeAgo}</span>
      </div>

      {/* Post type badge */}
      <div className="relative mb-3">
        <Badge color={typeColor} pulse={isNew} dot>
          {post.post_type}
        </Badge>
      </div>

      {/* Title + Content */}
      <h3 className="relative mb-2 break-words font-headline text-sm font-bold uppercase tracking-[0.05em] text-neural-white">
        {post.title}
      </h3>
      <p className="relative mb-4 text-sm leading-relaxed text-neural-white/70">
        {post.content}
      </p>

      {/* Reasoning chain toggle */}
      {post.reasoning_chain && post.reasoning_chain.length > 0 && (
        <div className="relative mb-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowReasoning(!showReasoning)}
            className="text-left font-mono text-[10px] uppercase leading-relaxed tracking-[0.1em] text-pulse-cyan/70 transition-colors hover:text-pulse-cyan sm:tracking-[0.15em]"
          >
            <motion.span
              animate={{ rotate: showReasoning ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="mr-1 inline-block"
            >
              ▶
            </motion.span>
            Reasoning Chain ({post.reasoning_chain.length} steps)
          </motion.button>

          <AnimatePresence initial={false}>
            {showReasoning && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <motion.div
                  variants={staggerFast}
                  initial="hidden"
                  animate="visible"
                  className="mt-3 space-y-2 border-l-2 border-pulse-cyan/30 pl-4"
                >
                  {post.reasoning_chain.map((step) => (
                    <motion.div key={step.step} variants={fadeInUpSoft}>
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-pulse-cyan/70 sm:tracking-[0.15em]">
                        [{step.label}]
                      </span>
                      <p className="mt-0.5 text-xs leading-relaxed text-neural-white/55">
                        {step.content}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Proof hash */}
      {post.proof_hash && (
        <div className="relative flex flex-wrap items-center gap-2 border-t border-ghost-gray/20 pt-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-neural-white/30 sm:tracking-[0.1em]">
            Proof: {post.proof_hash.slice(0, 10)}...
            {post.proof_hash.slice(-8)}
          </span>
          <span className="border border-pulse-cyan/30 bg-pulse-cyan/5 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.08em] text-pulse-cyan/70 sm:tracking-[0.1em]">
            Verified
          </span>
        </div>
      )}

      {post.agent_id ? (
        <div className="relative mt-3">
          <FeedPostFeedback agentId={post.agent_id} postId={post.id} />
        </div>
      ) : null}
    </motion.div>
  );
}

function getTimeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
