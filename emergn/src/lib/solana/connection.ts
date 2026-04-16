import { clusterApiUrl, Connection } from "@solana/web3.js";

export function getSolanaEndpoint() {
  return (
    process.env.SOLANA_RPC_URL ||
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    clusterApiUrl("mainnet-beta")
  );
}

export function getSolanaConnection() {
  return new Connection(getSolanaEndpoint(), "confirmed");
}
