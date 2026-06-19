"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/auth/profile";

function redirectWithMessage(path: string, type: "error" | "message", message: string): never {
  redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function safeRedirectPath(path: string) {
  return path.startsWith("/") && !path.startsWith("//") ? path : "/";
}

export async function signInAction(formData: FormData) 
{
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirectWithMessage("/auth/sign-in", "error", "Supabase environment variables are not configured.");
  }

  const email = formValue(formData, "email");
  const password = formValue(formData, "password");
  const next = formValue(formData, "next") || "/";

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("[auth] email sign-in failed", { email, error: error.message });
    redirectWithMessage("/auth/sign-in", "error", error.message);
  }

  console.info("[auth] email sign-in created session", {
    userId: data.user?.id ?? null,
    hasSession: Boolean(data.session)
  });

  if (data.user) {
    const profile = await ensureUserProfile(supabase, data.user, "email-sign-in");

    if (!profile) {
      redirectWithMessage("/auth/sign-in", "error", "Signed in, but profile setup failed. Please try again.");
    }
  }

  redirect(safeRedirectPath(next));
}

// Google OAuth is handled by Route Handler at /auth/sign-in/google/route.ts
// (Server Actions cannot persist PKCE cookies on external redirects)

export async function signUpAction(formData: FormData) {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirectWithMessage("/auth/sign-up", "error", "Supabase environment variables are not configured.");
  }

  const fullName = formValue(formData, "fullName");
  const email = formValue(formData, "email");
  const password = formValue(formData, "password");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      }
    }
  });

  if (error) {
    console.error("[auth] email sign-up failed", { email, error: error.message });
    redirectWithMessage("/auth/sign-up", "error", error.message);
  }

  console.info("[auth] email sign-up completed", {
    userId: data.user?.id ?? null,
    hasSession: Boolean(data.session),
    emailConfirmationLikelyRequired: !data.session
  });

  if (data.user && data.session) {
    const profile = await ensureUserProfile(supabase, data.user, "email-sign-up");

    if (!profile) {
      redirectWithMessage("/auth/sign-up", "error", "Account created, but profile setup failed. Please sign in again.");
    }

    redirect("/onboarding");
  }

  redirectWithMessage("/auth/sign-in", "message", "Account created. Check your email if confirmation is enabled, then sign in.");
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();

  if (supabase) {
    console.info("[auth] signing out current user");
    await supabase.auth.signOut();
  }

  redirect("/auth/sign-in");
}

export async function forgotPasswordAction(formData: FormData) {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirectWithMessage("/auth/forgot-password", "error", "Supabase environment variables are not configured.");
  }

  const email = formValue(formData, "email");

  // Determine site origin for redirects
const origin =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://cadence-seven-eta.vercel.app";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/auth/reset-password`
  });

  if (error) {
    redirectWithMessage("/auth/forgot-password", "error", error.message);
  }

  redirectWithMessage("/auth/forgot-password", "message", "Check your email for a password reset link.");
}
