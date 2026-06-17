import Link from "next/link";
import { AuthSubmitButton } from "@/components/AuthSubmitButton";
import { signInAction } from "@/app/auth/actions";

type SignInPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="glass-panel w-full max-w-md rounded-3xl p-7">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Cadence AI</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm leading-6 text-muted">Access your protected academic workspace and persisted deadlines.</p>

        {params.error ? (
          <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">{params.error}</p>
        ) : null}
        {params.message ? (
          <p className="mt-5 rounded-2xl border border-cyan-200 bg-cyan-50 p-3 text-sm font-medium text-slate-800">{params.message}</p>
        ) : null}

        <form action={signInAction} className="mt-6 grid gap-4">
          <input name="next" type="hidden" value={params.next ?? "/"} />
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Email</span>
            <input
              autoComplete="email"
              className="rounded-xl border border-line bg-white px-3 py-2 text-sm focus:focus-ring"
              name="email"
              required
              type="email"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Password</span>
            <input
              autoComplete="current-password"
              className="rounded-xl border border-line bg-white px-3 py-2 text-sm focus:focus-ring"
              minLength={6}
              name="password"
              required
              type="password"
            />
          </label>
          <AuthSubmitButton idleLabel="Sign in" pendingLabel="Signing in..." />
        </form>

        <p className="mt-6 text-sm text-muted">
          New to Cadence?{" "}
          <Link className="font-semibold text-primary" href="/auth/sign-up">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}
