export interface TokenMarketSnapshot {
  priceUsd: number | null;
  fdvUsd: number | null;
  liquidityUsd: number | null;
  holders: number | null;
  volume24hUsd: number | null;
}

async function fetchBirdeyeJson<T>(path: string) {
  const apiKey = process.env.BIRDEYE_API_KEY;
  if (!apiKey) {
    return null;
  }

  const response = await fetch(`https://public-api.birdeye.so${path}`, {
    headers: {
      "X-API-KEY": apiKey,
      "x-chain": "solana",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
}

export async function fetchTokenMarketSnapshot(
  mint: string
): Promise<TokenMarketSnapshot> {
  const [overviewPayload, holderPayload, liquidityPayload] = await Promise.all([
    fetchBirdeyeJson<{
      data?: {
        price?: number;
        fdv?: number;
        volume24hUSD?: number;
      };
    }>(`/defi/token_overview?address=${mint}`),
    fetchBirdeyeJson<{
      data?: {
        totalHolders?: number;
      };
    }>(`/defi/v3/token/holder?address=${mint}`),
    fetchBirdeyeJson<{
      data?: {
        exitLiquidity?: number;
      };
    }>(`/defi/v3/token/exit-liquidity?address=${mint}`),
  ]);

  return {
    priceUsd: overviewPayload?.data?.price ?? null,
    fdvUsd: overviewPayload?.data?.fdv ?? null,
    liquidityUsd: liquidityPayload?.data?.exitLiquidity ?? null,
    holders: holderPayload?.data?.totalHolders ?? null,
    volume24hUsd: overviewPayload?.data?.volume24hUSD ?? null,
  };
}
