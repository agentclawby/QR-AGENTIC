export const CREDIT_PACKS = {
  starter: {
    id: "starter",
    label: "Starter Pack",
    amountTokens: 10,
    premiumCredits: 5,
    trainingCredits: 2,
  },
  pro: {
    id: "pro",
    label: "Pro Pack",
    amountTokens: 25,
    premiumCredits: 15,
    trainingCredits: 6,
  },
  whale: {
    id: "whale",
    label: "Whale Pack",
    amountTokens: 50,
    premiumCredits: 35,
    trainingCredits: 15,
  },
} as const;

export type CreditPackId = keyof typeof CREDIT_PACKS;

export function getCreditPackAmountBaseUnits(packId: CreditPackId) {
  const decimals = Number(process.env.EMRG_TOKEN_DECIMALS ?? "6");
  const pack = CREDIT_PACKS[packId];
  return BigInt(pack.amountTokens) * 10n ** BigInt(decimals);
}
