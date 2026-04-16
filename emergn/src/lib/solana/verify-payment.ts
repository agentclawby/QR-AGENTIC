import { getSolanaConnection } from "@/lib/solana/connection";

interface VerifyPaymentOptions {
  signature: string;
  expectedMint: string;
  treasuryOwner: string;
  senderOwner?: string | null;
  expectedAmount?: bigint;
}

function sumTokenBalance(
  balances:
    | Array<{
        mint?: string;
        owner?: string;
        uiTokenAmount?: { amount?: string };
      }>
    | null
    | undefined,
  owner: string,
  mint: string
) {
  return (balances ?? []).reduce((total, balance) => {
    if (balance.owner !== owner || balance.mint !== mint) return total;
    return total + BigInt(balance.uiTokenAmount?.amount ?? "0");
  }, 0n);
}

export async function verifySplPayment(options: VerifyPaymentOptions) {
  const connection = getSolanaConnection();
  const transaction = await connection.getParsedTransaction(options.signature, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed",
  });

  if (!transaction || !transaction.meta || transaction.meta.err) {
    throw new Error("Transaction not found or not confirmed");
  }

  const treasuryBefore = sumTokenBalance(
    transaction.meta.preTokenBalances,
    options.treasuryOwner,
    options.expectedMint
  );
  const treasuryAfter = sumTokenBalance(
    transaction.meta.postTokenBalances,
    options.treasuryOwner,
    options.expectedMint
  );
  const treasuryDelta = treasuryAfter - treasuryBefore;

  if (treasuryDelta <= 0n) {
    throw new Error("Treasury did not receive the expected SPL token transfer");
  }

  let senderDelta: bigint | null = null;
  if (options.senderOwner) {
    const senderBefore = sumTokenBalance(
      transaction.meta.preTokenBalances,
      options.senderOwner,
      options.expectedMint
    );
    const senderAfter = sumTokenBalance(
      transaction.meta.postTokenBalances,
      options.senderOwner,
      options.expectedMint
    );
    senderDelta = senderAfter - senderBefore;

    if (senderDelta >= 0n) {
      throw new Error("Sender balance did not decrease");
    }
  }

  if (
    typeof options.expectedAmount !== "undefined" &&
    treasuryDelta < options.expectedAmount
  ) {
    throw new Error("Transferred amount is lower than expected");
  }

  return {
    signature: options.signature,
    amount: treasuryDelta,
    senderDelta,
    slot: transaction.slot,
  };
}
