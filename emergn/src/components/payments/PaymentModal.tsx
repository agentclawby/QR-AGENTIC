"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { PublicKey, Transaction } from "@solana/web3.js";
import { Button } from "@/components/ui/Button";

interface CreditPack {
  id: "starter" | "pro" | "whale";
  label: string;
  amountTokens: number;
  premiumCredits: number;
  trainingCredits: number;
}

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
  packs: CreditPack[];
  paymentConfig: {
    emrgMint: string | null;
    treasuryWallet: string | null;
    tokenDecimals: number;
  };
  linkedWalletAddress: string | null;
  disabledReason?: string | null;
}

export function PaymentModal({
  open,
  onClose,
  onVerified,
  packs,
  paymentConfig,
  linkedWalletAddress,
  disabledReason = null,
}: PaymentModalProps) {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [selectedPack, setSelectedPack] = useState<CreditPack["id"]>("starter");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const walletMismatch =
    publicKey &&
    linkedWalletAddress &&
    publicKey.toBase58() !== linkedWalletAddress
      ? "The connected wallet does not match your linked wallet."
      : null;
  const paymentDisabledReason =
    disabledReason ??
    (!linkedWalletAddress
      ? "Link a wallet in Settings before buying credits."
      : walletMismatch);

  if (!open) return null;

  const handlePay = async () => {
    if (paymentDisabledReason) {
      setStatus(paymentDisabledReason);
      return;
    }

    if (!publicKey || !signTransaction) {
      setStatus("Connect a signing wallet first.");
      return;
    }

    if (!paymentConfig.emrgMint || !paymentConfig.treasuryWallet) {
      setStatus("Payment config is missing.");
      return;
    }

    const pack = packs.find((item) => item.id === selectedPack);
    if (!pack) return;

    setLoading(true);
    setStatus(null);

    try {
      const mint = new PublicKey(paymentConfig.emrgMint);
      const treasury = new PublicKey(paymentConfig.treasuryWallet);
      const sourceAta = getAssociatedTokenAddressSync(mint, publicKey);
      const destinationAta = getAssociatedTokenAddressSync(mint, treasury, true);
      const transaction = new Transaction();
      const destinationInfo = await connection.getAccountInfo(destinationAta);

      if (!destinationInfo) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            destinationAta,
            treasury,
            mint
          )
        );
      }

      const amount =
        BigInt(pack.amountTokens) *
        10n ** BigInt(paymentConfig.tokenDecimals);

      transaction.add(
        createTransferCheckedInstruction(
          sourceAta,
          mint,
          destinationAta,
          publicKey,
          amount,
          paymentConfig.tokenDecimals
        )
      );

      transaction.feePayer = publicKey;
      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;

      const signed = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(signature, "confirmed");

      const prepareResponse = await fetch("/api/payments/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "prepare",
          signature,
          packId: pack.id,
        }),
      });

      const prepared = await prepareResponse.json();
      if (!prepareResponse.ok) {
        throw new Error(prepared.error || "Failed to register payment");
      }

      const verifyResponse = await fetch("/api/payments/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "confirm",
          signature,
          packId: pack.id,
        }),
      });

      const verified = await verifyResponse.json();
      if (!verifyResponse.ok) {
        throw new Error(verified.error || "Failed to verify payment");
      }

      setStatus("Credits added.");
      onVerified();
      onClose();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void-black/80 p-4">
      <div className="w-full max-w-xl border border-ghost-gray/20 bg-void-black p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-headline text-sm font-bold uppercase tracking-[0.15em] text-neural-white">
              Buy Credits
            </h2>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/35">
              Pay in $EMRG to top up premium and training credits.
            </p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/30">
              Linked wallet:{" "}
              {linkedWalletAddress
                ? `${linkedWalletAddress.slice(0, 6)}...${linkedWalletAddress.slice(-4)}`
                : "not linked"}
            </p>
            {paymentDisabledReason ? (
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/35">
                {paymentDisabledReason}
              </p>
            ) : null}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="space-y-3">
          {packs.map((pack) => (
            <label
              key={pack.id}
              className={`flex cursor-pointer items-center justify-between border p-4 ${
                selectedPack === pack.id
                  ? "border-pulse-cyan bg-pulse-cyan/5"
                  : "border-ghost-gray/20 bg-ghost-gray/5"
              }`}
            >
              <div>
                <p className="font-headline text-xs font-bold uppercase tracking-[0.12em] text-neural-white">
                  {pack.label}
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/35">
                  {pack.premiumCredits} premium · {pack.trainingCredits} training
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs uppercase tracking-[0.12em] text-pulse-cyan">
                  {pack.amountTokens} $EMRG
                </span>
                <input
                  type="radio"
                  checked={selectedPack === pack.id}
                  onChange={() => setSelectedPack(pack.id)}
                  disabled={Boolean(paymentDisabledReason)}
                  className="accent-pulse-cyan"
                />
              </div>
            </label>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between">
          {status ? (
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/40">
              {status}
            </p>
          ) : (
            <div />
          )}
          <Button
            variant="primary"
            size="sm"
            disabled={loading || Boolean(paymentDisabledReason)}
            onClick={handlePay}
          >
            {loading ? "Processing..." : "Pay with $EMRG"}
          </Button>
        </div>
      </div>
    </div>
  );
}
