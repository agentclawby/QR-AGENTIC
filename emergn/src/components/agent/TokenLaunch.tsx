"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Keypair, VersionedTransaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/Button";
import type { AgentToken } from "@/types";

interface TokenLaunchProps {
  agentId: string;
  agentToken: AgentToken | null;
  linkedWalletAddress: string | null;
  disabledReason?: string | null;
  agentName?: string | null;
  agentCodename?: string | null;
  agentArchetype?: string | null;
  agentPersonalitySummary?: string | null;
  agentPassportImageUrl?: string | null;
}

const ARCHETYPE_GLYPHS: Record<string, { color: string; glyph: string }> = {
  ORACLE: { color: "#00F0FF", glyph: "◉" },
  HUNTER: { color: "#FF6B35", glyph: "◤" },
  SENTINEL: { color: "#8B5CF6", glyph: "◇" },
  DIPLOMAT: { color: "#E8E6E3", glyph: "◈" },
  GHOST: { color: "#6B7280", glyph: "◐" },
  EVOLVE: { color: "#00B4D8", glyph: "◎" },
};

function renderFallbackLogoDataUrl(
  agentName: string,
  agentCodename: string,
  archetype: string,
): string | null {
  if (typeof document === "undefined") return null;
  let canvas: HTMLCanvasElement;
  try {
    canvas = document.createElement("canvas");
  } catch {
    return null;
  }
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const accent = ARCHETYPE_GLYPHS[archetype]?.color ?? "#00F0FF";
  const glyph = ARCHETYPE_GLYPHS[archetype]?.glyph ?? "◇";

  // Background
  ctx.fillStyle = "#0A0A0F";
  ctx.fillRect(0, 0, 512, 512);

  // Subtle border + accent rail
  ctx.strokeStyle = "rgba(232,230,227,0.12)";
  ctx.lineWidth = 2;
  ctx.strokeRect(8, 8, 496, 496);
  ctx.fillStyle = accent;
  ctx.fillRect(8, 8, 4, 496);

  // Archetype glyph (very large, faint, behind text)
  ctx.fillStyle = `${accent}33`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 360px 'Space Grotesk', system-ui, sans-serif";
  ctx.fillText(glyph, 256, 240);

  // EMERGN. tag (top right, mono)
  ctx.fillStyle = "rgba(232,230,227,0.45)";
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.font = "12px 'JetBrains Mono', ui-monospace, monospace";
  ctx.fillText("EMERGN.", 488, 28);

  // Agent name
  ctx.fillStyle = "#E8E6E3";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 64px 'Space Grotesk', system-ui, sans-serif";
  const name = (agentName || "AGENT").toUpperCase().slice(0, 18);
  ctx.fillText(name, 256, 320);

  // Codename / archetype line
  ctx.fillStyle = "rgba(232,230,227,0.55)";
  ctx.font = "20px 'JetBrains Mono', ui-monospace, monospace";
  const sub = `${agentCodename || ""}${agentCodename && archetype ? " // " : ""}${archetype}`.toUpperCase();
  ctx.fillText(sub.slice(0, 36), 256, 372);

  // Bottom signature
  ctx.fillStyle = accent;
  ctx.font = "10px 'JetBrains Mono', ui-monospace, monospace";
  ctx.fillText("LAUNCHED VIA EMERGN.ORG", 256, 472);

  return canvas.toDataURL("image/png");
}

type LaunchStep = "idle" | "preparing" | "signing" | "confirming" | "done";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB cap before metadata upload
const DEFAULT_DESCRIPTION =
  "An autonomous EMERGN. agent. Thinks, decides, evolves on-chain.";

const EMERGN_X_HANDLE =
  process.env.NEXT_PUBLIC_EMERGN_X_HANDLE ?? "https://x.com/emergndotorg";
const EMERGN_SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://emergn.org";

