"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function redirectWithMessage(path: string, type: "error" | "message", message: string): never {
  redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
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

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirectWithMessage("/auth/sign-in", "error", error.message);
  }

  redirect(next.startsWith("/") ? next : "/");
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

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      }
    }
  });

  if (error) {
    redirectWithMessage("/auth/sign-up", "error", error.message);
  }

  redirectWithMessage("/auth/sign-in", "message", "Account created. Check your email if confirmation is enabled, then sign in.");
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();

  if (supabase) {
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
