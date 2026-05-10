import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";

/**
 * Hook for the current Supabase session/user.
 * - `user` is null until Supabase resolves; `loading` distinguishes "not signed in" from "still checking"
 * - Subscribes to auth state changes so sign-in/sign-out updates the UI without a reload
 */
export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null);
      setLoading(false);
    });
    return () => { mounted = false; sub?.subscription?.unsubscribe?.(); };
  }, []);

  return {
    session,
    user: session?.user ?? null,
    loading,
    /**
     * Send a magic-link email. The link routes back to the current origin so it
     * works in both dev (localhost) and prod (xaepay.com) without config changes.
     */
    signInWithEmail: async (email) => {
      return supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
      });
    },
    signOut: () => supabase.auth.signOut(),
    listFactors: () => supabase.auth.mfa.listFactors(),
    enrollTotp: (friendlyName = "XaePay 2FA") =>
      supabase.auth.mfa.enroll({ factorType: "totp", friendlyName }),
    challengeFactor: (factorId) => supabase.auth.mfa.challenge({ factorId }),
    verifyChallenge: (factorId, challengeId, code) =>
      supabase.auth.mfa.verify({ factorId, challengeId, code }),
    unenrollFactor: (factorId) => supabase.auth.mfa.unenroll({ factorId }),
    getAal: () => supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  };
}
