import { PlannerApp } from "@/components/PlannerApp";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/auth/profile";
import { redirect } from "next/navigation";

function MissingSupabaseConfig() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="glass-panel max-w-2xl rounded-3xl p-7">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Cadence AI</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Supabase is not configured</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Add the environment variables from <code className="rounded bg-slate-100 px-1.5 py-0.5">frontend/.env.example</code> to
          run the protected dashboard and persistent assignment CRUD.
        </p>
      </section>
    </main>
  );
}

export default async function Home() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return <MissingSupabaseConfig />;
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in?next=/");
  }

  const profile = await ensureUserProfile(supabase, user, "home-page");

  if (!profile) {
    redirect("/auth/sign-in?error=profile_setup");
  }

  if (!profile.onboarding_completed) {
    redirect("/onboarding");
  }

  return (
    <PlannerApp
      initialProfile={profile}
      user={{
        id: user.id,
        email: user.email ?? ""
      }}
    />
  );
}
