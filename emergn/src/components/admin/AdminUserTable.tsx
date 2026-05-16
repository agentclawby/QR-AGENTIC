"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { GrantCreditsForm } from "@/components/admin/GrantCreditsForm";
import { UsageQuotaForm } from "@/components/admin/UsageQuotaForm";

export interface AdminUserRow {
  id: string;
  username: string | null;
  display_name: string | null;
  x_handle: string | null;
  wallet_address: string | null;
  role: "user" | "admin";
  suspended_at: string | null;
  suspended_reason: string | null;
  usage_quota_overrides: Record<string, number> | null;
  created_at: string;
  // Legacy
  free_consults_remaining: number | null;
  premium_credits: number | null;
  training_credits: number | null;
  // Unified pool
  action_credits: number | null;
  action_credits_earned_today: number | null;
  // Today's usage
  x_calls: number | null;
  anthropic_tokens: number | null;
  consults: number | null;
  trainings: number | null;
  agent_count: number;
}

export interface AdminAuditRow {
  id: string;
  actor_id: string;
  target_user_id: string | null;
  action: string;
  payload: Record<string, unknown>;
  created_at: string;
}

interface AdminUserTableProps {
  users: AdminUserRow[];
  audit: AdminAuditRow[];
  currentUserId: string;
}

