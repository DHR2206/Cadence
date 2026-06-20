import Link from "next/link";
import type { ReactNode } from "react";

type PublicPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function PublicPageShell({ eyebrow, title, description, children }: PublicPageShellProps) {
  return (
    <main className="min-h-screen px-5 py-10 md:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <Link className="text-lg font-extrabold tracking-tight text-ink" href="/">
            Cadence
          </Link>
          <nav aria-label="Public pages" className="flex flex-wrap gap-3 text-sm font-semibold text-muted">
            <Link className="rounded-full border border-line bg-white/70 px-4 py-2 hover:text-primary" href="/about">
              About
            </Link>
            <Link className="rounded-full border border-line bg-white/70 px-4 py-2 hover:text-primary" href="/oauth-info">
              OAuth Info
            </Link>
            <Link className="rounded-full bg-primary px-4 py-2 text-white shadow-glow" href="/auth/sign-in">
              Sign in
            </Link>
          </nav>
        </header>

        <section className="glass-panel rounded-3xl p-6 md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-primary">{eyebrow}</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-ink md:text-5xl">{title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-muted md:text-lg">{description}</p>
        </section>

        <div className="mt-6 grid gap-5">{children}</div>
      </div>
    </main>
  );
}

type ContentSectionProps = {
  title: string;
  children: ReactNode;
};

export function ContentSection({ title, children }: ContentSectionProps) {
  return (
    <section className="rounded-3xl border border-line bg-white/78 p-6 shadow-soft md:p-8">
      <h2 className="text-2xl font-bold tracking-tight text-ink">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-muted md:text-base">{children}</div>
    </section>
  );
}

type FeatureGridProps = {
  items: Array<{
    title: string;
    body: string;
  }>;
};

export function FeatureGrid({ items }: FeatureGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <article className="rounded-2xl border border-line bg-white/75 p-5" key={item.title}>
          <h3 className="font-bold text-ink">{item.title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted">{item.body}</p>
        </article>
      ))}
    </div>
  );
}
