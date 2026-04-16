import type { WalletPortfolioSnapshot } from "@/types";

interface HeliusBalanceItem {
  mint: string;
  balance: number;
  decimals: number;
  symbol?: string;
  name?: string;
  pricePerToken?: number;
  usdValue?: number;
}

interface HeliusHistoryItem {
  timestamp?: number;
  description?: string;
  type?: string;
  tokenTransfers?: Array<{
    mint?: string;
    tokenAmount?: number;
    fromUserAccount?: string;
    toUserAccount?: string;
  }>;
  nativeTransfers?: Array<{
    fromUserAccount?: string;
    toUserAccount?: string;
    amount?: number;
  }>;
  accountData?: Array<{
    account?: string;
    tokenBalanceChanges?: Array<{
      mint?: string;
      rawTokenAmount?: {
        tokenAmount?: string;
        decimals?: number;
      };
      userAccount?: string;
    }>;
  }>;
}

const STABLECOIN_SYMBOLS = new Set(["USDC", "USDT", "PYUSD", "USDH", "UXD", "USDS"]);

function getHeliusHeaders() {
  const apiKey = process.env.HELIUS_API_KEY;
  if (!apiKey) {
    throw new Error("HELIUS_API_KEY is not configured");
  }

  return {
    "X-API-Key": apiKey,
    "Content-Type": "application/json",
  };
}

