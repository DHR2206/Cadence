import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { saveIntegrationCredentials } from "@/lib/services/integrations";

/**
 * GET /auth/callback
 *
 * Handles the OAuth callback from Supabase/Google.
 * Exchanges the authorization code for a session using the PKCE code_verifier
 * cookie that was set during OAuth initiation.
 *
 * Uses the Supabase SSR request/response cookie pattern to guarantee that
 * session cookies are included in the redirect response.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const integration = searchParams.get("integration");
  const isGoogleIntegration =
    integration === "google_classroom" || integration === "google_calendar";

  if (!code) {
    return NextResponse.redirect(
      new URL("/auth/sign-in?error=oauth", origin)
    );
  }

  const config = getSupabaseConfig();

  if (!config) {
    return NextResponse.redirect(
      new URL("/auth/sign-in?error=oauth", origin)
    );
  }

  const response = NextResponse.redirect(
    new URL(isGoogleIntegration ? "/settings/integrations?connected=google" : "/", origin)
  );

  const supabase = createServerClient<Database>(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Failed to exchange OAuth code for session:", error);
    return NextResponse.redirect(
      new URL("/auth/sign-in?error=oauth", origin)
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      new URL("/auth/sign-in?error=oauth", origin)
    );
  }

  if (isGoogleIntegration) {
    if (!data.session?.provider_token || !data.session.provider_refresh_token) {
      return NextResponse.redirect(
        new URL("/settings/integrations?error=missing_google_refresh_token", origin)
      );
    }

    try {
      await saveIntegrationCredentials(supabase, user.id, {
        provider: integration,
        externalUserId: user.email ?? user.id,
        accessToken: data.session.provider_token,
        refreshToken: data.session.provider_refresh_token,
        expiresAt: data.session.expires_at
          ? new Date(data.session.expires_at * 1000).toISOString()
          : null
      });
    } catch (credentialError) {
      console.error("Failed to store encrypted Google integration credentials:", credentialError);
      return NextResponse.redirect(
        new URL("/settings/integrations?error=integration_credentials", origin)
      );
    }
  }

  return response;
}
