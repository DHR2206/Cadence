import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { getSupabaseConfig } from "@/lib/supabase/config";

/**
 * GET /auth/sign-in/google
 *
 * Route Handler that initiates Google OAuth via Supabase PKCE flow.
 *
 * Why a Route Handler instead of a Server Action?
 * ─────────────────────────────────────────────────
 * Server Actions set cookies on an internal response object. When the action
 * then calls `redirect()` to an external URL (Google), Next.js throws a
 * redirect exception and the `Set-Cookie` headers are LOST — the browser
 * never receives the PKCE `code_verifier` cookie.
 *
 * Route Handlers return a real `NextResponse`, so `Set-Cookie` headers
 * survive the 302 redirect to Google and the PKCE verifier cookie is
 * properly persisted in the browser.
 */
export async function GET() {
  const config = getSupabaseConfig();

  if (!config) {
    return NextResponse.redirect(
      new URL("/auth/sign-in?error=Supabase+not+configured", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")
    );
  }

  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://cadence-seven-eta.vercel.app";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error || !data.url) {
    const message = error?.message || "Failed to initiate Google sign-in";
    return NextResponse.redirect(
      new URL(`/auth/sign-in?error=${encodeURIComponent(message)}`, origin)
    );
  }

  return NextResponse.redirect(data.url);
}
