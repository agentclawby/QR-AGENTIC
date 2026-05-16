import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSystemCapabilities } from "@/lib/config/features";
import type { SystemHealth } from "@/types";

const REQUIRED_TABLES = [
  "profiles",
  "agents",
  "sentience_scores",
  "user_credit_balances",
  "agent_passports",
] as const;

type RequiredTable = (typeof REQUIRED_TABLES)[number];

let cachedMigrations: SystemHealth["migrationsApplied"] | null = null;

async function checkMigrations(): Promise<SystemHealth["migrationsApplied"]> {
  if (cachedMigrations) return cachedMigrations;

  const admin = createAdminClient();
  const result: Record<RequiredTable, boolean> = {
    profiles: false,
    agents: false,
    sentience_scores: false,
    user_credit_balances: false,
    agent_passports: false,
  };

  // A cheap head-count probe per table tells us whether the table exists
  // without depending on information_schema permissions for the service role.
  await Promise.all(
    REQUIRED_TABLES.map(async (table) => {
      const { error } = await admin
        .from(table)
        .select("*", { count: "exact", head: true });
      result[table] = !error;
    })
  );

  cachedMigrations = result;
  return result;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let profile: {
      wallet_address: string | null;
      x_handle: string | null;
    } | null = null;
    let creditsExist = false;
    let dbStatus: SystemHealth["db"] = "ok";
    const notes: string[] = [];

    if (user) {
      const profilePromise = supabase
        .from("profiles")
        .select("wallet_address, x_handle")
        .eq("id", user.id)
        .maybeSingle();

      const creditsPromise = supabase
        .from("user_credit_balances")
        .select("user_id", { head: true, count: "exact" })
        .eq("user_id", user.id);

      const [profileResult, creditsResult] = await Promise.all([
        profilePromise,
        creditsPromise,
      ]);

      if (profileResult.error) {
        dbStatus = "error";
        notes.push(`profiles read failed: ${profileResult.error.message}`);
      }
      profile = profileResult.data;

      if (creditsResult.error) {
        notes.push(`credits read failed: ${creditsResult.error.message}`);
      } else {
        creditsExist = (creditsResult.count ?? 0) > 0;
      }
    }

    const migrationsApplied = await checkMigrations();
    if (Object.values(migrationsApplied).some((v) => !v)) {
      dbStatus = dbStatus === "ok" ? "error" : dbStatus;
      const missing = (Object.entries(migrationsApplied) as [string, boolean][])
        .filter(([, ok]) => !ok)
        .map(([t]) => t);
      notes.push(
        `Missing tables: ${missing.join(", ")} — apply migrations under supabase/migrations/`
      );
    }

    const health: SystemHealth = {
      db: dbStatus,
      profileExists: Boolean(profile),
      creditsExist,
      migrationsApplied,
      notes,
    };

    return NextResponse.json({
      success: true,
      capabilities: getSystemCapabilities({
        walletAddress: profile?.wallet_address ?? null,
      }),
      linkedAccounts: {
        walletAddress: profile?.wallet_address ?? null,
        xHandle: profile?.x_handle ?? null,
      },
      health,
    });
  } catch (error) {
    console.error("System capabilities error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load system capabilities",
      },
      { status: 500 }
    );
  }
}
