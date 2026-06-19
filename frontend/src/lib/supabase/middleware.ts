import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { ensureUserProfile } from "@/lib/auth/profile";

const authRoutes = ["/auth/sign-in", "/auth/sign-up", "/auth/callback", "/auth/forgot-password"];

function preventAuthResponseCaching(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

function redirectWithSessionCookies(
  request: NextRequest,
  response: NextResponse,
  configureUrl: (url: URL) => void
) {
  const redirectUrl = request.nextUrl.clone();
  configureUrl(redirectUrl);

  const redirectResponse = NextResponse.redirect(redirectUrl);

  for (const cookie of response.cookies.getAll()) {
    redirectResponse.cookies.set(cookie);
  }

  return preventAuthResponseCaching(redirectResponse);
}

export async function updateSession(request: NextRequest) {
  const config = getSupabaseConfig();

  if (!config) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (!user && !isAuthRoute) {
    return redirectWithSessionCookies(request, response, (redirectUrl) => {
      redirectUrl.pathname = "/auth/sign-in";
      redirectUrl.searchParams.set("next", pathname);
    });
  }

  if (user) {
    console.info("[auth] middleware session resolved", {
      userId: user.id,
      pathname
    });

    const profile = await ensureUserProfile(supabase, user, "middleware");

    const isOnboardingRoute = pathname.startsWith("/onboarding");

    // Force onboarding if incomplete
    if (profile && !profile.onboarding_completed && !isOnboardingRoute && !isAuthRoute) {
      return redirectWithSessionCookies(request, response, (redirectUrl) => {
        redirectUrl.pathname = "/onboarding";
        redirectUrl.search = "";
      });
    }

    // Redirect to home if already completed and visiting onboarding
    if (profile && profile.onboarding_completed && isOnboardingRoute) {
      return redirectWithSessionCookies(request, response, (redirectUrl) => {
        redirectUrl.pathname = "/";
        redirectUrl.search = "";
      });
    }

    if (pathname === "/auth/sign-in" || pathname === "/auth/sign-up") {
      return redirectWithSessionCookies(request, response, (redirectUrl) => {
        redirectUrl.pathname = "/";
        redirectUrl.search = "";
      });
    }
  }

  return preventAuthResponseCaching(response);
}
