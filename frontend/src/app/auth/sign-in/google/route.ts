import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabaseConfig } from "@/lib/supabase/config";

/**
 * GET /auth/sign-in/google
 *
 * Initiates Google OAuth via Supabase PKCE flow.
 *
 * Uses the request/response cookie pattern (NOT `cookies()` from next/headers)
 * to guarantee that PKCE code_verifier cookies are included in the 302 redirect
 * response to Google. The `cookies()` API does not reliably merge Set-Cookie
 * headers into `NextResponse.redirect()` in all Next.js 15 versions.
 */
export async function GET(request: NextRequest) {
  const config = getSupabaseConfig();

  if (!config) {
    return NextResponse.redirect(
      new URL("/auth/sign-in?error=Supabase+not+configured", request.url)
    );
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    new URL(request.url).origin;

  // Buffer cookies that Supabase sets during signInWithOAuth (PKCE code_verifier)
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

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      scopes: ["openid", "email", "profile"].join(" ")
    },
  });

  if (error || !data.url) {
    const message = error?.message || "Failed to initiate Google sign-in";
    return NextResponse.redirect(
      new URL(`/auth/sign-in?error=${encodeURIComponent(message)}`, request.url)
    );
  }

  // Create the redirect response, then apply buffered cookies directly to it.
  // This guarantees Set-Cookie headers are part of the 302 response.
  const response = NextResponse.redirect(data.url);

  for (const { name, value, options } of pendingCookies) {
    response.cookies.set(name, value, options);
  }

  return response;
}
