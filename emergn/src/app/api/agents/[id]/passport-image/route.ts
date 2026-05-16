import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generatePassportImage } from "@/lib/higgsfield/passport-image";
import { isHiggsfieldConfigured } from "@/lib/higgsfield/client";

const REGEN_LIMIT = 3;

interface AgentRow {
  id: string;
  owner_id: string;
  codename: string | null;
  archetype: string | null;
  passport_image_url: string | null;
  passport_image_status: string | null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: agent } = await admin
    .from("agents")
    .select("id, owner_id, passport_image_url, passport_image_status")
    .eq("id", id)
    .maybeSingle();

  if (!agent || agent.owner_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    url: agent.passport_image_url,
    status: agent.passport_image_status ?? "pending",
  });
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isHiggsfieldConfigured()) {
    return NextResponse.json(
      { error: "Passport image rendering is not configured" },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: agent } = await admin
    .from("agents")
    .select("id, owner_id, codename, archetype, passport_image_url, passport_image_status")
    .eq("id", id)
    .maybeSingle<AgentRow>();

  if (!agent || agent.owner_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!agent.codename || !agent.archetype) {
    return NextResponse.json({ error: "Agent identity not ready" }, { status: 400 });
  }

  // Per-agent regeneration cap: count prior generation events.
  const { count } = await admin
    .from("agent_interactions")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", id)
    .eq("interaction_type", "passport_image_generated");

  if ((count ?? 0) >= REGEN_LIMIT) {
    return NextResponse.json(
      { error: `Regeneration limit reached (${REGEN_LIMIT})` },
      { status: 429 }
    );
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("x_handle")
    .eq("id", user.id)
    .maybeSingle<{ x_handle: string | null }>();

  const result = await generatePassportImage({
    agentId: agent.id,
    ownerId: user.id,
    codename: agent.codename,
    archetype: agent.archetype,
    ownerXHandle: profile?.x_handle ?? null,
    tier: "DORMANT",
  });

  if (result.status === "failed") {
    return NextResponse.json({ error: result.reason ?? "Generation failed" }, { status: 500 });
  }

  return NextResponse.json(result);
}