function brandHandleLabel(handleUrl: string) {
  try {
    const parsed = new URL(handleUrl);
    const trimmed = parsed.pathname.replace(/\/+$/, "").replace(/^\/+/, "");
    return trimmed ? `@${trimmed}` : parsed.host;
  } catch {
    return handleUrl;
  }
}

function brandSiteLabel(siteUrl: string) {
  try {
    const parsed = new URL(siteUrl);
    return parsed.host.replace(/^www\./, "");
  } catch {
    return siteUrl;
  }
}

function base64ToBytes(base64: string) {
  const binary = window.atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read passport image"));
    reader.readAsDataURL(blob);
  });
}

function randomSuffix(length: number) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function buildSymbolFallback(name: string) {
  const cleanName = name.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const prefix = cleanName.slice(0, 4) || "AGNT";
  return `${prefix}${randomSuffix(Math.max(0, 7 - prefix.length))}`.slice(0, 10);
}

interface StepProps {
  index: number;
  label: string;
  state: "pending" | "active" | "done";
}

function StepDot({ index, label, state }: StepProps) {
  const colors =
    state === "active"
      ? "border-pulse-cyan bg-pulse-cyan/10 text-pulse-cyan"
      : state === "done"
        ? "border-pulse-cyan/50 bg-pulse-cyan/5 text-pulse-cyan/70"
        : "border-ghost-gray/30 text-neural-white/40";
  return (
    <div className={`flex min-w-0 items-center gap-2 border px-3 py-1.5 ${colors}`}>
      <span className="font-mono text-[9px] uppercase tracking-[0.08em] tabular-nums sm:tracking-[0.12em]">
        {String(index).padStart(2, "0")}
      </span>
      <span className="truncate font-mono text-[10px] uppercase tracking-[0.08em] sm:tracking-[0.12em]">
        {label}
      </span>
    </div>
  );
}