function shortWallet(address: string | null) {
  if (!address) return "—";
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function ownerLabel(row: AdminUserRow) {
  if (row.x_handle) return `@${row.x_handle}`;
  if (row.username) return row.username;
  if (row.wallet_address) return shortWallet(row.wallet_address);
  return row.id.slice(0, 8);
}

type ExpandKind = "grant" | "quota" | null;

export function AdminUserTable({
  users,
  audit,
  currentUserId,
}: AdminUserTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<{ id: string; kind: ExpandKind }>(
    { id: "", kind: null },
  );
  const [pendingRoleId, setPendingRoleId] = useState<string | null>(null);
  const [pendingSuspendId, setPendingSuspendId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((row) => {
      const haystack = [
        row.username,
        row.display_name,
        row.x_handle,
        row.wallet_address,
        row.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [users, search]);

  const handleToggleRole = async (row: AdminUserRow) => {
    if (row.id === currentUserId) {
      setError("You cannot demote yourself.");
      return;
    }
    setPendingRoleId(row.id);
    setError(null);
    try {
      const next = row.role === "admin" ? "user" : "admin";
      const res = await fetch(`/api/admin/users/${row.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update role");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setPendingRoleId(null);
    }
  };

  const handleToggleSuspension = async (row: AdminUserRow) => {
    if (row.id === currentUserId) {
      setError("You cannot suspend yourself.");
      return;
    }
    setPendingSuspendId(row.id);
    setError(null);
    try {
      const suspending = !row.suspended_at;
      const reason = suspending
        ? window.prompt("Reason for suspension (visible to operator only)?") ?? undefined
        : undefined;
      if (suspending && reason === null) {
        // user hit cancel — abort
        return;
      }
      const res = await fetch(`/api/admin/users/${row.id}/suspend`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suspended: suspending, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update suspension");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update suspension");
    } finally {
      setPendingSuspendId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by handle, username, wallet..."
          className="flex-1 min-w-[240px] border border-ghost-gray/30 bg-void-black px-4 py-2.5 font-mono text-xs text-neural-white/75 outline-none transition-colors focus:border-pulse-cyan"
        />
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-neural-white/45">
          {filtered.length} of {users.length}
        </span>
      </div>

      {error ? (
        <div className="border border-ember-orange/30 bg-ember-orange/5 p-3">
          <p className="font-mono text-xs text-ember-orange">{error}</p>
        </div>
      ) : null}

      <div className="overflow-x-auto border border-ghost-gray/20">
        <table className="w-full">
          <thead>
            <tr className="border-b border-ghost-gray/30">
              <Th>User</Th>
              <Th>Wallet</Th>
              <Th align="center">Agents</Th>
              <Th align="right">Credits</Th>
              <Th align="right">Earned/today</Th>
              <Th align="right">Tokens/today</Th>
              <Th align="right">Trains/today</Th>
              <Th align="right">Consults/today</Th>
              <Th align="center">Status</Th>
              <Th align="right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const isExpanded = expanded.id === row.id && expanded.kind !== null;
              return (
                <motion.tr
                  key={row.id}
                  layout
                  className={
                    "border-b border-ghost-gray/15 align-top" +
                    (row.suspended_at ? " bg-ember-orange/[0.03]" : "")
                  }
                >
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-headline text-xs font-bold uppercase tracking-[0.1em] text-neural-white">
                        {ownerLabel(row)}
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-neural-white/40">
                        {row.id.slice(0, 8)} · joined{" "}
                        {new Date(row.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-neural-white/55">
                    {shortWallet(row.wallet_address)}
                  </td>
                  <Td align="center">{row.agent_count}</Td>
                  <Td align="right">{row.action_credits ?? 0}</Td>
                  <Td align="right" muted>{row.action_credits_earned_today ?? 0}</Td>
                  <Td align="right" muted>{row.anthropic_tokens ?? 0}</Td>
                  <Td align="right" muted>{row.trainings ?? 0}</Td>
                  <Td align="right" muted>{row.consults ?? 0}</Td>
                  <td className="px-4 py-3 text-center">
                    {row.suspended_at ? (
                      <span
                        className="border border-ember-orange/40 bg-ember-orange/5 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-ember-orange"
                        title={row.suspended_reason ?? ""}
                      >
                        suspended
                      </span>
                    ) : (
                      <span
                        className={
                          row.role === "admin"
                            ? "border border-pulse-cyan/40 bg-pulse-cyan/5 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-pulse-cyan"
                            : "border border-ghost-gray/30 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-neural-white/55"
                        }
                      >
                        {row.role}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        magnetic={false}
                        onClick={() =>
                          setExpanded(
                            isExpanded && expanded.kind === "grant"
                              ? { id: "", kind: null }
                              : { id: row.id, kind: "grant" },
                          )
                        }
                      >
                        Grant
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        magnetic={false}
                        onClick={() =>
                          setExpanded(
                            isExpanded && expanded.kind === "quota"
                              ? { id: "", kind: null }
                              : { id: row.id, kind: "quota" },
                          )
                        }
                      >
                        Quota
                      </Button>
                      <Button
                        variant={row.suspended_at ? "secondary" : "danger"}
                        size="sm"
                        magnetic={false}
                        loading={pendingSuspendId === row.id}
                        disabled={pendingSuspendId === row.id || row.id === currentUserId}
                        onClick={() => handleToggleSuspension(row)}
                      >
                        {row.suspended_at ? "Unsuspend" : "Suspend"}
                      </Button>
                      <Button
                        variant={row.role === "admin" ? "danger" : "secondary"}
                        size="sm"
                        magnetic={false}
                        loading={pendingRoleId === row.id}
                        disabled={pendingRoleId === row.id || row.id === currentUserId}
                        onClick={() => handleToggleRole(row)}
                      >
                        {row.role === "admin" ? "Demote" : "Promote"}
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
            {expanded.kind !== null && expanded.id ? (() => {
              const row = filtered.find((r) => r.id === expanded.id);
              if (!row) return null;
              return (
                <tr key={`expand-${row.id}`} className="border-b border-ghost-gray/15">
                  <td colSpan={10} className="bg-void-black px-4 py-4">
                    {expanded.kind === "grant" ? (
                      <GrantCreditsForm
                        userId={row.id}
                        label={ownerLabel(row)}
                        onSuccess={() => {
                          setExpanded({ id: "", kind: null });
                          router.refresh();
                        }}
                      />
                    ) : (
                      <UsageQuotaForm
                        userId={row.id}
                        label={ownerLabel(row)}
                        existing={row.usage_quota_overrides ?? {}}
                        onSuccess={() => {
                          setExpanded({ id: "", kind: null });
                          router.refresh();
                        }}
                      />
                    )}
                  </td>
                </tr>
              );
            })() : null}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="mb-3 font-headline text-sm font-bold uppercase tracking-[0.15em] text-neural-white">
          Recent Admin Activity
        </h2>
        {audit.length === 0 ? (
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/30">
            No admin actions yet.
          </p>
        ) : (
          <div className="space-y-2">
            {audit.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-3 border border-ghost-gray/15 bg-void-black px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/55"
              >
                <span className="text-pulse-cyan">{entry.action}</span>
                <span>
                  Actor {entry.actor_id.slice(0, 8)} → Target{" "}
                  {entry.target_user_id?.slice(0, 8) ?? "—"}
                </span>
                <span className="text-neural-white/30">
                  {new Date(entry.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
}) {
  const cls =
    align === "right"
      ? "text-right"
      : align === "center"
        ? "text-center"
        : "text-left";
  return (
    <th
      className={`px-4 py-3 ${cls} font-mono text-[10px] uppercase tracking-[0.15em] text-neural-white/45`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
  muted = false,
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  muted?: boolean;
}) {
  const alignCls =
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  const colorCls = muted ? "text-neural-white/45" : "text-neural-white/75";
  return (
    <td
      className={`px-4 py-3 ${alignCls} font-mono text-xs tabular-nums ${colorCls}`}
    >
      {children}
    </td>
  );
}
