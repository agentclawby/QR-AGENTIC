import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// PATCH accepts EITHER a rename OR an enrichment update. Both kept in one
// endpoint because they're both owner-only, low-frequency, and target the same
// row — splitting would just add a second auth path to maintain.
const renameSchema = z.object({
  name: z.string().trim().min(2).max(30),
});

const personaSchema = z.object({
  backstory: z.string().max(4000).optional(),
  beliefs: z.string().max(2000).optional(),
  opinions: z.string().max(4000).optional(),
  quirks: z.string().max(1500).optional(),
  do_not_say: z.string().max(1500).optional(),
  style_exemplars: z
    .array(z.string().trim().min(1).max(500))
    .max(10)
    .optional(),
});

async function requireOwner(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }
  const admin = createAdminClient();
  const { data: agent } = await admin
    .from("agents")
    .select("id, owner_id")
    .eq("id", id)
    .maybeSingle();
  if (!agent || agent.owner_id !== user.id) {
    return {
      error: NextResponse.json({ error: "Not found" }, { status: 404 }),
    };
  }
  return { user, admin, agent };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await requireOwner(id);
  if (ctx.error) return ctx.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Branch by presence of the `name` field. A persona update should never
  // collide with a rename — clients send one or the other.
  const isRename =
    typeof (body as { name?: unknown } | null)?.name === "string";

  if (isRename) {
    const parsed = renameSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { error } = await ctx.admin
      .from("agents")
      .update({ name: parsed.data.name })
      .eq("id", id)
      .eq("owner_id", ctx.user.id);

    if (error) {
      return NextResponse.json({ error: "Rename failed" }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  const parsed = personaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const update: Record<string, unknown> = {
    persona_updated_at: new Date().toISOString(),
  };
  if (parsed.data.backstory !== undefined) update.backstory = parsed.data.backstory;
  if (parsed.data.beliefs !== undefined) update.beliefs = parsed.data.beliefs;
  if (parsed.data.opinions !== undefined) update.opinions = parsed.data.opinions;
  if (parsed.data.quirks !== undefined) update.quirks = parsed.data.quirks;
  if (parsed.data.do_not_say !== undefined)
    update.do_not_say = parsed.data.do_not_say;
  if (parsed.data.style_exemplars !== undefined)
    update.style_exemplars = parsed.data.style_exemplars;

  const { data, error } = await ctx.admin
    .from("agents")
    .update(update)
    .eq("id", id)
    .eq("owner_id", ctx.user.id)
    .select(
      "backstory, beliefs, opinions, quirks, do_not_say, style_exemplars, persona_updated_at"
    )
    .single();

  if (error) {
    // PGRST204 ("schema cache missing column") = migration 012 hasn't been
    // applied yet. Surface a useful message rather than a generic 500.
    const message =
      (error as { code?: string; message?: string }).code === "PGRST204"
        ? "Persona enrichment columns are missing. Apply migration 012_persona_enrichment_and_replies.sql."
        : "Persona save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ success: true, persona: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await requireOwner(id);
  if (ctx.error) return ctx.error;

  // FK cascades remove sentience_scores, feed_posts, agent_interactions,
  // agent_passports, agent_drafts, training_sessions, agent_posts, etc.
  const { error } = await ctx.admin
    .from("agents")
    .delete()
    .eq("id", id)
    .eq("owner_id", ctx.user.id);

  if (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
