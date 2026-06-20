import Link from "next/link";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" }
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line/70 bg-panel/82 px-5 py-6 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link className="font-extrabold tracking-tight text-ink" href="/">
            Cadence
          </Link>
          <p className="mt-1 text-xs">AI-powered academic planning for focused students.</p>
        </div>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-2">
          {footerLinks.map((link) => (
            <Link className="font-semibold text-muted transition hover:text-primary" href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
