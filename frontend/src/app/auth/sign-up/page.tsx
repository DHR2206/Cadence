import Link from "next/link";
import { AuthSubmitButton } from "@/components/AuthSubmitButton";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { signUpAction } from "@/app/auth/actions";

type SignUpPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;

  return (
    <AuthLayout
      subtitle="Start with a protected profile and database-backed academic data."
      title="Create account"
    >
      {params.error ? (
        <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">{params.error}</p>
      ) : null}

        <form action={signUpAction} className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Full name</span>
            <input
              autoComplete="name"
              className="rounded-xl border border-line bg-white px-3 py-2 text-sm focus:focus-ring"
              name="fullName"
              required
            />
          </label>
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
              autoComplete="new-password"
              className="rounded-xl border border-line bg-white px-3 py-2 text-sm focus:focus-ring"
              minLength={6}
              name="password"
              required
              type="password"
            />
          </label>
          <AuthSubmitButton idleLabel="Create account" pendingLabel="Creating..." />
        </form>

        <p className="mt-6 text-sm text-muted">
          Already have an account?{" "}
          <Link className="font-semibold text-primary" href="/auth/sign-in">
            Sign in
          </Link>
        </p>
      </AuthLayout>
  );
}
