import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchTokenMarketSnapshot } from "@/lib/tokens/market";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    const admin = createAdminClient();

    const [{ data: agent }, { data: agentToken }] = await Promise.all([
      admin.from("agents").select("token_gate_threshold").eq("id", agentId).single(),
      admin.from("agent_tokens").select("*").eq("agent_id", agentId).maybeSingle(),
    ]);

    if (!agentToken) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    const market =
      agentToken.status === "launched"
        ? await fetchTokenMarketSnapshot(agentToken.token_mint)
        : {
            priceUsd: null,
            fdvUsd: null,
            liquidityUsd: null,
            holders: null,
            volume24hUsd: null,
          };

    return NextResponse.json({
      success: true,
      token: agentToken,
      market,
      tokenGateThreshold: agent?.token_gate_threshold ?? 0,
    });
  } catch (error) {
    console.error("Token info error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch token info",
      },
      { status: 500 }
    );
  }
}
