import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginPanel } from "@/components/auth/LoginPanel";
import { ScanlineOverlay } from "@/components/effects/ScanlineOverlay";

export const metadata = {
  title: "Initialize — EMERGN.",
  description: "Connect to the network. X or wallet. Your identity begins here.",
};

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/app");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-void-black px-6">
      <ScanlineOverlay />

      {/* Grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,240,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md">
        <LoginPanel />
      </div>
    </div>
  );
}
