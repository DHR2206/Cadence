import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // CRITICAL: Do NOT run updateSession on /auth/callback.
  // The callback route needs raw access to the PKCE code_verifier cookie.
  // If middleware refreshes/rewrites cookies before the callback reads them,
  // the PKCE verifier can be lost or the cookie jar can become inconsistent.
  if (pathname.startsWith("/auth/callback")) {
    return NextResponse.next();
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};