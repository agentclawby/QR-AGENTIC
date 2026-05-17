"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Keypair,
  SystemProgram,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
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
  agentPersonalitySummary?: string | null;
  agentPassportImageUrl?: string | null;
  agentPassportImageStatus?: string | null;
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

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
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
  agentPersonalitySummary = null,
  agentPassportImageUrl = null,
  agentPassportImageStatus = null,
}: TokenLaunchProps) {
  const router = useRouter();
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const launched = agentToken?.status === "launched";
  const inFlight =
    agentToken?.status === "prepared" || agentToken?.status === "submitted";
  const existingTokenMint =
    agentToken && agentToken.status !== "failed" ? agentToken.token_mint : null;

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

  const [provider, setProvider] = useState<"pumpportal" | "direct_spl">(
    "pumpportal",
  );
  const [tokenName, setTokenName] = useState(defaultTokenName);
  const [tokenSymbol, setTokenSymbol] = useState(defaultTokenSymbol);
  const [description, setDescription] = useState(defaultDescription);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [passportImageDataUrl, setPassportImageDataUrl] = useState<string | null>(
    null,
  );
  const [passportImageError, setPassportImageError] = useState<string | null>(
    null,
  );
  const [showImageOverride, setShowImageOverride] = useState(false);
  const [tokenGateThreshold, setTokenGateThreshold] = useState("0");
  const [directSupply, setDirectSupply] = useState("1000000000");
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

  const passportReady =
    Boolean(agentPassportImageUrl) && agentPassportImageStatus === "ready";

  useEffect(() => {
    if (!passportReady || !agentPassportImageUrl) return;
    if (passportImageDataUrl || imageFile) return;

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(agentPassportImageUrl);
        if (!response.ok) throw new Error("Failed to load passport image");
        const blob = await response.blob();
        if (blob.size > MAX_IMAGE_BYTES) {
          throw new Error("Passport image exceeds 4 MB launch limit");
        }
        const dataUrl = await blobToDataUrl(blob);
        if (!cancelled) {
          setPassportImageDataUrl(dataUrl);
          setPassportImageError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setPassportImageError(
            error instanceof Error
              ? error.message
              : "Failed to load passport image",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [passportReady, agentPassportImageUrl, passportImageDataUrl, imageFile]);

  const walletMismatch =
    publicKey &&
    linkedWalletAddress &&
    publicKey.toBase58() !== linkedWalletAddress
      ? "The connected wallet does not match the linked owner wallet."
      : null;
  const launchDisabledReason =
    disabledReason ??
    (!linkedWalletAddress
      ? "Link your owner wallet in Settings before launching a token."
      : walletMismatch);

  const validationError = useMemo(() => {
    if (existingTokenMint) return null;
    if (tokenName.trim().length < 2) return null;
    if (tokenSymbol.trim().length < 2) return null;
    if (description.trim().length < 10) return null;
    if (provider === "pumpportal" && imageFile && imageFile.size > MAX_IMAGE_BYTES) {
      return "Image must be 4 MB or smaller.";
    }
    return null;
  }, [
    description,
    existingTokenMint,
    imageFile,
    provider,
    tokenName,
    tokenSymbol,
  ]);

  const hasLaunchImage =
    provider !== "pumpportal" || Boolean(imageFile) || Boolean(passportImageDataUrl);

  const canLaunch =
    !existingTokenMint &&
    tokenName.trim().length >= 2 &&
    tokenSymbol.trim().length >= 2 &&
    description.trim().length >= 10 &&
    hasLaunchImage &&
    !validationError &&
    !launchDisabledReason &&
    step === "idle";

  const handleLaunch = async () => {
    if (launchDisabledReason) {
      setStatus(launchDisabledReason);
      return;
    }
    if (validationError) {
      setStatus(validationError);
      return;
    }
    if (!publicKey || !signTransaction) {
      setStatus("Connect a signing wallet to launch a token.");
      return;
    }

    setStatus(null);
    setResultSignature(null);

    try {
      const mintKeypair = Keypair.generate();
      const gateThreshold = Number(tokenGateThreshold || "0");

      if (provider === "pumpportal") {
        let imageDataUrl: string | null = null;
        if (passportImageDataUrl) {
          imageDataUrl = passportImageDataUrl;
        } else if (imageFile) {
          imageDataUrl = await fileToDataUrl(imageFile);
        }
        if (!imageDataUrl) {
          throw new Error("Token image is required to launch this agent.");
        }

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
              imageDataUrl,
              devBuySol: 0.01,
              tokenGateThreshold: gateThreshold,
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
              tokenGateThreshold: gateThreshold,
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
        return;
      }

      // Direct SPL flow
      setStep("preparing");
      const decimals = 6;
      const lamports = await connection.getMinimumBalanceForRentExemption(
        MINT_SIZE,
      );
      const mint = mintKeypair.publicKey;
      const owner = publicKey;
      const destinationAta = getAssociatedTokenAddressSync(mint, owner);
      const transaction = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: owner,
          newAccountPubkey: mint,
          lamports,
          space: MINT_SIZE,
          programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMintInstruction(mint, decimals, owner, owner),
        createAssociatedTokenAccountInstruction(
          owner,
          destinationAta,
          owner,
          mint,
        ),
        createMintToInstruction(
          mint,
          destinationAta,
          owner,
          BigInt(directSupply) * 10n ** BigInt(decimals),
        ),
      );
      transaction.feePayer = owner;
      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.partialSign(mintKeypair);

      setStep("signing");
      const signed = await signTransaction(transaction);

      setStep("confirming");
      const signature = await connection.sendRawTransaction(signed.serialize());
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
            mintPublicKey: mint.toBase58(),
            tokenName,
            tokenSymbol,
            signature,
            tokenGateThreshold: gateThreshold,
          }),
        },
      );

      const confirmed = await confirmResponse.json();
      if (!confirmResponse.ok) {
        throw new Error(confirmed.error || "Failed to confirm SPL launch");
      }

      setStep("done");
      setResultSignature(signature);
      setStatus("SPL token launched.");
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
        {agentToken ? (
          <span className="shrink-0 border border-pulse-cyan/30 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-pulse-cyan sm:tracking-[0.12em]">
            {agentToken.status}
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
        {launchDisabledReason ? <p>{launchDisabledReason}</p> : null}
        {agentToken?.failure_reason ? (
          <p className="text-ember-orange/70">{agentToken.failure_reason}</p>
        ) : null}
        {inFlight && !launched ? (
          <p className="text-pulse-cyan/70">
            A previous launch attempt is in flight ({agentToken!.status}). If
            you signed a transaction earlier and lost the page, finish signing
            in your wallet or contact support to clear the record.
          </p>
        ) : null}
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
              disabled={Boolean(launchDisabledReason) || step !== "idle"}
              className="border border-ghost-gray/20 bg-void-black px-4 py-3 text-sm text-neural-white/75 outline-none"
            />
            <input
              value={tokenSymbol}
              onChange={(event) =>
                setTokenSymbol(event.target.value.toUpperCase())
              }
              placeholder="Symbol"
              maxLength={10}
              disabled={Boolean(launchDisabledReason) || step !== "idle"}
              className="border border-ghost-gray/20 bg-void-black px-4 py-3 text-sm text-neural-white/75 outline-none"
            />
          </div>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe the token and the agent behind it..."
            disabled={Boolean(launchDisabledReason) || step !== "idle"}
            className="h-24 w-full border border-ghost-gray/20 bg-void-black px-4 py-3 text-sm text-neural-white/75 outline-none"
          />

          <div className="grid gap-3 sm:grid-cols-3">
            <select
              value={provider}
              onChange={(event) =>
                setProvider(event.target.value as "pumpportal" | "direct_spl")
              }
              disabled={Boolean(launchDisabledReason) || step !== "idle"}
              className="border border-ghost-gray/20 bg-void-black px-4 py-3 font-mono text-xs uppercase tracking-[0.08em] text-neural-white/65 outline-none sm:tracking-[0.12em]"
            >
              <option value="pumpportal">Bonding curve</option>
              <option value="direct_spl">Direct mint</option>
            </select>
            <input
              value={tokenGateThreshold}
              onChange={(event) => setTokenGateThreshold(event.target.value)}
              placeholder="Gate threshold"
              disabled={Boolean(launchDisabledReason) || step !== "idle"}
              className="border border-ghost-gray/20 bg-void-black px-4 py-3 text-sm text-neural-white/75 outline-none"
            />
            {provider === "direct_spl" ? (
              <input
                value={directSupply}
                onChange={(event) => setDirectSupply(event.target.value)}
                placeholder="Initial supply"
                disabled={Boolean(launchDisabledReason) || step !== "idle"}
                className="border border-ghost-gray/20 bg-void-black px-4 py-3 text-sm text-neural-white/75 outline-none"
              />
            ) : (
              <div className="flex items-center border border-ghost-gray/20 bg-void-black px-4 py-3 font-mono text-[10px] uppercase tracking-[0.08em] text-neural-white/55 sm:tracking-[0.12em]">
                {passportImageDataUrl
                  ? "Logo: passport image"
                  : passportReady
                    ? "Loading passport..."
                    : imageFile
                      ? `Logo: ${imageFile.name.slice(0, 24)}`
                      : "Logo: awaiting passport"}
              </div>
            )}
          </div>

          {provider === "pumpportal" && passportImageDataUrl ? (
            <div className="flex items-center gap-3 border border-pulse-cyan/20 bg-pulse-cyan/5 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={passportImageDataUrl}
                alt="Token logo"
                className="h-12 w-12 border border-pulse-cyan/30 object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-pulse-cyan sm:tracking-[0.12em]">
                  Passport image attached as token logo
                </p>
                <button
                  type="button"
                  onClick={() => setShowImageOverride((value) => !value)}
                  disabled={Boolean(launchDisabledReason) || step !== "idle"}
                  className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-neural-white/40 hover:text-neural-white/70 sm:tracking-[0.12em]"
                >
                  {showImageOverride ? "Cancel override" : "Override with custom image"}
                </button>
              </div>
            </div>
          ) : null}

          {provider === "pumpportal" && passportImageError && !passportImageDataUrl ? (
            <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-ember-orange sm:tracking-[0.12em]">
              {passportImageError} — upload a custom logo below.
            </p>
          ) : null}

          {provider === "pumpportal" && (!passportImageDataUrl || showImageOverride) ? (
            <input
              type="file"
              accept="image/*"
              disabled={Boolean(launchDisabledReason) || step !== "idle"}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setImageFile(file);
                if (file) {
                  setPassportImageDataUrl(null);
                  setShowImageOverride(false);
                }
              }}
              className="w-full border border-ghost-gray/20 bg-void-black px-4 py-3 text-sm text-neural-white/75 outline-none file:mr-3 file:border-0 file:bg-transparent file:font-mono file:text-xs file:uppercase file:tracking-[0.08em] file:text-neural-white/50 sm:file:tracking-[0.12em]"
            />
          ) : null}

          <div className="border border-ghost-gray/20 bg-void-black p-3">
            <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-neural-white/55 sm:tracking-[0.12em]">
              {socialsPreview}
            </p>
          </div>

          {validationError ? (
            <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-ember-orange sm:tracking-[0.12em]">
              {validationError}
            </p>
          ) : null}

          <Button
            variant="primary"
            size="sm"
            disabled={!canLaunch}
            loading={step !== "idle" && step !== "done"}
            onClick={handleLaunch}
            className="w-full sm:w-auto"
          >
            {step === "idle" || step === "done"
              ? "Launch Agent Token"
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
