import Link from "next/link";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" }
];

export function SiteFooter() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-line/70 bg-panel/95 px-5 py-4 backdrop-blur-xl shadow-lg">
     <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 text-base text-slate-700 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link className="text-xl font-extrabold tracking-tight text-slate-900" href="/">
            Cadence
          </Link>
          <p className="mt-1 text-sm text-slate-600">
              AI-powered academic planning for focused students.
          </p>
        </div>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-2">
          {footerLinks.map((link) => (
           <Link
            className="font-semibold text-slate-700 transition hover:text-primary hover:underline"
            href={link.href}
            key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
