import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabaseConfig } from "@/lib/supabase/config";

const GOOGLE_INTEGRATION_SCOPES = {
  google_classroom: [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/classroom.courses.readonly",
    "https://www.googleapis.com/auth/classroom.coursework.me.readonly"
  ],
  google_calendar: [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/calendar.readonly"
  ]
} as const;

type GoogleIntegrationProvider = keyof typeof GOOGLE_INTEGRATION_SCOPES;

function isGoogleIntegrationProvider(value: string | null): value is GoogleIntegrationProvider {
  return value === "google_classroom" || value === "google_calendar";
}

export async function GET(request: NextRequest) {
  const provider = new URL(request.url).searchParams.get("provider");

  if (!isGoogleIntegrationProvider(provider)) {
    return NextResponse.redirect(
      new URL("/settings/integrations?error=unsupported_provider", request.url)
    );
  }

  const config = getSupabaseConfig();

  if (!config) {
    return NextResponse.redirect(
      new URL("/settings/integrations?error=supabase_not_configured", request.url)
    );
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  let pendingCookies: { name: string; value: string; options?: Record<string, unknown> }[] = [];

  const supabase = createServerClient<Database>(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        pendingCookies = cookiesToSet;
      }
    }
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?integration=${provider}`,
      scopes: GOOGLE_INTEGRATION_SCOPES[provider].join(" "),
      queryParams: {
        access_type: "offline",
        prompt: "consent",
        include_granted_scopes: "true"
      }
    }
  });

  if (error || !data.url) {
    const message = error?.message || "Failed to initiate Google integration";
    return NextResponse.redirect(
      new URL(`/settings/integrations?error=${encodeURIComponent(message)}`, request.url)
    );
  }

  const response = NextResponse.redirect(data.url);
  response.headers.set("Cache-Control", "private, no-store");

  for (const { name, value, options } of pendingCookies) {
    response.cookies.set(name, value, options);
  }

  return response;
}
