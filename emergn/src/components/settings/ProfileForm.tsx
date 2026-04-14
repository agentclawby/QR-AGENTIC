"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import type { Profile } from "@/types";

interface ProfileFormProps {
  profile: Profile;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [username, setUsername] = useState(profile.username ?? "");
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        username: username.trim() || null,
        display_name: displayName.trim() || null,
      })
      .eq("id", profile.id);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Profile updated.");
    }

    setSaving(false);
  };

  return (
    <div className="border border-ghost-gray/20 bg-ghost-gray/5 p-6">
      <h2 className="mb-4 font-headline text-sm font-bold uppercase tracking-[0.15em] text-neural-white">
        Profile
      </h2>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.15em] text-neural-white/30">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-ghost-gray/30 bg-void-black px-3 py-2 font-mono text-sm text-neural-white outline-none transition-colors focus:border-pulse-cyan"
            placeholder="your_username"
          />
        </div>

        <div>
          <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.15em] text-neural-white/30">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full border border-ghost-gray/30 bg-void-black px-3 py-2 font-mono text-sm text-neural-white outline-none transition-colors focus:border-pulse-cyan"
            placeholder="Display Name"
          />
        </div>

        {message && (
          <p
            className={`font-mono text-xs ${
              message.includes("updated")
                ? "text-pulse-cyan"
                : "text-ember-orange"
            }`}
          >
            {message}
          </p>
        )}

        <Button
          variant="primary"
          size="md"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
