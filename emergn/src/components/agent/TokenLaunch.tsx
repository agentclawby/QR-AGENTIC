"use client";

import { useMemo, useState } from "react";
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

export function TokenLaunch({
  agentId,
  agentToken,
  linkedWalletAddress,
  disabledReason = null,
}: TokenLaunchProps) {
  const router = useRouter();
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const existingTokenMint =
    agentToken && agentToken.status !== "failed" ? agentToken.token_mint : null;
  const [provider, setProvider] = useState<"pumpportal" | "direct_spl">("pumpportal");
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [tokenGateThreshold, setTokenGateThreshold] = useState("0");
  const [directSupply, setDirectSupply] = useState("1000000000");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
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

  const canLaunch = useMemo(() => {
    return (
      !existingTokenMint &&
      tokenName.trim().length >= 2 &&
      tokenSymbol.trim().length >= 2 &&
      description.trim().length >= 10
    );
  }, [description, existingTokenMint, tokenName, tokenSymbol]);

  const handleLaunch = async () => {
    if (launchDisabledReason) {
      setStatus(launchDisabledReason);
      return;
    }

    if (!publicKey || !signTransaction) {
      setStatus("Connect a signing wallet to launch a token.");
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const mintKeypair = Keypair.generate();
      const gateThreshold = Number(tokenGateThreshold || "0");

      if (provider === "pumpportal") {
        if (!imageFile) {
          throw new Error("A token image is required for PumpPortal launches.");
        }

        const imageDataUrl = await fileToDataUrl(imageFile);
        const prepareResponse = await fetch(`/api/agents/${agentId}/launch-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "prepare",
            provider,
            walletPublicKey: publicKey.toBase58(),
            mintPublicKey: mintKeypair.publicKey.toBase58(),
            tokenName,
            tokenSymbol,
            description,
            website,
            twitter,
            telegram,
            imageDataUrl,
            devBuySol: 0.01,
            tokenGateThreshold: gateThreshold,
          }),
        });

        const prepared = await prepareResponse.json();
        if (!prepareResponse.ok) {
          throw new Error(prepared.error || "Failed to prepare launch");
        }

        const tx = VersionedTransaction.deserialize(
          base64ToBytes(prepared.serializedTransactionBase64)
        );
        tx.sign([mintKeypair]);
        const signedTx = await signTransaction(tx);
        const signature = await connection.sendRawTransaction(
          signedTx.serialize()
        );
        await connection.confirmTransaction(signature, "confirmed");

        const confirmResponse = await fetch(`/api/agents/${agentId}/launch-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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
        });

        const confirmed = await confirmResponse.json();
        if (!confirmResponse.ok) {
          throw new Error(confirmed.error || "Failed to confirm launch");
        }

        setStatus(`Token launched: ${signature}`);
        router.refresh();
        return;
      }

      const decimals = 6;
      const lamports = await connection.getMinimumBalanceForRentExemption(
        MINT_SIZE
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
        createAssociatedTokenAccountInstruction(owner, destinationAta, owner, mint),
        createMintToInstruction(
          mint,
          destinationAta,
          owner,
          BigInt(directSupply) * 10n ** BigInt(decimals)
        )
      );
      transaction.feePayer = owner;
      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.partialSign(mintKeypair);

      const signed = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(signature, "confirmed");

      const confirmResponse = await fetch(`/api/agents/${agentId}/launch-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
      });

      const confirmed = await confirmResponse.json();
      if (!confirmResponse.ok) {
        throw new Error(confirmed.error || "Failed to confirm SPL launch");
      }

      setStatus(`SPL token launched: ${signature}`);
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Launch failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-ghost-gray/20 bg-ghost-gray/5 p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-headline text-sm font-bold uppercase tracking-[0.15em] text-neural-white">
            Token Launch
          </h2>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/35">
            Canary launch flow for owner wallets. Metadata is prepared server-side,
            then the launch is signed in Phantom and verified on-chain.
          </p>
        </div>
        {agentToken ? (
          <span className="border border-pulse-cyan/30 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-pulse-cyan">
            {agentToken.status}
          </span>
        ) : null}
      </div>

      <div className="mb-4 space-y-2 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/35">
        <p>
          Linked owner wallet:{" "}
          {linkedWalletAddress
            ? `${linkedWalletAddress.slice(0, 6)}...${linkedWalletAddress.slice(-4)}`
            : "not linked"}
        </p>
        {launchDisabledReason ? <p>{launchDisabledReason}</p> : null}
        {agentToken?.failure_reason ? <p>{agentToken.failure_reason}</p> : null}
      </div>

      {!existingTokenMint && (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={tokenName}
              onChange={(event) => setTokenName(event.target.value)}
              placeholder="Token name"
              disabled={Boolean(launchDisabledReason)}
              className="border border-ghost-gray/20 bg-void-black px-4 py-3 text-sm text-neural-white/75 outline-none"
            />
            <input
              value={tokenSymbol}
              onChange={(event) => setTokenSymbol(event.target.value.toUpperCase())}
              placeholder="Symbol"
              maxLength={10}
              disabled={Boolean(launchDisabledReason)}
              className="border border-ghost-gray/20 bg-void-black px-4 py-3 text-sm text-neural-white/75 outline-none"
            />
          </div>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe the token and the agent behind it..."
            disabled={Boolean(launchDisabledReason)}
            className="h-24 w-full border border-ghost-gray/20 bg-void-black px-4 py-3 text-sm text-neural-white/75 outline-none"
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              placeholder="Website"
              disabled={Boolean(launchDisabledReason)}
              className="border border-ghost-gray/20 bg-void-black px-4 py-3 text-sm text-neural-white/75 outline-none"
            />
            <input
              value={twitter}
              onChange={(event) => setTwitter(event.target.value)}
              placeholder="X URL"
              disabled={Boolean(launchDisabledReason)}
              className="border border-ghost-gray/20 bg-void-black px-4 py-3 text-sm text-neural-white/75 outline-none"
            />
            <input
              value={telegram}
              onChange={(event) => setTelegram(event.target.value)}
              placeholder="Telegram URL"
              disabled={Boolean(launchDisabledReason)}
              className="border border-ghost-gray/20 bg-void-black px-4 py-3 text-sm text-neural-white/75 outline-none"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <select
              value={provider}
              onChange={(event) =>
                setProvider(event.target.value as "pumpportal" | "direct_spl")
              }
              disabled={Boolean(launchDisabledReason)}
              className="border border-ghost-gray/20 bg-void-black px-4 py-3 font-mono text-xs uppercase tracking-[0.12em] text-neural-white/65 outline-none"
            >
              <option value="pumpportal">PumpPortal</option>
              <option value="direct_spl">Direct SPL</option>
            </select>
            <input
              value={tokenGateThreshold}
              onChange={(event) => setTokenGateThreshold(event.target.value)}
              placeholder="Gate threshold"
              disabled={Boolean(launchDisabledReason)}
              className="border border-ghost-gray/20 bg-void-black px-4 py-3 text-sm text-neural-white/75 outline-none"
            />
            {provider === "direct_spl" ? (
              <input
                value={directSupply}
                onChange={(event) => setDirectSupply(event.target.value)}
                placeholder="Initial supply"
                disabled={Boolean(launchDisabledReason)}
                className="border border-ghost-gray/20 bg-void-black px-4 py-3 text-sm text-neural-white/75 outline-none"
              />
            ) : (
              <input
                type="file"
                accept="image/*"
                disabled={Boolean(launchDisabledReason)}
                onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                className="border border-ghost-gray/20 bg-void-black px-4 py-3 text-sm text-neural-white/75 outline-none file:mr-3 file:border-0 file:bg-transparent file:font-mono file:text-xs file:uppercase file:tracking-[0.12em] file:text-neural-white/50"
              />
            )}
          </div>

          <Button
            variant="primary"
            size="sm"
            disabled={loading || !canLaunch || Boolean(launchDisabledReason)}
            onClick={handleLaunch}
          >
            {loading ? "Launching..." : "Launch Token"}
          </Button>
        </div>
      )}

      {status && (
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/40">
          {status}
        </p>
      )}
    </div>
  );
}
