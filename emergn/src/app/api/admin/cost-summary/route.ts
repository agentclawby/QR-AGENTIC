import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminAccessError, requireAdmin } from "@/lib/admin";
import { getUsageSummary } from "@/lib/usage";

interface BudgetWarning {
  provider: "anthropic" | "twitterapi";
  level: "ok" | "warn" | "critical";
  used: number;
  limit: number;
  unit: string;
  message: string;
}

function pct(used: number, limit: number) {
  if (!Number.isFinite(limit) || limit <= 0) return 0;
  return Math.min(1, used / limit);
}

function classify(ratio: number): "ok" | "warn" | "critical" {
  if (ratio >= 0.9) return "critical";
  if (ratio >= 0.7) return "warn";
  return "ok";
}

export async function GET() {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await requireAdmin(admin, { user });

    const summary = await getUsageSummary(admin);
    const usdPer1k = Number(process.env.ANTHROPIC_USD_PER_1K_TOKENS ?? "0.009");
    const todayUsd = (summary.today.anthropic_tokens / 1000) * usdPer1k;
    const last7Usd = (summary.last7.anthropic_tokens / 1000) * usdPer1k;

    // Provider budget signals — operator-only. These let the operator see
    // when an upstream API is approaching its soft ceiling, without ever
    // surfacing the alert to end users.
    const warnings: BudgetWarning[] = [];

    const monthlyBudgetUsd = Number(process.env.MONTHLY_BUDGET_USD ?? "0");
    if (monthlyBudgetUsd > 0) {
      const ratio = pct(last7Usd * (30 / 7), monthlyBudgetUsd);
      const level = classify(ratio);
      if (level !== "ok") {
        warnings.push({
          provider: "anthropic",
          level,
          used: Number((last7Usd * (30 / 7)).toFixed(2)),
          limit: monthlyBudgetUsd,
          unit: "USD",
          message:
            level === "critical"
              ? "Anthropic spend is on track to exceed monthly budget. Top up or tighten user caps."
              : "Anthropic spend is approaching the monthly budget.",
        });
      }
    }

    const twitterDailyBudget = Number(
      process.env.TWITTERAPI_DAILY_BUDGET ?? "0",
    );
    if (twitterDailyBudget > 0) {
      const ratio = pct(summary.today.x_calls, twitterDailyBudget);
      const level = classify(ratio);
      if (level !== "ok") {
        warnings.push({
          provider: "twitterapi",
          level,
          used: summary.today.x_calls,
          limit: twitterDailyBudget,
          unit: "calls",
          message:
            level === "critical"
              ? "TwitterAPI.io daily budget almost exhausted. New X imports will start failing."
              : "TwitterAPI.io daily budget is filling up. Consider raising it or tightening per-user caps.",
        });
      }
    }

    return NextResponse.json({
      today: summary.today,
      last7: summary.last7,
      topUsers: summary.topUsers,
      cost: {
        today_usd: Number(todayUsd.toFixed(2)),
        last_7d_usd: Number(last7Usd.toFixed(2)),
        per_1k_tokens_usd: usdPer1k,
        monthly_budget_usd: monthlyBudgetUsd > 0 ? monthlyBudgetUsd : null,
      },
      warnings,
    });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("admin/cost-summary error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load cost summary",
      },
      { status: 500 },
    );
  }
}
