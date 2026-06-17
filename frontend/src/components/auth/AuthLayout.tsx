import type { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
  subtitle?: string;
  title: string;
};

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="glass-panel w-full max-w-md rounded-3xl p-7 transition-all duration-300 hover:shadow-glow">
        <header className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Cadence AI</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm leading-6 text-muted">{subtitle}</p> : null}
        </header>
        {children}
      </section>
    </main>
  );
}
