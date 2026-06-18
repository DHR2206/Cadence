/*import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = supabase
      ? await supabase.auth.exchangeCodeForSession(code)
      : { error: new Error("Supabase environment variables are not configured.") };

if (error) {
  return NextResponse.redirect(
    new URL(`/auth/sign-in?error=${encodeURIComponent(error.message)}`,request.url));
}

return NextResponse.redirect(
  new URL(next.startsWith("/") ? next : "/", request.url)
);
  }}
*/

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createServerSupabaseClient();

    const { error } = supabase
      ? await supabase.auth.exchangeCodeForSession(code)
      : { error: new Error("Supabase environment variables are not configured.") };

    if (error) {
      return NextResponse.redirect(
        new URL(
          `/auth/sign-in?error=${encodeURIComponent(error.message)}`,
          request.url
        )
      );
    }

    return NextResponse.redirect(
      new URL(next.startsWith("/") ? next : "/", request.url)
    );
  }

  return NextResponse.redirect(
    new URL("/auth/sign-in?error=Missing OAuth code", request.url)
  );
}