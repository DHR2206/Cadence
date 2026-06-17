import Link from "next/link";
import { AuthSubmitButton } from "@/components/AuthSubmitButton";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { forgotPasswordAction } from "@/app/auth/actions";

type ForgotPasswordPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const params = await searchParams;

  return (
    <AuthLayout
      subtitle="Enter your email to receive a password reset link."
      title="Reset Password"
    >
      {params.error ? (
        <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">{params.error}</p>
      ) : null}
      {params.message ? (
        <p className="mt-5 rounded-2xl border border-cyan-200 bg-cyan-50 p-3 text-sm font-medium text-slate-800">{params.message}</p>
      ) : null}

      <form action={forgotPasswordAction} className="mt-6 grid gap-4">
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
        <AuthSubmitButton idleLabel="Send reset link" pendingLabel="Sending..." />
      </form>

      <p className="mt-6 text-sm text-muted">
        Remember your password?{" "}
        <Link className="font-semibold text-primary" href="/auth/sign-in">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
