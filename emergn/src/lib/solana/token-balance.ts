import { PublicKey } from "@solana/web3.js";
import { getSolanaConnection } from "@/lib/solana/connection";

export async function getSplTokenBalanceForOwner(options: {
  owner: string;
  mint: string;
}) {
  const connection = getSolanaConnection();
  const accounts = await connection.getParsedTokenAccountsByOwner(
    new PublicKey(options.owner),
    { mint: new PublicKey(options.mint) }
  );

  return accounts.value.reduce((total, account) => {
    const parsed = account.account.data.parsed;
    const amount = parsed?.info?.tokenAmount?.amount;
    return total + BigInt(typeof amount === "string" ? amount : "0");
  }, 0n);
}
