"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PaymentModal } from "@/components/payments/PaymentModal";
import type { CapabilityStatus, UserCreditBalance } from "@/types";

interface CreditPack {
  id: "starter" | "pro" | "whale";
  label: string;
  amountTokens: number;
  premiumCredits: number;
  trainingCredits: number;
}

interface CreditBalanceResponse {
  credits: UserCreditBalance;
  packs: CreditPack[];
  paymentConfig: {
    emrgMint: string | null;
    treasuryWallet: string | null;
    tokenDecimals: number;
  };
  paymentCapability: CapabilityStatus;
  linkedWalletAddress: string | null;
}

export function CreditBalance() {
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<CreditBalanceResponse | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/payments/balance");
      const payload = await response.json();
      if (response.ok) {
        setData(payload as CreditBalanceResponse);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (loading || !data) {
    return (
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/30">
        Credits loading...
      </span>
    );
  }

  const disabledReason = !data.paymentCapability.enabled
    ? data.paymentCapability.reason
    : !data.linkedWalletAddress
      ? "Link a wallet in Settings before buying credits."
      : null;

  return (
    <>
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/35">
          Premium {data.credits.premium_credits} · Training {data.credits.training_credits}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={Boolean(disabledReason)}
          onClick={() => setOpen(true)}
        >
          Buy Credits
        </Button>
      </div>
      {disabledReason ? (
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/35">
          {disabledReason}
        </p>
      ) : null}
      <PaymentModal
        open={open}
        onClose={() => setOpen(false)}
        onVerified={load}
        packs={data.packs}
        paymentConfig={data.paymentConfig}
        linkedWalletAddress={data.linkedWalletAddress}
        disabledReason={disabledReason}
      />
    </>
  );
}
