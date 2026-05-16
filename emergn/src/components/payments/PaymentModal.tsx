"use client";

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
  } | null;
  linkedWalletAddress: string | null;
  disabledReason?: string | null;
}

export function PaymentModal({ open, onClose }: PaymentModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void-black/80 p-4">
      <div className="w-full max-w-xl border border-ghost-gray/20 bg-void-black p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-headline text-sm font-bold uppercase tracking-[0.15em] text-neural-white">
              Credits
            </h2>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/35">
              Credits are included with your account during launch.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