async function heliusFetch<T>(path: string) {
  const response = await fetch(`https://api.helius.xyz${path}`, {
    headers: getHeliusHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Helius request failed (${response.status}): ${message || response.statusText}`);
  }

  return (await response.json()) as T;
}

function summarizeRecentActivity(history: HeliusHistoryItem[]) {
  return history.slice(0, 5).map((item) => {
    if (item.description) return item.description;
    if (item.type) return item.type;
    return "Observed recent wallet activity.";
  });
}

function normalizeBalances(items: HeliusBalanceItem[]) {
  return items
    .filter((item) => (item.usdValue ?? 0) > 0)
    .sort((a, b) => (b.usdValue ?? 0) - (a.usdValue ?? 0))
    .map((item) => ({
      mint: item.mint,
      symbol: item.symbol ?? "UNKNOWN",
      name: item.name ?? item.symbol ?? "Unknown token",
      amount: item.balance,
      usdValue: item.usdValue ?? 0,
      pricePerToken: item.pricePerToken ?? 0,
    }));
}

function computeHeuristicPnl(
  balances: ReturnType<typeof normalizeBalances>,
  history: HeliusHistoryItem[]
) {
  const solPrice =
    balances.find((item) => item.symbol === "SOL")?.pricePerToken ?? 0;
  const buyCostUsd: Record<string, number> = {};
  const totalBought: Record<string, number> = {};
  const totalSold: Record<string, number> = {};
  const sellProceedsUsd: Record<string, number> = {};
  let matchedSwaps = 0;

  for (const event of history) {
    const tokenChanges = new Map<string, number>();

    for (const account of event.accountData ?? []) {
      for (const change of account.tokenBalanceChanges ?? []) {
        if (!change.mint) continue;
        const amount = Number(change.rawTokenAmount?.tokenAmount ?? "0");
        const decimals = change.rawTokenAmount?.decimals ?? 0;
        if (!amount) continue;
        const normalized = amount / 10 ** decimals;
        tokenChanges.set(change.mint, (tokenChanges.get(change.mint) ?? 0) + normalized);
      }
    }

    const positiveChanges = Array.from(tokenChanges.entries()).filter(([, amount]) => amount > 0);
    const negativeChanges = Array.from(tokenChanges.entries()).filter(([, amount]) => amount < 0);

    const stableOrSolOutflowUsd =
      Math.abs(
        negativeChanges.reduce((total, [mint, amount]) => {
          const balance = balances.find((item) => item.mint === mint);
          if (!balance) return total;
          if (STABLECOIN_SYMBOLS.has(balance.symbol)) {
            return total + Math.abs(amount);
          }
          if (balance.symbol === "SOL") {
            return total + Math.abs(amount) * solPrice;
          }
          return total;
        }, 0)
      ) || 0;

    const stableOrSolInflowUsd =
      positiveChanges.reduce((total, [mint, amount]) => {
        const balance = balances.find((item) => item.mint === mint);
        if (!balance) return total;
        if (STABLECOIN_SYMBOLS.has(balance.symbol)) {
          return total + amount;
        }
        if (balance.symbol === "SOL") {
          return total + amount * solPrice;
        }
        return total;
      }, 0) || 0;

    for (const [mint, amount] of positiveChanges) {
      const balance = balances.find((item) => item.mint === mint);
      if (!balance || STABLECOIN_SYMBOLS.has(balance.symbol) || balance.symbol === "SOL") {
        continue;
      }
      totalBought[mint] = (totalBought[mint] ?? 0) + amount;
      if (stableOrSolOutflowUsd > 0) {
        buyCostUsd[mint] = (buyCostUsd[mint] ?? 0) + stableOrSolOutflowUsd;
        matchedSwaps += 1;
      }
    }

    for (const [mint, amount] of negativeChanges) {
      const balance = balances.find((item) => item.mint === mint);
      if (!balance || STABLECOIN_SYMBOLS.has(balance.symbol) || balance.symbol === "SOL") {
        continue;
      }
      totalSold[mint] = (totalSold[mint] ?? 0) + Math.abs(amount);
      if (stableOrSolInflowUsd > 0) {
        sellProceedsUsd[mint] =
          (sellProceedsUsd[mint] ?? 0) + stableOrSolInflowUsd;
      }
    }
  }

  let estimatedCostBasisUsd = 0;
  let estimatedUnrealizedPnlUsd = 0;
  let estimatedRealizedPnlUsd = 0;

  for (const holding of balances) {
    if (STABLECOIN_SYMBOLS.has(holding.symbol) || holding.symbol === "SOL") {
      continue;
    }

    const bought = totalBought[holding.mint] ?? 0;
    const avgEntryUsd = bought > 0 ? (buyCostUsd[holding.mint] ?? 0) / bought : holding.pricePerToken;
    const remainingCostBasis = holding.amount * avgEntryUsd;
    estimatedCostBasisUsd += remainingCostBasis;
    estimatedUnrealizedPnlUsd += holding.usdValue - remainingCostBasis;
    estimatedRealizedPnlUsd +=
      (sellProceedsUsd[holding.mint] ?? 0) -
      (totalSold[holding.mint] ?? 0) * avgEntryUsd;
  }

  const confidence =
    matchedSwaps >= 12 ? "high" : matchedSwaps >= 5 ? "medium" : "low";

  return {
    estimatedCostBasisUsd,
    estimatedUnrealizedPnlUsd,
    estimatedRealizedPnlUsd,
    confidence: confidence as WalletPortfolioSnapshot["confidence"],
  };
}

export async function buildWalletPortfolioSnapshot(walletAddress: string) {
  const balancesPayload = await heliusFetch<{
    balances?: HeliusBalanceItem[];
    totalUsdValue?: number;
  }>(`/v1/wallet/${walletAddress}/balances`);
  const historyPayload = await heliusFetch<HeliusHistoryItem[]>(
    `/v1/wallet/${walletAddress}/history?limit=100`
  );

  const holdings = normalizeBalances(balancesPayload.balances ?? []);
  const totalUsdValue =
    balancesPayload.totalUsdValue ??
    holdings.reduce((total, item) => total + item.usdValue, 0);

  const top3Usd = holdings.slice(0, 3).reduce((total, item) => total + item.usdValue, 0);
  const stablecoinUsd = holdings.reduce((total, item) => {
    return STABLECOIN_SYMBOLS.has(item.symbol) ? total + item.usdValue : total;
  }, 0);

  const pnl = computeHeuristicPnl(holdings, historyPayload);

  return {
    holdings,
    totalUsdValue,
    concentrationTop3Pct: totalUsdValue > 0 ? (top3Usd / totalUsdValue) * 100 : 0,
    stablecoinRatioPct: totalUsdValue > 0 ? (stablecoinUsd / totalUsdValue) * 100 : 0,
    estimatedCostBasisUsd: pnl.estimatedCostBasisUsd,
    estimatedUnrealizedPnlUsd: pnl.estimatedUnrealizedPnlUsd,
    estimatedRealizedPnlUsd: pnl.estimatedRealizedPnlUsd,
    confidence: pnl.confidence,
    disclaimer:
      "PnL and cost basis are heuristic estimates derived from wallet activity and current prices. They are not accounting-grade and may miss transfers or off-platform history.",
    recentActivitySummary: summarizeRecentActivity(historyPayload),
  } satisfies WalletPortfolioSnapshot;
}
