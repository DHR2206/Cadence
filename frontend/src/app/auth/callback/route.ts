import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabaseConfig } from "@/lib/supabase/config";

/**
 * GET /auth/callback
 *
 * Handles the OAuth callback from Supabase/Google.
 * Exchanges the authorization code for a session using the PKCE code_verifier
 * cookie that was set during OAuth initiation.
 *
 * Uses the request/response cookie pattern to guarantee that session cookies
 * (auth tokens) are included in the redirect response. This is critical —
 * if session cookies are lost on the redirect, middleware will see no user
 * and send the user back to /auth/sign-in.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(
      new URL("/auth/sign-in?error=Missing+OAuth+code", origin)
    );
  }

  const config = getSupabaseConfig();

  if (!config) {
    return NextResponse.redirect(
      new URL("/auth/sign-in?error=Supabase+not+configured", origin)
    );
  }

  // Buffer cookies that Supabase sets during exchangeCodeForSession (session tokens)
  let pendingCookies: { name: string; value: string; options?: Record<string, unknown> }[] = [];

  const supabase = createServerClient<Database>(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        pendingCookies = cookiesToSet;
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/auth/sign-in?error=${encodeURIComponent(error.message)}`,
        origin
      )
    );
  }

  // Create the redirect response, then apply session cookies directly to it.
  // Without this, the browser won't have session tokens and middleware
  // will redirect back to /auth/sign-in.
  const redirectUrl = new URL(next.startsWith("/") ? next : "/", origin);
  const response = NextResponse.redirect(redirectUrl);

  for (const { name, value, options } of pendingCookies) {
    response.cookies.set(name, value, options);
  }

  return response;
}