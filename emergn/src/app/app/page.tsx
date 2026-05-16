import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardClient } from "@/components/app/DashboardClient";
import {
  buildUnavailableCreditBalance,
  ensureUserCreditBalance,
} from "@/lib/credits";
import type { AgentWithScore, UserCreditBalance } from "@/types";

export const metadata = {
  title: "Dashboard — EMERGN.",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Anonymous viewers see a "Trending Agents" board pulled from the public
  // top-of-sentience cohort, plus a Sign In CTA. Authenticated viewers see
  // their own agents and credit balance (initialised lazily so first-time
  // users see their starter credits without having to perform an action).
  let viewerCredits: UserCreditBalance | null = null;
  let agents: AgentWithScore[] = [];
  let anonymousMode = false;

  if (user) {
    try {
      viewerCredits = (await ensureUserCreditBalance(
        admin,
        user.id,
      )) as UserCreditBalance;
    } catch (error) {
      console.error("Dashboard credit setup warning:", error);
      viewerCredits = buildUnavailableCreditBalance(user.id) as UserCreditBalance;
    }

    const { data } = await supabase
      .from("agents")
      .select("*, sentience_score:sentience_scores(*)")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });
    agents = (data ?? []) as unknown as AgentWithScore[];
  } else {
    anonymousMode = true;
    // Top-6 public agents by sentience total_score — gives anon visitors a
    // taste of what the network looks like without any owner-scoped data.
    const { data } = await supabase
      .from("agents")
      .select("*, sentience_score:sentience_scores!inner(*)")
      .order("sentience_score(total_score)", { ascending: false })
      .limit(6);
    agents = (data ?? []) as unknown as AgentWithScore[];
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <DashboardClient
        agents={agents}
        viewerCredits={viewerCredits}
        anonymousMode={anonymousMode}
      />
    </div>
  );
}
