"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isSigningOut: boolean;
  signOut: () => Promise<void>;
}

function isMissingSessionError(error: { message?: string } | null) {
  return /auth session missing|session.*missing/i.test(error?.message ?? "");
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      setProfile(data);
    },
    [supabase]
  );

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
      if (user) {
        await fetchProfile(user.id);
      }
      setIsLoading(false);
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }

      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const signOut = useCallback(async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);

    setUser(null);
    setProfile(null);
    setIsLoading(false);

    void supabase.auth
      .signOut({ scope: "local" })
      .then(({ error }) => {
        if (error && !isMissingSessionError(error)) {
          console.error("[auth] local sign-out failed", error.message);
        }
      })
      .catch((error) => {
        console.error("[auth] local sign-out failed", error);
      });

    window.location.assign("/auth/signout");
  }, [isSigningOut, supabase]);

  return { user, profile, isLoading, isSigningOut, signOut };
}
