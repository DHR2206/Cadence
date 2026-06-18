import { signInAction } from "@/app/auth/actions";
import Link from "next/link";
import { AuthSubmitButton } from "@/components/AuthSubmitButton";
import { AuthLayout } from "@/components/auth/AuthLayout";

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
    <AuthLayout
      subtitle="Access your protected academic workspace and persisted deadlines."
      title="Sign in"
    >
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


<div className="my-6 flex items-center">
  <div className="h-px flex-1 bg-slate-200"></div>
  <span className="px-3 text-sm text-slate-500">OR</span>
  <div className="h-px flex-1 bg-slate-200"></div>
</div>


        
{/* Google OAuth via Route Handler (not Server Action — PKCE cookies need real response headers) */}
<a
  href="/auth/sign-in/google"
  className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 font-medium shadow-sm hover:bg-slate-50 transition"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    className="h-5 w-5"
  >
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12S17.4 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.2 18.9 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.5-5.3l-6.2-5.2C29.3 35 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8H6.5C9.8 36.2 16.3 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.4 5.7-6.2 7.4l6.2 5.2C39.6 37.2 44 31.2 44 24c0-1.3-.1-2.3-.4-3.5z"/>
  </svg>
  Continue with Google
</a>
        <p className="mt-6 text-sm text-muted">
          New to Cadence?{" "}
          <Link className="font-semibold text-primary" href="/auth/sign-up">
            Create an account
          </Link>
        </p>
      </AuthLayout>
  );
}