export function TokenLaunch({
  agentId,
  agentToken,
  linkedWalletAddress,
  disabledReason = null,
  agentName = null,
  agentCodename = null,
  agentArchetype = null,
  agentPersonalitySummary = null,
  agentPassportImageUrl = null,
}: TokenLaunchProps) {
  const router = useRouter();
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const launched = agentToken?.status === "launched";
  // Only "submitted" (on-chain, awaiting confirm) blocks a re-launch.
  // "prepared" and "failed" rows are stale leftovers and get overwritten
  // on the next prepare call (route uses upsert on agent_id).
  const existingTokenMint =
    agentToken?.status === "launched" || agentToken?.status === "submitted"
      ? agentToken.token_mint
      : null;

  const defaultTokenName = useMemo(
    () => (agentName ?? "").slice(0, 32),
    [agentName],
  );
  const defaultTokenSymbol = useMemo(() => {
    const fromCodename = (agentCodename ?? "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 10);
    if (fromCodename.length >= 2) return fromCodename;
    return buildSymbolFallback(agentName ?? "");
  }, [agentCodename, agentName]);
  const defaultDescription = useMemo(() => {
    const summary = (agentPersonalitySummary ?? "").trim();
    if (summary.length >= 10) return summary.slice(0, 500);
    return DEFAULT_DESCRIPTION;
  }, [agentPersonalitySummary]);

  const provider = "pumpportal" as const;
  const tokenGateThreshold = 0;
  const [tokenName, setTokenName] = useState(defaultTokenName);
  const [tokenSymbol, setTokenSymbol] = useState(defaultTokenSymbol);
  const [description, setDescription] = useState(defaultDescription);

  // Initialize the logo synchronously on mount. Canvas render is sync, so the
  // launch button never has to wait for an async chain to enable. The async
  // useEffect below only runs to UPGRADE this canvas logo to the real
  // Higgsfield passport image (if one exists) — never to fall back from it.
  const [passportImageDataUrl, setPassportImageDataUrl] = useState<string | null>(
    () =>
      renderFallbackLogoDataUrl(
        agentName ?? "",
        agentCodename ?? "",
        (agentArchetype ?? "GHOST").toUpperCase(),
      ),
  );
  const [logoSource, setLogoSource] = useState<"passport" | "fallback">(
    "fallback",
  );
  const [passportImageError, setPassportImageError] = useState<string | null>(
    null,
  );
  const [step, setStep] = useState<LaunchStep>("idle");
  const [status, setStatus] = useState<string | null>(null);
  const [resultSignature, setResultSignature] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenName && defaultTokenName) setTokenName(defaultTokenName);
  }, [defaultTokenName, tokenName]);
  useEffect(() => {
    if (!tokenSymbol && defaultTokenSymbol) setTokenSymbol(defaultTokenSymbol);
  }, [defaultTokenSymbol, tokenSymbol]);
  useEffect(() => {
    if (!description && defaultDescription) setDescription(defaultDescription);
  }, [defaultDescription, description]);

  // If canvas rendering somehow failed (rare — e.g. headless or browser
  // restriction), fall back to the server-rendered PNG.
  useEffect(() => {
    if (passportImageDataUrl) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`/api/agents/${agentId}/launch-logo`);
        if (!response.ok) throw new Error("server logo render failed");
        const blob = await response.blob();
        const dataUrl = await blobToDataUrl(blob);
        if (!cancelled) {
          setPassportImageDataUrl(dataUrl);
          setLogoSource("fallback");
        }
      } catch (error) {
        if (!cancelled) {
          console.error("[launch] server logo render failed", error);
          setPassportImageError("Could not prepare a token logo");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [agentId, passportImageDataUrl]);

  // If the agent has a real Higgsfield passport image, upgrade the canvas
  // fallback to that. Failure here is silent — the canvas logo stays.
  useEffect(() => {
    if (!agentPassportImageUrl) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(agentPassportImageUrl);
        if (!response.ok) throw new Error("passport image fetch failed");
        const blob = await response.blob();
        if (blob.size > MAX_IMAGE_BYTES) {
          throw new Error("passport image too large");
        }
        const dataUrl = await blobToDataUrl(blob);
        if (!cancelled) {
          setPassportImageDataUrl(dataUrl);
          setLogoSource("passport");
        }
      } catch (error) {
        console.warn("[launch] real passport image unavailable, keeping canvas logo", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [agentPassportImageUrl]);

  // Compute every individual blocker so the UI can surface a complete,
  // honest list instead of silently disabling the button.
  const connectedAddress = publicKey?.toBase58() ?? null;
  const walletMismatch =
    connectedAddress &&
    linkedWalletAddress &&
    connectedAddress !== linkedWalletAddress
      ? `Connected wallet ${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)} does not match linked owner ${linkedWalletAddress.slice(0, 6)}...${linkedWalletAddress.slice(-4)}. Switch accounts in Phantom or relink in Settings.`
      : null;

  const blockers: string[] = [];
  if (existingTokenMint) {
    blockers.push("This agent already has a launched token");
  }
  if (disabledReason) blockers.push(disabledReason);
  if (!linkedWalletAddress) {
    blockers.push("Link your owner wallet in Settings → Linked Accounts first");
  }
  if (!connectedAddress) {
    blockers.push("Connect your wallet in Phantom (top right of the page)");
  }
  if (walletMismatch) blockers.push(walletMismatch);
  if (tokenName.trim().length < 2) blockers.push("Token name must be at least 2 characters");
  if (tokenSymbol.trim().length < 2) blockers.push("Token symbol must be at least 2 characters");
  if (description.trim().length < 10) blockers.push("Description must be at least 10 characters");
  if (!passportImageDataUrl) {
    blockers.push(passportImageError ?? "Token logo is still loading");
  }

  const canLaunch = blockers.length === 0 && step === "idle";

  const handleLaunch = async () => {
    if (blockers.length > 0) {
      setStatus(blockers[0]);
      return;
    }
    if (!publicKey || !signTransaction) {
      setStatus("Connect your wallet in Phantom to sign the launch transaction.");
      return;
    }
    if (!passportImageDataUrl) {
      setStatus("Token logo is still loading — try again in a moment.");
      return;
    }

    setStatus(null);
    setResultSignature(null);

    try {
      const mintKeypair = Keypair.generate();

      setStep("preparing");
      const prepareResponse = await fetch(
        `/api/agents/${agentId}/launch-token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "prepare",
            provider,
            walletPublicKey: publicKey.toBase58(),
            mintPublicKey: mintKeypair.publicKey.toBase58(),
            tokenName,
            tokenSymbol,
            description,
            imageDataUrl: passportImageDataUrl,
            devBuySol: 0,
            tokenGateThreshold,
          }),
        },
      );

      const prepared = await prepareResponse.json();
      if (!prepareResponse.ok) {
        throw new Error(prepared.error || "Failed to prepare launch");
      }

      setStep("signing");
      const tx = VersionedTransaction.deserialize(
        base64ToBytes(prepared.serializedTransactionBase64),
      );
      tx.sign([mintKeypair]);
      const signedTx = await signTransaction(tx);

      setStep("confirming");
      const signature = await connection.sendRawTransaction(
        signedTx.serialize(),
      );
      await connection.confirmTransaction(signature, "confirmed");

      const confirmResponse = await fetch(
        `/api/agents/${agentId}/launch-token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "confirm",
            provider,
            walletPublicKey: publicKey.toBase58(),
            mintPublicKey: mintKeypair.publicKey.toBase58(),
            tokenName,
            tokenSymbol,
            metadataUri: prepared.metadataUri,
            signature,
            tokenGateThreshold,
          }),
        },
      );

      const confirmed = await confirmResponse.json();
      if (!confirmResponse.ok) {
        throw new Error(confirmed.error || "Failed to confirm launch");
      }

      setStep("done");
      setResultSignature(signature);
      setStatus("Token launched.");
      router.refresh();
    } catch (error) {
      setStep("idle");
      setStatus(error instanceof Error ? error.message : "Launch failed");
    }
  };

  const socialsPreview = `Socials on chain: ${brandSiteLabel(EMERGN_SITE)} · ${brandHandleLabel(EMERGN_X_HANDLE)} · createdOn ${brandSiteLabel(EMERGN_SITE)}`;

  return (
    <div className="border border-ghost-gray/20 bg-ghost-gray/5 p-5 sm:p-6">
      <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div className="min-w-0">
          <h2 className="font-headline text-sm font-bold uppercase tracking-[0.1em] text-neural-white sm:tracking-[0.15em]">
            EMERGN. Token Launch
          </h2>
          <p className="mt-1 font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-neural-white/35 sm:tracking-[0.12em]">
            Mint your agent as an on-chain token. Socials and origin are stamped
            with EMERGN. branding — your personal handle is never written
            on-chain.
          </p>
        </div>
        {launched ? (
          <span className="shrink-0 border border-pulse-cyan/30 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-pulse-cyan sm:tracking-[0.12em]">
            launched
          </span>
        ) : null}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StepDot
          index={1}
          label="Prepare metadata"
          state={
            step === "preparing"
              ? "active"
              : step === "signing" || step === "confirming" || step === "done"
                ? "done"
                : "pending"
          }
        />
        <StepDot
          index={2}
          label="Sign transaction"
          state={
            step === "signing"
              ? "active"
              : step === "confirming" || step === "done"
                ? "done"
                : "pending"
          }
        />
        <StepDot
          index={3}
          label="Confirm on-chain"
          state={
            step === "confirming"
              ? "active"
              : step === "done"
                ? "done"
                : "pending"
          }
        />
      </div>

      <div className="mb-4 space-y-2 break-words font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-neural-white/35 sm:tracking-[0.12em]">
        <p>
          Linked owner wallet:{" "}
          {linkedWalletAddress
            ? `${linkedWalletAddress.slice(0, 6)}...${linkedWalletAddress.slice(-4)}`
            : "not linked"}
        </p>
        {disabledReason ? <p>{disabledReason}</p> : null}
      </div>

      {launched ? (
        <div className="space-y-2 border border-pulse-cyan/30 bg-pulse-cyan/5 p-4 font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-neural-white/55 sm:tracking-[0.12em]">
          <p className="break-all">Mint: {agentToken!.token_mint}</p>
          {agentToken!.launch_tx ? (
            <a
              href={`https://solscan.io/tx/${agentToken!.launch_tx}`}
              target="_blank"
              rel="noreferrer"
              className="text-pulse-cyan hover:text-pulse-cyan/80"
            >
              View launch tx on Solscan ↗
            </a>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={tokenName}
              onChange={(event) => setTokenName(event.target.value)}
              placeholder="Token name"
              disabled={step !== "idle"}
              className="border border-ghost-gray/20 bg-void-black px-4 py-3 text-sm text-neural-white/75 outline-none"
            />
            <input
              value={tokenSymbol}
              onChange={(event) =>
                setTokenSymbol(event.target.value.toUpperCase())
              }
              placeholder="Symbol"
              maxLength={10}
              disabled={step !== "idle"}
              className="border border-ghost-gray/20 bg-void-black px-4 py-3 text-sm text-neural-white/75 outline-none"
            />
          </div>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe the token and the agent behind it..."
            disabled={step !== "idle"}
            className="h-24 w-full border border-ghost-gray/20 bg-void-black px-4 py-3 text-sm text-neural-white/75 outline-none"
          />

          {passportImageDataUrl ? (
            <div className="flex items-center gap-3 border border-pulse-cyan/20 bg-pulse-cyan/5 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={passportImageDataUrl}
                alt="Token logo"
                className="h-12 w-12 border border-pulse-cyan/30 object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-pulse-cyan sm:tracking-[0.12em]">
                  {logoSource === "passport"
                    ? "Passport image attached as token logo"
                    : "EMERGN.-branded logo generated from agent identity"}
                </p>
              </div>
            </div>
          ) : passportImageError ? (
            <div className="border border-ember-orange/30 bg-ember-orange/5 p-3">
              <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-ember-orange sm:tracking-[0.12em]">
                {passportImageError}
              </p>
            </div>
          ) : null}

          <div className="border border-ghost-gray/20 bg-void-black p-3">
            <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-neural-white/55 sm:tracking-[0.12em]">
              {socialsPreview}
            </p>
          </div>

          {blockers.length > 0 ? (
            <div className="border border-ember-orange/30 bg-ember-orange/5 p-3">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ember-orange/80">
                Before launching:
              </p>
              <ul className="space-y-1 font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-ember-orange sm:tracking-[0.12em]">
                {blockers.map((blocker, i) => (
                  <li key={i}>· {blocker}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <Button
            variant="primary"
            size="sm"
            disabled={step !== "idle" && step !== "done"}
            loading={step !== "idle" && step !== "done"}
            onClick={handleLaunch}
            className="w-full sm:w-auto"
          >
            {step === "idle" || step === "done"
              ? canLaunch
                ? "Launch Agent Token"
                : "Resolve issues above to launch"
              : "Launching..."}
          </Button>
        </div>
      )}

      {status ? (
        <div className="mt-4 border border-ghost-gray/20 bg-void-black p-3">
          <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-neural-white/55 sm:tracking-[0.12em]">
            {status}
          </p>
          {resultSignature ? (
            <a
              href={`https://solscan.io/tx/${resultSignature}`}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block font-mono text-[10px] uppercase tracking-[0.08em] text-pulse-cyan hover:text-pulse-cyan/80 sm:tracking-[0.12em]"
            >
              View tx on Solscan ↗
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
