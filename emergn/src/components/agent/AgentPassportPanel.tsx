"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import bs58 from "bs58";
import { Button } from "@/components/ui/Button";
import { buildSolanaAuthMessage } from "@/lib/auth/solana-auth";
import { useLinkWallet } from "@/hooks/useLinkWallet";
import { cn } from "@/lib/utils";
import type { AgentArchetype, AgentPassport, TierName } from "@/types";

type PassportImageStatus = "pending" | "generating" | "ready" | "failed";

interface AgentPassportPanelProps {
  agentId: string;
  passport: AgentPassport | null;
  isOwner: boolean;
  viewerUserId: string | null;
  linkedWalletAddress: string | null;
  disabledReason?: string | null;
  agentPassportImageUrl?: string | null;
  agentPassportImageStatus?: PassportImageStatus;
  // Used to render the CSS fallback passport card when no Higgsfield image
  // is available. Optional — the panel still works without them (the card
  // falls back to generic values), but supplying them yields a real-looking
  // identity stamp instead of a blank visual.
  agentCodename?: string | null;
  agentArchetype?: AgentArchetype | string | null;
  agentTier?: TierName | string | null;
}

const ARCHETYPE_COLOR: Record<string, { hex: string; rgb: string }> = {
  ORACLE: { hex: "#00F0FF", rgb: "0,240,255" },
  HUNTER: { hex: "#FF6B35", rgb: "255,107,53" },
  SENTINEL: { hex: "#8B5CF6", rgb: "139,92,246" },
  DIPLOMAT: { hex: "#E8E6E3", rgb: "232,230,227" },
  GHOST: { hex: "#6B7280", rgb: "107,114,128" },
  EVOLVE: { hex: "#00B4D8", rgb: "0,180,216" },
};

const TIER_COLOR: Record<string, string> = {
  DORMANT: "#6B7280",
  AWARE: "#E8E6E3",
  CONSCIOUS: "#8B5CF6",
  SENTIENT: "#00F0FF",
  TRANSCENDENT: "#FF6B35",
};

