import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSystemCapabilities } from "@/lib/config/features";
import {
  isTokenLaunchAllowed,
  preparePumpPortalLaunch,
} from "@/lib/tokens/launch";
import { getSolanaConnection } from "@/lib/solana/connection";

const prepareSchema = z.object({
  action: z.literal("prepare"),
  provider: z.enum(["pumpportal", "direct_spl"]),
  walletPublicKey: z.string().trim().min(32),
  mintPublicKey: z.string().trim().min(32),
  tokenName: z.string().trim().min(2).max(32),
  tokenSymbol: z.string().trim().min(2).max(10),
  description: z.string().trim().min(10).max(500),
  website: z.string().trim().optional(),
  twitter: z.string().trim().optional(),
  telegram: z.string().trim().optional(),
  imageDataUrl: z.string().optional(),
  devBuySol: z.number().min(0).max(10).default(0.01),
  tokenGateThreshold: z.number().int().min(0).default(0),
});

const confirmSchema = z.object({
  action: z.literal("confirm"),
  provider: z.enum(["pumpportal", "direct_spl"]),
  walletPublicKey: z.string().trim().min(32),
  mintPublicKey: z.string().trim().min(32),
  tokenName: z.string().trim().min(2).max(32),
  tokenSymbol: z.string().trim().min(2).max(10),
  metadataUri: z.string().trim().optional(),
  signature: z.string().trim().min(20),
  tokenGateThreshold: z.number().int().min(0).default(0),
});

const launchSchema = z.discriminatedUnion("action", [
  prepareSchema,
  confirmSchema,
]);

function getParsedTransactionAccounts(
  transaction: Awaited<ReturnType<ReturnType<typeof getSolanaConnection>["getParsedTransaction"]>>
) {
  const accountKeys = transaction?.transaction.message.accountKeys ?? [];

  return accountKeys.map((accountKey) => {
    if (typeof accountKey === "string") return accountKey;
    const parsedAccount = accountKey as {
      pubkey?: { toBase58: () => string };
    };
    return parsedAccount.pubkey?.toBase58() ?? "";
  });
}

