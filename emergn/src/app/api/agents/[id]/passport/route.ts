import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  SOLANA_AUTH_NONCE_COOKIE,
  verifySolanaAuthMessage,
} from "@/lib/auth/solana-auth";
import { generatePassportImage } from "@/lib/higgsfield/passport-image";
import { isHiggsfieldConfigured } from "@/lib/higgsfield/client";

const passportSchema = z.object({
  publicKey: z.string().trim().min(32),
  signature: z.string().trim().min(20),
  message: z.string().trim().min(20),
  nonce: z.string().trim().min(16),
});

function withClearedNonce(response: NextResponse) {
  response.cookies.set(SOLANA_AUTH_NONCE_COOKIE, "", {
    path: "/",
    maxAge: 0,
  });
  return response;
}

function jsonWithClearedNonce(
  body: Record<string, unknown>,
  init?: ResponseInit
) {
  return withClearedNonce(NextResponse.json(body, init));
}

function buildPassportUid(agentId: string, ownerWallet: string) {
  const digest = createHash("sha256")
    .update(`${agentId}:${ownerWallet}`)
    .digest("hex")
    .slice(0, 10)
    .toUpperCase();

  return `EMRG-${digest}`;
}

function buildProofHash(input: {
  agentId: string;
  ownerId: string;
  ownerWallet: string;
  messageText: string;
  signature: string;
}) {
  return `0x${createHash("sha256")
    .update(
      [
        input.agentId,
        input.ownerId,
        input.ownerWallet,
        input.messageText,
        input.signature,
      ].join(":")
    )
    .digest("hex")}`;
}

export async function POST(
  request: NextRequest,
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
      return jsonWithClearedNonce({ error: "Not authenticated" }, { status: 401 });
    }

    const body = passportSchema.parse(await request.json());
    const expectedNonce = request.cookies.get(SOLANA_AUTH_NONCE_COOKIE)?.value;

    if (body.nonce !== expectedNonce) {
      return jsonWithClearedNonce(
        { error: "Missing or expired nonce. Please request a new signature." },
        { status: 401 }
      );
    }

    const [{ data: agent }, { data: profile }, { data: existingPassport }] =
      await Promise.all([
        admin
          .from("agents")
          .select("id, owner_id, codename, archetype, passport_image_url, passport_image_status")
          .eq("id", agentId)
          .single(),
        supabase
          .from("profiles")
          .select("id, wallet_address, x_handle")
          .eq("id", user.id)
          .single(),
        admin
          .from("agent_passports")
          .select("*")
          .eq("agent_id", agentId)
          .maybeSingle(),
      ]);

    if (!agent || agent.owner_id !== user.id) {
      return jsonWithClearedNonce(
        { error: "Only the agent owner can issue a passport" },
        { status: 403 }
      );
    }

    if (!profile?.wallet_address || profile.wallet_address !== body.publicKey) {
      return jsonWithClearedNonce(
        { error: "Your linked owner wallet must match the signing wallet" },
        { status: 400 }
      );
    }

    const verification = verifySolanaAuthMessage({
      publicKey: body.publicKey,
      signature: body.signature,
      message: body.message,
      expectedNonce,
      expectedIntent: "issue-passport",
      expectedUserId: user.id,
      expectedAgentId: agentId,
      request,
    });

    if (!verification.valid || !verification.messageText) {
      return jsonWithClearedNonce(
        { error: verification.error ?? "Invalid passport signature" },
        { status: 401 }
      );
    }

    if (
      existingPassport &&
      existingPassport.owner_wallet !== body.publicKey
    ) {
      return jsonWithClearedNonce(
        {
          error:
            "This agent already has a passport issued to a different owner wallet.",
        },
        { status: 409 }
      );
    }

    const passportUid =
      existingPassport?.passport_uid ?? buildPassportUid(agentId, body.publicKey);
    const proofHash = buildProofHash({
      agentId,
      ownerId: user.id,
      ownerWallet: body.publicKey,
      messageText: verification.messageText,
      signature: body.signature,
    });

    // Resolve the passport image URL: prefer the already-generated one. If
    // the agent was forged before passport-image rollout (or generation
    // failed), attempt a synchronous render so the issued passport ships
    // with a visual. Failures here are non-fatal — the passport still issues.
    let passportImageUrl = agent.passport_image_url ?? null;
    if (!passportImageUrl && isHiggsfieldConfigured() && agent.codename && agent.archetype) {
      const result = await generatePassportImage({
        agentId,
        ownerId: user.id,
        codename: agent.codename,
        archetype: agent.archetype,
        ownerXHandle: profile?.x_handle ?? null,
        tier: "DORMANT",
        passportUid,
      });
      if (result.status === "ready" && result.url) {
        passportImageUrl = result.url;
      }
    }

    const { data: passport, error } = await admin
      .from("agent_passports")
      .upsert(
        {
          agent_id: agentId,
          owner_id: user.id,
          owner_wallet: body.publicKey,
          passport_uid: passportUid,
          proof_hash: proofHash,
          status: "issued",
          passport_image_url: passportImageUrl,
        },
        { onConflict: "agent_id" }
      )
      .select("*")
      .single();

    if (error || !passport) {
      return jsonWithClearedNonce(
        { error: "Failed to issue Agent Passport" },
        { status: 500 }
      );
    }

    await admin.from("agent_interactions").insert({
      agent_id: agentId,
      interaction_type: "passport_issue",
      metadata: {
        passport_id: passport.id,
        passport_uid: passport.passport_uid,
        owner_wallet: body.publicKey,
      },
    });

    return withClearedNonce(
      NextResponse.json({
        success: true,
        passport,
        duplicate: Boolean(existingPassport),
      })
    );
  } catch (error) {
    console.error("Passport issue error:", error);
    return jsonWithClearedNonce(
      {
        error:
          error instanceof Error ? error.message : "Failed to issue passport",
      },
      { status: 500 }
    );
  }
}
