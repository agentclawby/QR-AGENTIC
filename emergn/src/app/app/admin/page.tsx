import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import {
  AdminUserTable,
  type AdminAuditRow,
  type AdminUserRow,
} from "@/components/admin/AdminUserTable";
import { CostDashboard } from "@/components/admin/CostDashboard";
import {
  PendingClaimsPanel,
  type PendingClaim,
} from "@/components/admin/PendingClaimsPanel";

export const metadata = {
  title: "Admin · EMERGN.",
};

export default async function AdminPage() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const allowed = await isAdmin(admin, { user });
  if (!allowed) {
    redirect("/app");
  }

  const [{ data: users }, { data: audit }, { data: pending }] = await Promise.all([
    admin
      .from("admin_user_overview")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200),
    admin
      .from("admin_audit_log")
      .select("id, actor_id, target_user_id, action, payload, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("credit_claims")
      .select("id, user_id, draft_id, tweet_id, tweet_url, similarity, reason, created_at")
      .eq("status", "manual_review")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const userRows = (users ?? []) as AdminUserRow[];
  const auditRows = (audit ?? []) as AdminAuditRow[];
  const pendingClaims = (pending ?? []) as PendingClaim[];

  const totals = userRows.reduce(
    (acc, row) => ({
      action: acc.action + (row.action_credits ?? 0),
      earnedToday: acc.earnedToday + (row.action_credits_earned_today ?? 0),
      agents: acc.agents + (row.agent_count ?? 0),
      suspended: acc.suspended + (row.suspended_at ? 1 : 0),
    }),
    { action: 0, earnedToday: 0, agents: 0, suspended: 0 },
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold uppercase tracking-[0.08em] text-neural-white sm:tracking-[0.1em]">
            Admin Console
          </h1>
          <p className="mt-1 font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-neural-white/45 sm:tracking-[0.15em]">
            Credits, quotas, suspension, claim review
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:grid-cols-4">
          <Stat label="Users" value={userRows.length} />
          <Stat label="Agents" value={totals.agents} />
          <Stat label="Credits pool" value={totals.action} />
          <Stat label="Suspended" value={totals.suspended} />
        </div>
      </div>

      <CostDashboard />

      <div>
        <h2 className="mb-3 font-headline text-sm font-bold uppercase tracking-[0.1em] text-neural-white sm:tracking-[0.15em]">
          Claims awaiting review
        </h2>
        <PendingClaimsPanel claims={pendingClaims} />
      </div>

      <AdminUserTable
        users={userRows}
        audit={auditRows}
        currentUserId={user.id}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-ghost-gray/20 bg-ghost-gray/5 px-4 py-3">
      <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-neural-white/40 sm:tracking-[0.18em]">
        {label}
      </p>
      <p className="mt-1 font-mono text-lg tabular-nums text-pulse-cyan">
        {value}
      </p>
    </div>
  );
}