function parsedTransactionHasSigner(
  transaction: Awaited<ReturnType<ReturnType<typeof getSolanaConnection>["getParsedTransaction"]>>,
  walletPublicKey: string
) {
  const accountKeys = transaction?.transaction.message.accountKeys ?? [];

  return accountKeys.some((accountKey) => {
    if (typeof accountKey === "string") return false;
    const parsedAccount = accountKey as {
      pubkey?: { toBase58: () => string };
      signer?: boolean;
    };

    return (
      Boolean(parsedAccount.signer) &&
      parsedAccount.pubkey?.toBase58() === walletPublicKey
    );
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    const supabase = await createClient();
    const admin = createAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = launchSchema.parse(await request.json());

    const [{ data: profile }, { data: agent }, { data: existingToken }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("wallet_address")
          .eq("id", user.id)
          .single(),
        admin
          .from("agents")
          .select("*")
          .eq("id", agentId)
          .eq("owner_id", user.id)
          .single(),
        admin
          .from("agent_tokens")
          .select("*")
          .eq("agent_id", agentId)
          .maybeSingle(),
      ]);

    if (!agent) {
      return NextResponse.json(
        { error: "Only the agent owner can launch a token" },
        { status: 403 }
      );
    }

    if (!profile?.wallet_address || profile.wallet_address !== body.walletPublicKey) {
      return NextResponse.json(
        { error: "Your connected wallet must match the linked owner wallet" },
        { status: 400 }
      );
    }

    const capabilities = getSystemCapabilities({
      walletAddress: profile.wallet_address,
    });

    if (!capabilities.token_launch.enabled) {
      return NextResponse.json(
        { error: capabilities.token_launch.reason },
        {
          status: isTokenLaunchAllowed(profile.wallet_address) ? 503 : 403,
        }
      );
    }

    if (existingToken?.status === "launched") {
      return NextResponse.json(
        { error: "This agent already has a launched token" },
        { status: 409 }
      );
    }

    if (body.action === "prepare") {
      if (body.provider === "pumpportal") {
        if (!body.imageDataUrl) {
          return NextResponse.json(
            { error: "An image is required for PumpPortal launches" },
            { status: 400 }
          );
        }

        const prepared = await preparePumpPortalLaunch({
          walletPublicKey: body.walletPublicKey,
          mintPublicKey: body.mintPublicKey,
          tokenName: body.tokenName,
          tokenSymbol: body.tokenSymbol,
          description: body.description,
          website: body.website,
          twitter: body.twitter,
          telegram: body.telegram,
          imageDataUrl: body.imageDataUrl,
          devBuySol: body.devBuySol,
        });

        await admin.from("agent_tokens").upsert(
          {
            agent_id: agentId,
            token_mint: body.mintPublicKey,
            token_symbol: body.tokenSymbol.toUpperCase(),
            token_name: body.tokenName,
            metadata_uri: prepared.metadataUri,
            launch_platform: "pumpportal",
            status: "prepared",
            dev_buy_sol: body.devBuySol,
            failure_reason: null,
          },
          { onConflict: "agent_id" }
        );

        return NextResponse.json({
          success: true,
          provider: "pumpportal",
          metadataUri: prepared.metadataUri,
          serializedTransactionBase64: prepared.serializedTransactionBase64,
        });
      }

      await admin.from("agent_tokens").upsert(
        {
          agent_id: agentId,
          token_mint: body.mintPublicKey,
          token_symbol: body.tokenSymbol.toUpperCase(),
          token_name: body.tokenName,
          launch_platform: "direct_spl",
          status: "prepared",
          dev_buy_sol: body.devBuySol,
          failure_reason: null,
        },
        { onConflict: "agent_id" }
      );

      return NextResponse.json({
        success: true,
        provider: "direct_spl",
      });
    }

    if (!existingToken) {
      return NextResponse.json(
        { error: "No prepared launch was found for this agent" },
        { status: 409 }
      );
    }

    const preparedLaunchMatches =
      existingToken.token_mint === body.mintPublicKey &&
      existingToken.launch_platform === body.provider &&
      existingToken.token_symbol === body.tokenSymbol.toUpperCase() &&
      existingToken.token_name === body.tokenName &&
      (body.provider !== "pumpportal" ||
        existingToken.metadata_uri === (body.metadataUri ?? null));

    if (!preparedLaunchMatches) {
      await admin
        .from("agent_tokens")
        .update({
          status: "failed",
          failure_reason:
            "Prepared launch metadata did not match the confirmation request.",
        })
        .eq("agent_id", agentId);

      return NextResponse.json(
        { error: "Launch confirmation did not match the prepared launch intent" },
        { status: 400 }
      );
    }

    await admin
      .from("agent_tokens")
      .update({
        launch_tx: body.signature,
        status: "submitted",
        failure_reason: null,
      })
      .eq("agent_id", agentId);

    const connection = getSolanaConnection();
    const confirmed = await connection.getParsedTransaction(body.signature, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });

    if (!confirmed || confirmed.meta?.err) {
      await admin
        .from("agent_tokens")
        .update({
          status: "submitted",
          failure_reason: "Launch transaction is submitted but not fully confirmed yet.",
        })
        .eq("agent_id", agentId);

      return NextResponse.json(
        { error: "Launch transaction has not confirmed yet" },
        { status: 409 }
      );
    }

    const transactionAccounts = getParsedTransactionAccounts(confirmed);
    const mintedToOwner = (confirmed.meta?.postTokenBalances ?? []).some(
      (balance) =>
        balance.mint === body.mintPublicKey &&
        balance.owner === body.walletPublicKey
    );

    if (
      !transactionAccounts.includes(body.mintPublicKey) ||
      !parsedTransactionHasSigner(confirmed, body.walletPublicKey) ||
      (body.provider === "direct_spl" && !mintedToOwner)
    ) {
      await admin
        .from("agent_tokens")
        .update({
          status: "failed",
          failure_reason:
            "The confirmed transaction did not match the prepared mint, owner wallet, or provider checks.",
        })
        .eq("agent_id", agentId);

      return NextResponse.json(
        { error: "Confirmed transaction failed launch verification checks" },
        { status: 400 }
      );
    }

    await Promise.all([
      admin.from("agent_tokens").upsert(
        {
          agent_id: agentId,
          token_mint: body.mintPublicKey,
          token_symbol: body.tokenSymbol.toUpperCase(),
          token_name: body.tokenName,
          metadata_uri: body.metadataUri ?? null,
          launch_platform: body.provider,
          launch_tx: body.signature,
          status: "launched",
          failure_reason: null,
        },
        { onConflict: "agent_id" }
      ),
      admin
        .from("agents")
        .update({
          token_mint: body.mintPublicKey,
          token_gate_threshold: body.tokenGateThreshold,
        })
        .eq("id", agentId),
      admin.from("agent_interactions").insert({
        agent_id: agentId,
        interaction_type: "token_launch",
        metadata: {
          provider: body.provider,
          tx_signature: body.signature,
          token_mint: body.mintPublicKey,
          token_gate_threshold: body.tokenGateThreshold,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      provider: body.provider,
      signature: body.signature,
    });
  } catch (error) {
    console.error("Launch token error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process token launch",
      },
      { status: 500 }
    );
  }
}