function shortAddress(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function shortHash(value: string) {
  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}

export function AgentPassportPanel({
  agentId,
  passport,
  isOwner,
  viewerUserId,
  linkedWalletAddress,
  disabledReason = null,
  agentPassportImageUrl = null,
  agentPassportImageStatus = "pending",
  agentCodename = null,
  agentArchetype = null,
  agentTier = null,
}: AgentPassportPanelProps) {
  const router = useRouter();
  const { publicKey, signMessage } = useWallet();
  const { setVisible } = useWalletModal();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [showProof, setShowProof] = useState(false);
  // In-context wallet link — triggered when the owner has no wallet attached
  // yet. Keeps the user inside the Passport tab instead of bouncing to
  // Settings → Linked Accounts. router.refresh() inside the hook re-pulls
  // the parent page so linkedWalletAddress flips populated.
  const {
    triggerWalletConnect: triggerLinkWallet,
    loading: linkLoading,
    error: linkError,
  } = useLinkWallet({ userId: viewerUserId });
  const [imageUrl, setImageUrl] = useState<string | null>(
    passport?.passport_image_url ?? agentPassportImageUrl
  );
  const [imageStatus, setImageStatus] = useState<PassportImageStatus>(
    passport?.passport_image_url ? "ready" : agentPassportImageStatus
  );
  const [regenLoading, setRegenLoading] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);

  const handleRegenerate = async () => {
    setRegenLoading(true);
    setRegenError(null);
    setImageStatus("generating");
    try {
      const res = await fetch(`/api/agents/${agentId}/passport-image`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Regeneration failed");
      if (data.url) {
        setImageUrl(data.url);
        setImageStatus("ready");
      }
    } catch (err) {
      setImageStatus("failed");
      setRegenError(err instanceof Error ? err.message : "Regeneration failed");
    } finally {
      setRegenLoading(false);
    }
  };

  // Poll the passport-image endpoint while generation is in flight. Stops as
  // soon as status is terminal, the user navigates away, or 5 minutes pass.
  useEffect(() => {
    if (imageStatus !== "generating" || !isOwner) return;
    let cancelled = false;
    const deadline = Date.now() + 5 * 60 * 1000;
    const tick = async () => {
      if (cancelled || Date.now() > deadline) return;
      try {
        const res = await fetch(`/api/agents/${agentId}/passport-image`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          url: string | null;
          status: PassportImageStatus;
        };
        if (cancelled) return;
        if (data.status === "ready" && data.url) {
          setImageUrl(data.url);
          setImageStatus("ready");
          return;
        }
        if (data.status === "failed") {
          setImageStatus("failed");
          return;
        }
      } catch {
        // ignore transient errors and keep polling
      }
      setTimeout(tick, 6000);
    };
    setTimeout(tick, 6000);
    return () => {
      cancelled = true;
    };
  }, [agentId, imageStatus, isOwner]);

  const walletMismatch = useMemo(() => {
    if (!publicKey || !linkedWalletAddress) return null;
    return publicKey.toBase58() !== linkedWalletAddress
      ? "The connected wallet does not match the linked owner wallet."
      : null;
  }, [linkedWalletAddress, publicKey]);

  const issueDisabledReason =
    disabledReason ??
    (!isOwner
      ? "Only the owner can issue this Agent Passport."
      : !viewerUserId
        ? "Sign in before issuing an Agent Passport."
        : !linkedWalletAddress
          ? "Link a Solana owner wallet before issuing an Agent Passport."
          : walletMismatch);

  const handleIssue = async () => {
    if (passport) return;

    if (!publicKey || !signMessage) {
      setVisible(true);
      setStatus("Connect the linked owner wallet, then issue the passport.");
      return;
    }

    if (issueDisabledReason) {
      setStatus(issueDisabledReason);
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const nonceResponse = await fetch("/api/auth/siws/nonce", {
        cache: "no-store",
      });
      if (!nonceResponse.ok) {
        throw new Error("Failed to request a passport nonce");
      }

      const { nonce } = await nonceResponse.json();
      const message = new TextEncoder().encode(
        buildSolanaAuthMessage({
          intent: "issue-passport",
          publicKey: publicKey.toBase58(),
          nonce,
          origin: window.location.origin,
          userId: viewerUserId!,
          agentId,
        })
      );
      const signature = await signMessage(message);

      const response = await fetch(`/api/agents/${agentId}/passport`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicKey: publicKey.toBase58(),
          signature: bs58.encode(signature),
          message: bs58.encode(message),
          nonce,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to issue passport");
      }

      setStatus("Agent Passport issued.");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Passport issue failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden border border-pulse-cyan/20 bg-pulse-cyan/5 p-5 sm:p-6">
      <span aria-hidden className="hairline absolute inset-x-0 top-0" />

      {/* Passport visual: ready image, generating placeholder, or omitted. */}
      {imageStatus === "ready" && imageUrl ? (
        <div className="relative mb-5 aspect-square w-full overflow-hidden border border-pulse-cyan/30 bg-void-black shadow-[0_0_36px_rgba(0,240,255,0.18)]">
          <Image
            src={imageUrl}
            alt="Agent Passport"
            fill
            sizes="(max-width: 768px) 100vw, 480px"
            className="object-cover"
            unoptimized
          />
        </div>
      ) : imageStatus === "generating" ? (
        <div className="relative mb-5 flex aspect-square w-full items-center justify-center overflow-hidden border border-pulse-cyan/30 bg-void-black">
          <span className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.18),transparent_70%)]" />
          <span className="relative font-mono text-[10px] uppercase tracking-[0.2em] text-pulse-cyan">
            <span className="status-dot mr-2 align-middle" />
            Rendering passport…
          </span>
        </div>
      ) : imageStatus === "failed" && isOwner ? (
        <div className="relative mb-5 flex aspect-square w-full flex-col items-center justify-center gap-3 overflow-hidden border border-ember-orange/40 bg-ember-orange/5">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ember-orange">
            Passport render failed
          </span>
          {regenError && (
            <p className="px-6 text-center font-mono text-[10px] leading-relaxed text-ember-orange/70">
              {regenError}
            </p>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={handleRegenerate}
            loading={regenLoading}
            disabled={regenLoading}
          >
            Regenerate
          </Button>
        </div>
      ) : passport ? (
        // CSS-rendered fallback card. Used when the passport is issued but
        // no Higgsfield image is available (image service disabled, render
        // pending forever, etc). Always gives the user *something* to view —
        // a stamped terminal-style identity card with the agent's codename,
        // archetype color, tier, and UID — so issuing a passport never feels
        // anticlimactic. Pure CSS, zero external deps.
        <FallbackPassportCard
          codename={agentCodename ?? "AGENT"}
          archetype={agentArchetype ?? "GHOST"}
          tier={agentTier ?? "DORMANT"}
          passportUid={passport.passport_uid}
          ownerWallet={passport.owner_wallet}
          issuedAt={passport.issued_at}
        />
      ) : null}

      <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div className="min-w-0">
          <h2 className="font-headline text-sm font-bold uppercase tracking-[0.1em] text-neural-white sm:tracking-[0.15em]">
            Agent Passport
          </h2>
          <p className="mt-1 font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-neural-white/35 sm:tracking-[0.12em]">
            Identity proof. Recommended <em>before</em> launching a token —
            the on-chain signature anchors the agent to this wallet.
          </p>
        </div>
        <span
          className={`shrink-0 border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] sm:tracking-[0.12em] ${
            passport
              ? "border-pulse-cyan/40 text-pulse-cyan"
              : "border-ghost-gray/30 text-neural-white/35"
          }`}
        >
          {passport ? passport.status : "unissued"}
        </span>
      </div>

      {passport ? (
        <div className="space-y-3">
          <div className="border border-pulse-cyan/30 bg-pulse-cyan/[0.04] p-3 font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-neural-white/55 sm:tracking-[0.12em]">
            <p>
              UID:{" "}
              <span className="text-pulse-cyan">{passport.passport_uid}</span>
            </p>
            <p>Owner: {shortAddress(passport.owner_wallet)}</p>
            <p>Issued: {new Date(passport.issued_at).toLocaleString()}</p>
            {showProof ? (
              <p className="break-all text-neural-white/45">
                Proof: {passport.proof_hash}
              </p>
            ) : (
              <p>Proof: {shortHash(passport.proof_hash)}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowProof((current) => !current)}
            className="font-mono text-[10px] uppercase tracking-[0.08em] text-neural-white/45 hover:text-pulse-cyan sm:tracking-[0.12em]"
          >
            {showProof ? "Hide proof hash" : "Reveal full proof hash"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-neural-white/55">
            Issue a passport when this agent is ready to be public. It proves
            the owner wallet signed for this exact agent without launching a
            tradable token.
          </p>
          {isOwner ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {/* When the owner has no wallet linked yet, surface a clear
                  in-panel CTA. Clicking opens the wallet-adapter modal; once
                  the user picks Phantom (or another wallet) the SIWS link
                  flow auto-fires and the page refreshes — at which point the
                  Issue Passport button below becomes enabled. */}
              {!linkedWalletAddress ? (
                <Button
                  variant="secondary"
                  size="sm"
                  magnetic={false}
                  onClick={triggerLinkWallet}
                  loading={linkLoading}
                  disabled={linkLoading || !viewerUserId}
                  className="w-full sm:w-auto"
                >
                  {linkLoading ? "Linking wallet…" : "Link Wallet"}
                </Button>
              ) : null}
              <Button
                variant="primary"
                size="sm"
                onClick={handleIssue}
                disabled={loading || Boolean(issueDisabledReason)}
                loading={loading}
                className="w-full sm:w-auto"
              >
                Issue Passport
              </Button>
            </div>
          ) : null}
        </div>
      )}

      {(status || linkError || (!passport && issueDisabledReason)) && (
        <p
          className={`mt-4 font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] sm:tracking-[0.12em] ${
            linkError ? "text-ember-orange" : "text-neural-white/40"
          }`}
        >
          {linkError ?? status ?? issueDisabledReason}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// FallbackPassportCard — CSS-rendered identity card used when no external
// passport image is available. Looks like a stamped terminal credential:
// archetype-tinted corner brackets, big mono codename, holographic seal,
// short UID. Always renders something; never blanks.
// ─────────────────────────────────────────────────────────────────────────

interface FallbackPassportCardProps {
  codename: string;
  archetype: string;
  tier: string;
  passportUid: string;
  ownerWallet: string;
  issuedAt: string;
}

function FallbackPassportCard({
  codename,
  archetype,
  tier,
  passportUid,
  ownerWallet,
  issuedAt,
}: FallbackPassportCardProps) {
  const accent =
    ARCHETYPE_COLOR[archetype.toUpperCase()] ?? ARCHETYPE_COLOR.GHOST;
  const tierHex = TIER_COLOR[tier.toUpperCase()] ?? TIER_COLOR.DORMANT;
  const shortUid = passportUid.length > 14
    ? `${passportUid.slice(0, 6)}…${passportUid.slice(-4)}`
    : passportUid;
  const shortOwner = `${ownerWallet.slice(0, 4)}…${ownerWallet.slice(-4)}`;
  const issuedYear = new Date(issuedAt).getUTCFullYear();

  return (
    <div
      className={cn(
        "relative mb-5 aspect-square w-full overflow-hidden border bg-void-black",
      )}
      style={{
        borderColor: `rgba(${accent.rgb}, 0.4)`,
        boxShadow: `0 0 36px rgba(${accent.rgb}, 0.18), inset 0 0 36px rgba(${accent.rgb}, 0.06)`,
      }}
    >
      {/* radial aura */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(60% 70% at 50% 40%, rgba(${accent.rgb}, 0.22), transparent 70%)`,
        }}
      />

      {/* faint grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(rgba(232,230,227,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(232,230,227,0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* corner brackets */}
      <CornerBracket position="tl" color={accent.hex} />
      <CornerBracket position="tr" color={accent.hex} />
      <CornerBracket position="bl" color={accent.hex} />
      <CornerBracket position="br" color={accent.hex} />

      {/* top meta row */}
      <div className="absolute inset-x-6 top-6 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.2em]">
        <span style={{ color: accent.hex }} className="opacity-80">
          {"// EMERGN.PASSPORT"}
        </span>
        <span
          className="border px-1.5 py-px"
          style={{
            color: tierHex,
            borderColor: `${tierHex}66`,
            backgroundColor: `${tierHex}14`,
          }}
        >
          {tier}
        </span>
      </div>

      {/* center: codename */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-6 text-center">
        <p
          className="font-mono text-[10px] uppercase tracking-[0.3em]"
          style={{ color: `rgba(${accent.rgb}, 0.7)` }}
        >
          {archetype}
        </p>
        <p
          className="mt-3 break-all font-headline text-3xl font-bold uppercase tracking-[0.08em] text-neural-white sm:text-4xl"
          style={{
            textShadow: `0 0 28px rgba(${accent.rgb}, 0.55), 0 0 4px rgba(${accent.rgb}, 0.4)`,
          }}
        >
          {codename}
        </p>
        <div
          className="mx-auto mt-4 h-px w-24"
          style={{
            background: `linear-gradient(90deg, transparent, ${accent.hex}, transparent)`,
            boxShadow: `0 0 8px ${accent.hex}`,
          }}
        />
        <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.25em] text-neural-white/40">
          ISSUED · {issuedYear}
        </p>
      </div>

      {/* concentric seal — bottom right */}
      <div
        aria-hidden
        className="absolute bottom-6 right-6 h-12 w-12"
        style={{
          background: `radial-gradient(circle at center, transparent 30%, rgba(${accent.rgb}, 0.18) 45%, transparent 60%)`,
        }}
      >
        <div
          className="absolute inset-0 border"
          style={{ borderColor: `rgba(${accent.rgb}, 0.45)` }}
        />
        <div
          className="absolute inset-1.5 border"
          style={{ borderColor: `rgba(${accent.rgb}, 0.3)` }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2"
          style={{
            background: accent.hex,
            boxShadow: `0 0 8px ${accent.hex}`,
          }}
        />
      </div>

      {/* bottom meta row */}
      <div className="absolute inset-x-6 bottom-6 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.18em] text-neural-white/45">
        <span>UID · {shortUid}</span>
        <span>OWNER · {shortOwner}</span>
      </div>
    </div>
  );
}

function CornerBracket({
  position,
  color,
}: {
  position: "tl" | "tr" | "bl" | "br";
  color: string;
}) {
  const placement = {
    tl: "top-3 left-3 border-l border-t",
    tr: "top-3 right-3 border-r border-t",
    bl: "bottom-3 left-3 border-l border-b",
    br: "bottom-3 right-3 border-r border-b",
  }[position];
  return (
    <span
      aria-hidden
      className={cn("absolute h-5 w-5", placement)}
      style={{ borderColor: color }}
    />
  );
}
