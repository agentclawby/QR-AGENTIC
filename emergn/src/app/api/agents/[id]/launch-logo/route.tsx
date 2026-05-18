import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ARCHETYPE_PALETTE: Record<string, { color: string; glyph: string }> = {
  ORACLE: { color: "#00F0FF", glyph: "◉" },
  HUNTER: { color: "#FF6B35", glyph: "◤" },
  SENTINEL: { color: "#8B5CF6", glyph: "◇" },
  DIPLOMAT: { color: "#E8E6E3", glyph: "◈" },
  GHOST: { color: "#6B7280", glyph: "◐" },
  EVOLVE: { color: "#00B4D8", glyph: "◎" },
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let name = "AGENT";
  let codename = "";
  let archetype = "GHOST";

  try {
    const admin = createAdminClient();
    const { data: agent } = await admin
      .from("agents")
      .select("name, codename, archetype")
      .eq("id", id)
      .maybeSingle();

    if (agent) {
      name = (agent.name ?? "AGENT").toUpperCase().slice(0, 18);
      codename = (agent.codename ?? "").toUpperCase();
      archetype = (agent.archetype ?? "GHOST").toUpperCase();
    }
  } catch (error) {
    console.error("[launch-logo] agent lookup failed:", error);
  }

  const palette = ARCHETYPE_PALETTE[archetype] ?? ARCHETYPE_PALETTE.GHOST;
  const sub = `${codename}${codename && archetype ? " // " : ""}${archetype}`.slice(0, 36);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0A0A0F",
          color: "#E8E6E3",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            bottom: 8,
            width: 4,
            backgroundColor: palette.color,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            right: 8,
            bottom: 8,
            border: "2px solid rgba(232,230,227,0.12)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 28,
            right: 28,
            fontSize: 14,
            color: "rgba(232,230,227,0.45)",
            letterSpacing: "0.2em",
          }}
        >
          EMERGN.
        </div>

        <div
          style={{
            position: "absolute",
            top: 100,
            fontSize: 280,
            color: `${palette.color}33`,
            lineHeight: 1,
          }}
        >
          {palette.glyph}
        </div>

        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            textAlign: "center",
            letterSpacing: "0.05em",
            zIndex: 2,
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontSize: 20,
            color: "rgba(232,230,227,0.55)",
            marginTop: 16,
            letterSpacing: "0.1em",
            zIndex: 2,
          }}
        >
          {sub}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 32,
            fontSize: 11,
            color: palette.color,
            letterSpacing: "0.2em",
          }}
        >
          LAUNCHED VIA EMERGN.ORG
        </div>
      </div>
    ),
    {
      width: 512,
      height: 512,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    },
  );
}
