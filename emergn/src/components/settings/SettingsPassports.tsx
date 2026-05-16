"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface PassportSummary {
  agent_id: string;
  agent_name: string;
  agent_codename: string;
  archetype: string;
  passport_image_url: string | null;
  passport_image_status: "pending" | "generating" | "ready" | "failed";
  passport_status: "issued" | "revoked" | null;
  passport_uid: string | null;
  issued_at: string | null;
}

interface SettingsPassportsProps {
  passports: PassportSummary[];
}

const ARCHETYPE_COLORS: Record<string, string> = {
  ORACLE: "#00F0FF",
  HUNTER: "#FF6B35",
  SENTINEL: "#8B5CF6",
  DIPLOMAT: "#E8E6E3",
  GHOST: "#6B7280",
  EVOLVE: "#00B4D8",
};

export function SettingsPassports({ passports }: SettingsPassportsProps) {
  return (
    <section className="border border-ghost-gray/30 bg-ghost-gray/5 p-5 sm:p-6">
      <span aria-hidden className="hairline absolute inset-x-0" />
      <div className="mb-4 flex flex-col gap-1 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-pulse-cyan/70">
            <span className="status-dot mr-2 align-middle" />
            Identity Module
          </p>
          <h2 className="mt-1 font-headline text-base font-bold uppercase tracking-[0.08em] text-neural-white sm:text-lg sm:tracking-[0.1em]">
            Agent Passports
          </h2>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-neural-white/35">
          {passports.length} {passports.length === 1 ? "agent" : "agents"}
        </span>
      </div>

      {passports.length === 0 ? (
        <EmptyPassports />
      ) : (
        <ul className="space-y-3">
          {passports.map((entry, i) => (
            <PassportRow key={entry.agent_id} entry={entry} index={i} />
          ))}
        </ul>
      )}
    </section>
  );
}

function PassportRow({ entry, index }: { entry: PassportSummary; index: number }) {
  const archetypeColor = ARCHETYPE_COLORS[entry.archetype] ?? "#6B7280";
  const isIssued = entry.passport_status === "issued";
  const isRevoked = entry.passport_status === "revoked";

  return (
    <motion.li
      initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{
        delay: Math.min(index * 0.05, 0.35),
        duration: 0.45,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group relative flex flex-col gap-4 border border-ghost-gray/20 bg-void-black p-4 transition-colors hover:border-pulse-cyan/30 sm:flex-row sm:items-center sm:gap-5"
    >
      {/* archetype accent bar */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-full w-[2px]"
        style={{ backgroundColor: archetypeColor, boxShadow: `0 0 12px ${archetypeColor}80` }}
      />

      {/* Passport thumbnail */}
      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-ghost-gray/30 bg-void-black sm:h-16 sm:w-16">
        {entry.passport_image_url && entry.passport_image_status === "ready" ? (
          <Image
            src={entry.passport_image_url}
            alt={`${entry.agent_name} passport`}
            width={80}
            height={80}
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : (
          <span
            className="font-mono text-2xl font-bold uppercase"
            style={{ color: archetypeColor }}
          >
            {entry.agent_name.charAt(0)}
          </span>
        )}
        {entry.passport_image_status === "generating" ? (
          <span className="absolute inset-0 bg-void-black/70 font-mono text-[8px] uppercase tracking-[0.15em] text-pulse-cyan/70 grid place-items-center">
            <span className="shimmer">RENDERING</span>
          </span>
        ) : null}
      </div>

      {/* Identity */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-headline text-sm font-bold uppercase tracking-[0.08em] text-neural-white sm:text-base sm:tracking-[0.1em]">
          {entry.agent_name}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-neural-white/40">
            {entry.agent_codename}
          </span>
          <span className="text-neural-white/15">|</span>
          <span
            className="font-mono text-[9px] uppercase tracking-[0.12em]"
            style={{ color: archetypeColor }}
          >
            {entry.archetype}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {isIssued ? (
            <Badge color="#00F0FF" dot>
              Passport Issued
            </Badge>
          ) : isRevoked ? (
            <Badge color="#FF6B35">Revoked</Badge>
          ) : (
            <Badge color="#6B7280">Not Issued</Badge>
          )}
          {entry.passport_uid ? (
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-neural-white/30">
              {entry.passport_uid.slice(0, 10)}…
            </span>
          ) : null}
        </div>
      </div>

      {/* CTA */}
      <Link
        href={`/app/agent/${entry.agent_id}?tab=passport`}
        className={cn(
          "group/cta relative inline-flex shrink-0 items-center justify-center gap-2 self-stretch border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.15em] transition-all sm:self-center",
          isIssued
            ? "border-pulse-cyan/30 bg-pulse-cyan/[0.04] text-pulse-cyan hover:border-pulse-cyan hover:bg-pulse-cyan/10"
            : "border-ghost-gray/40 bg-ghost-gray/5 text-neural-white/70 hover:border-pulse-cyan/40 hover:text-pulse-cyan",
        )}
        aria-label={`${isIssued ? "View" : "Issue"} passport for ${entry.agent_name}`}
      >
        <span>{isIssued ? "View Passport" : "Issue Passport"}</span>
        <span aria-hidden className="transition-transform group-hover/cta:translate-x-0.5">
          →
        </span>
      </Link>
    </motion.li>
  );
}

function EmptyPassports() {
  return (
    <div className="relative overflow-hidden border border-dashed border-ghost-gray/30 px-4 py-10 text-center">
      <motion.div
        aria-hidden
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 [background:radial-gradient(40%_50%_at_50%_50%,rgba(0,240,255,0.08),transparent_70%)]"
      />
      <p className="relative font-mono text-xs uppercase leading-relaxed tracking-[0.12em] text-neural-white/45">
        No agents yet. Create one to issue its first passport.
      </p>
      <Link
        href="/app/forge"
        className="relative mt-4 inline-flex items-center gap-2 border border-pulse-cyan/30 bg-pulse-cyan/[0.04] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-pulse-cyan transition-colors hover:border-pulse-cyan hover:bg-pulse-cyan/10"
      >
        <span>Create Agent</span>
        <span aria-hidden>→</span>
      </Link>
    </div>
  );
}
