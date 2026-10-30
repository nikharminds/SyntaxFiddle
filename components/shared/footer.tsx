import Link from "next/link";
import { CodeXml } from "lucide-react";

const TOOL_LINKS = [
  { href: "/cron", label: "Cron Expression Tester & Generator" },
  { href: "/csv", label: "CSV & Excel Converter" },
  { href: "/regex", label: "Regex Tester" },
  { href: "/jwt", label: "JWT Decoder" },
  { href: "/curl-converter", label: "cURL Converter" },
  { href: "/json-to-schema", label: "JSON to Schema Converter" },
  { href: "/xml-to-schema", label: "XML to Schema Converter" },
  { href: "/tools", label: "Developer Tools Directory" },
];

const COMPANY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "https://github.com/nikharminds/SyntaxFiddle", label: "GitHub (open source)" },
];

export function Footer() {
  return (
    <footer className="border-t border-zinc-800/80 bg-zinc-950">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-5">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900">
              <CodeXml size={16} className="text-emerald-400" />
            </span>
            <span className="text-base font-semibold tracking-tight text-zinc-100">SyntaxFiddle</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-6 text-zinc-400">
            Enterprise-grade developer utilities that run entirely in your browser.
            Static export, zero backend, zero data logged. Built for the global
            developer community.
          </p>
        </div>

        <nav aria-label="Tools">
          <h2 className="text-sm font-semibold text-zinc-100">Tools</h2>
          <ul className="mt-4 space-y-3">
            {TOOL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-zinc-400 transition-colors hover:text-emerald-400"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Resources">
          <h2 className="text-sm font-semibold text-zinc-100">Resources</h2>
          <ul className="mt-4 space-y-3">
            <li>
              <Link
                href="/blog/"
                className="text-sm text-zinc-400 transition-colors hover:text-emerald-400"
              >
                Blog
              </Link>
            </li>
            <li>
              <a
                href="/rss.xml"
                className="text-sm text-zinc-400 transition-colors hover:text-emerald-400"
              >
                RSS Feed
              </a>
            </li>
          </ul>
        </nav>

        <nav aria-label="Company">
          <h2 className="text-sm font-semibold text-zinc-100">Company</h2>
          <ul className="mt-4 space-y-3">
            {COMPANY_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-zinc-400 transition-colors hover:text-emerald-400"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-zinc-800/80">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-2 px-4 py-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:px-6">
          <p>© 2026 SyntaxFiddle. All parsing happens locally in your browser.</p>
          <p className="font-mono">
            Next.js static export · 0 server runtimes · 0 databases
          </p>
        </div>
      </div>
    </footer>
  );
}
