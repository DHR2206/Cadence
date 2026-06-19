"use client";

import { useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

export function AuthStateLogger() {
  useEffect(() => {
    const supabase = createBrowserClient();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.info("[auth] client auth state changed", {
        event,
        userId: session?.user.id ?? null,
        expiresAt: session?.expires_at ?? null
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
