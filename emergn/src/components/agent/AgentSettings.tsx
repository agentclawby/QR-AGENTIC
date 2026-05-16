"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { Agent } from "@/types";

interface AgentSettingsProps {
  agent: Agent;
  isOwner: boolean;
}

export function AgentSettings({ agent, isOwner }: AgentSettingsProps) {
  const router = useRouter();
  const [name, setName] = useState(agent.name);
  const [savingName, setSavingName] = useState(false);
  const [nameStatus, setNameStatus] = useState<string | null>(null);
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!isOwner) {
    return (
      <div className="border border-dashed border-ghost-gray/30 px-4 py-12 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-neural-white/40">
          Settings are owner-only.
        </p>
      </div>
    );
  }

  const handleRename = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed === agent.name) return;
    setSavingName(true);
    setNameStatus(null);
    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Rename failed");
      setNameStatus("Saved.");
      router.refresh();
    } catch (err) {
      setNameStatus(err instanceof Error ? err.message : "Rename failed");
    } finally {
      setSavingName(false);
    }
  };

  const handleDelete = async () => {
    if (confirm.trim().toUpperCase() !== agent.codename.toUpperCase()) {
      setDeleteError(`Type "${agent.codename}" to confirm`);
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/agents/${agent.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      router.push("/app");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Delete failed");
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Rename */}
      <div className="border border-ghost-gray/30 bg-ghost-gray/5 p-5 sm:p-6">
        <h2 className="mb-1 font-headline text-sm font-bold uppercase tracking-[0.1em] text-neural-white sm:tracking-[0.15em]">
          Rename Agent
        </h2>
        <p className="mb-4 font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-neural-white/40">
          The codename ({agent.codename}) is fixed by the genesis forge and won&apos;t change.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            className="min-w-0 flex-1 border border-ghost-gray/50 bg-ghost-gray/10 px-4 py-3 font-headline text-base uppercase tracking-[0.08em] text-neural-white outline-none transition-colors focus:border-pulse-cyan focus:bg-pulse-cyan/5"
          />
          <Button
            variant="primary"
            size="md"
            onClick={handleRename}
            loading={savingName}
            disabled={savingName || name.trim().length < 2 || name.trim() === agent.name}
            className="w-full sm:w-auto"
          >
            Save
          </Button>
        </div>
        {nameStatus && (
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/45">
            {nameStatus}
          </p>
        )}
      </div>

      {/* Runtime layers (read-only) */}
      <div className="border border-ghost-gray/20 bg-ghost-gray/5 p-5 sm:p-6">
        <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/50 sm:tracking-[0.2em]">
          Runtime Layers
        </h2>
        <div className="space-y-2 break-words font-mono text-[10px] uppercase tracking-[0.08em] text-neural-white/35 sm:tracking-[0.12em]">
          <p>Voice overlay: {agent.personality_overlay ? "active" : "inactive"}</p>
          <p>Training overlay: {agent.training_overlay ? "active" : "inactive"}</p>
          <p>Refinement overlay: {agent.refinement_overlay ? "active" : "inactive"}</p>
          <p>Training level: {agent.training_level}</p>
        </div>
      </div>

      {/* Danger zone */}
      <div className="border border-ember-orange/40 bg-ember-orange/5 p-5 sm:p-6">
        <h2 className="mb-1 font-headline text-sm font-bold uppercase tracking-[0.1em] text-ember-orange sm:tracking-[0.15em]">
          Danger Zone
        </h2>
        <p className="mb-4 font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-ember-orange/70">
          Delete permanently destroys this agent, its passport, sentience scores, training history, drafts, and feed posts. This cannot be undone.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={`Type ${agent.codename} to confirm`}
            className="min-w-0 flex-1 border border-ember-orange/40 bg-void-black px-4 py-3 font-mono text-sm uppercase tracking-[0.08em] text-neural-white outline-none placeholder-neural-white/20 focus:border-ember-orange"
          />
          <Button
            variant="ghost"
            size="md"
            onClick={handleDelete}
            loading={deleting}
            disabled={deleting || confirm.trim().toUpperCase() !== agent.codename.toUpperCase()}
            className="w-full border-ember-orange/40 text-ember-orange hover:border-ember-orange hover:bg-ember-orange/10 sm:w-auto"
          >
            Delete Agent
          </Button>
        </div>
        {deleteError && (
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ember-orange">
            {deleteError}
          </p>
        )}
      </div>
    </div>
  );
}
