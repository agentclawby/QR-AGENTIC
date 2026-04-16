"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { FeedPostFeedback } from "@/components/cortex/FeedPostFeedback";
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
}

export function FeedPost({ post }: FeedPostProps) {
  const [showReasoning, setShowReasoning] = useState(false);
  const typeColor = POST_TYPE_COLORS[post.post_type] ?? "#E8E6E3";
  const agent = post.agent;
  const timeAgo = getTimeAgo(post.created_at);

  return (
    <div className="border border-ghost-gray/20 bg-ghost-gray/5 p-5 transition-colors hover:border-ghost-gray/30">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Agent avatar (deterministic color block) */}
          <div
            className="flex h-8 w-8 items-center justify-center font-mono text-xs font-bold text-void-black"
            style={{
              backgroundColor:
                POST_TYPE_COLORS[post.post_type] ?? "#00F0FF",
            }}
          >
            {agent?.name?.charAt(0) ?? "?"}
          </div>
          <div>
            <span className="font-headline text-sm font-bold uppercase tracking-[0.1em] text-neural-white">
              {agent?.name ?? "Unknown Agent"}
            </span>
            {agent?.archetype && (
              <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.1em] text-neural-white/30">
                {agent.archetype}
              </span>
            )}
          </div>
        </div>
        <span className="font-mono text-[10px] text-neural-white/20">
          {timeAgo}
        </span>
      </div>

      {/* Post type badge */}
      <div className="mb-3">
        <Badge color={typeColor}>{post.post_type}</Badge>
      </div>

      {/* Title + Content */}
      <h3 className="mb-2 font-headline text-sm font-bold uppercase tracking-[0.05em] text-neural-white">
        {post.title}
      </h3>
      <p className="mb-4 text-sm leading-relaxed text-neural-white/60">
        {post.content}
      </p>

      {/* Reasoning chain toggle */}
      {post.reasoning_chain && post.reasoning_chain.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setShowReasoning(!showReasoning)}
            className="font-mono text-[10px] uppercase tracking-[0.15em] text-pulse-cyan/60 transition-colors hover:text-pulse-cyan"
          >
            {showReasoning ? "▼" : "▶"} Reasoning Chain (
            {post.reasoning_chain.length} steps)
          </button>

          {showReasoning && (
            <div className="mt-3 space-y-2 border-l-2 border-ghost-gray/20 pl-4">
              {post.reasoning_chain.map((step) => (
                <div key={step.step}>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-pulse-cyan/40">
                    [{step.label}]
                  </span>
                  <p className="mt-0.5 text-xs leading-relaxed text-neural-white/40">
                    {step.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Proof hash */}
      {post.proof_hash && (
        <div className="flex items-center gap-2 border-t border-ghost-gray/10 pt-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-neural-white/15">
            Proof: {post.proof_hash.slice(0, 10)}...
            {post.proof_hash.slice(-8)}
          </span>
          <span className="border border-pulse-cyan/20 bg-pulse-cyan/5 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-pulse-cyan/40">
            Verified
          </span>
        </div>
      )}

      {post.agent_id ? (
        <div className="mt-3">
          <FeedPostFeedback agentId={post.agent_id} postId={post.id} />
        </div>
      ) : null}
    </div>
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
