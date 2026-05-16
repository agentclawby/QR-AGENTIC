import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeGetUser } from "@/lib/supabase/safe-auth";
import { LoginPanel } from "@/components/auth/LoginPanel";
import { ScanlineOverlay } from "@/components/effects/ScanlineOverlay";
import { AuroraBackdrop } from "@/components/effects/AuroraBackdrop";
import { AnimatedGrid } from "@/components/effects/AnimatedGrid";

export const metadata = {
  title: "Initialize — EMERGN.",
  description: "Connect to the network. X or wallet. Your identity begins here.",
};

export default async function LoginPage() {
  const supabase = await createClient();
  // Fast-fail when Supabase is unreachable — without this, the login page
  // itself hangs trying to redirect an already-authenticated user.
  const { user } = await safeGetUser(supabase);

  if (user) {
    redirect("/app");
  }

  return (
    <div className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-void-black px-4 py-10 sm:px-6">
      <AuroraBackdrop fixed variant="default" />
      <AnimatedGrid variant="cyan" sweep />
      <ScanlineOverlay />

      {/* corner brackets — terminal frame */}
      <CornerBrackets />

      <div className="relative z-10 w-full max-w-md">
        <Suspense fallback={null}>
          <LoginPanel />
        </Suspense>
      </div>

      {/* identity tag bottom-left */}
      <div className="absolute bottom-6 left-6 z-10 hidden font-mono text-[10px] uppercase tracking-[0.3em] text-neural-white/30 md:block">
        <span className="status-dot mr-2 align-middle" />
        EMERGN.NETWORK • SECURE CHANNEL
      </div>
      <div className="absolute bottom-6 right-6 z-10 hidden font-mono text-[10px] uppercase tracking-[0.3em] text-neural-white/30 md:block">
        AUTH PROTOCOL v1.0
      </div>
    </div>
  );
}

function CornerBrackets() {
  return (
    <>
      <span aria-hidden className="pointer-events-none absolute top-6 left-6 h-6 w-6 border-l border-t border-pulse-cyan/40" />
      <span aria-hidden className="pointer-events-none absolute top-6 right-6 h-6 w-6 border-r border-t border-pulse-cyan/40" />
      <span aria-hidden className="pointer-events-none absolute bottom-6 left-6 h-6 w-6 border-l border-b border-pulse-cyan/40 hidden md:block" />
      <span aria-hidden className="pointer-events-none absolute bottom-6 right-6 h-6 w-6 border-r border-b border-pulse-cyan/40 hidden md:block" />
    </>
  );
}
