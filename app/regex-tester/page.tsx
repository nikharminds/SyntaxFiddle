import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Cpu, Highlighter, ShieldCheck } from "lucide-react";
import { AdUnit } from "@/components/ads/AdUnit";
import { PageHero } from "@/components/shared/page-hero";
import { RegexLayout } from "@/components/regex/RegexLayout";
import { ToolSchema } from "@/components/schema/ToolSchema";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { buildRegexSeoSections, REGEX_CHEAT_SHEET, REGEX_FAQS } from "@/lib/regex/copy";
import { SITE_URL } from "@/lib/site";

const PAGE_URL = `${SITE_URL}/regex-tester/`;
const TITLE = "Regex Tester & Visualizer - Real-time JavaScript Matches | SyntaxFiddle";
const DESCRIPTION =
  "Test JavaScript regular expressions with real-time match highlighting, named capture-group underlines, and a flag selector. Runs in a sandboxed Web Worker with ReDoS protection — your browser never freezes.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  keywords: [
    "regex tester",
    "regex tester online",
    "regex visualizer",
    "javascript regex tester",
    "regex debugger",
    "regex capture groups",
    "regex cheat sheet",
    "redos tester",
    "catastrophic backtracking",
  ],
  alternates: { canonical: "/regex-tester/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    siteName: "SyntaxFiddle",
    type: "website",
    images: [{ url: `${SITE_URL}/og/regex.jpg`, width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [`${SITE_URL}/og/regex.jpg`],
  },
};

const FEATURE_LIST = [
  "Real-time match highlighting with alternating colors for adjacent matches",
  "Named capture groups underlined per-group in both editor and results",
  "All JavaScript matching flags: g, i, m, s, u, y",
  "Sandboxed Web Worker evaluation with 2-second ReDoS watchdog",
  "Match table with exact [start, end) offsets and captured groups",
];

export default function RegexTesterPage() {
  const sections = buildRegexSeoSections();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <ToolSchema
        name="Regex Tester & Visualizer — Real-time JavaScript Matches"
        description={DESCRIPTION}
        url={PAGE_URL}
        featureList={FEATURE_LIST}
        faqs={REGEX_FAQS}
      />

      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-zinc-500">
        <Link
          href="/regex/"
          className="inline-flex items-center gap-1 transition-colors hover:text-emerald-400"
        >
          <ArrowLeft size={13} />
          Regex Tester workspace
        </Link>
        <span aria-hidden>/</span>
        <span className="text-zinc-400">Guide, cheat sheet &amp; FAQ</span>
      </nav>

      <header className="mt-6">
        <PageHero
          badges={
            <>
              <Badge variant="success">100% Client-Side</Badge>
              <Badge variant="outline">Sandboxed Web Worker</Badge>
              <Badge variant="outline">ReDoS Guarded</Badge>
            </>
          }
          title="Regex Tester & Visualizer — Real-time JavaScript Matches"
          description="Type a pattern and watch every match highlight live, with per-group underlines and exact offsets. Below the tool: how the JavaScript RegExp flavor differs from PCRE, why catastrophic backtracking can pin a CPU for minutes, and a cheat sheet of the tokens you reach for most."
          facts={[
            {
              icon: Cpu,
              title: "Real JavaScript RegExp",
              description: "The same ECMAScript engine as Node and your browser console.",
            },
            {
              icon: ShieldCheck,
              title: "2-second ReDoS watchdog",
              description: "Catastrophic patterns are terminated, never tolerated.",
            },
            {
              icon: Highlighter,
              title: "Groups you can see",
              description: "Alternating match colors and per-group underlines.",
            },
          ]}
        />
      </header>

      <section aria-label="Regex tester" className="mt-8">
        <RegexLayout />
      </section>

      <AdUnit format="leaderboard" className="mt-10" />

      <section aria-labelledby="regex-docs-heading" className="mt-14 max-w-3xl">
        <h2 id="regex-docs-heading" className="text-xl font-bold tracking-tight text-zinc-100">
          How this regex tester works
        </h2>
        <div className="mt-6 space-y-10">
          {sections.map((section) => (
            <div key={section.heading}>
              <h3 className="text-base font-semibold text-zinc-100">{section.heading}</h3>
              {section.body.map((paragraph) => (
                <p key={paragraph.slice(0, 48)} className="mt-3 text-sm leading-6 text-zinc-400">
                  {paragraph}
                </p>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="cheatsheet-heading" className="mt-14">
        <h2 id="cheatsheet-heading" className="text-xl font-bold tracking-tight text-zinc-100">
          Cheat sheet: common regex tokens
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
          Every token below is standard JavaScript RegExp syntax — paste any of them
          into the tester above to see them in action against real text.
        </p>
        <Card className="mt-5 overflow-x-auto p-0">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left">
                <th scope="col" className="px-4 py-3 font-semibold text-zinc-300">
                  Token
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-zinc-300">
                  Matches
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-zinc-300">
                  Example
                </th>
              </tr>
            </thead>
            <tbody>
              {REGEX_CHEAT_SHEET.map((row) => (
                <tr key={row.token} className="border-b border-zinc-800/60 last:border-0">
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[13px] text-emerald-300">
                    {row.token}
                  </td>
                  <td className="px-4 py-2.5 text-zinc-300">{row.meaning}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-zinc-500">{row.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      <section aria-labelledby="regex-faq-heading" className="mt-14 max-w-3xl">
        <h2 id="regex-faq-heading" className="text-xl font-bold tracking-tight text-zinc-100">
          Frequently asked questions
        </h2>
        <div className="mt-6 space-y-6">
          {REGEX_FAQS.map((faq) => (
            <div key={faq.question}>
              <h3 className="text-base font-semibold text-zinc-100">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <AdUnit format="bottom-content" className="mt-10" />

      <section aria-labelledby="regex-related-heading" className="mt-14">
        <h2 id="regex-related-heading" className="text-xl font-bold tracking-tight text-zinc-100">
          Related tools
        </h2>
        <Card className="mt-5 p-4 sm:p-5">
          <ul className="grid list-none gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { href: "/jwt-decoder/", label: "JWT Decoder — Secure & Offline" },
              { href: "/regex/", label: "Regex Tester workspace" },
              { href: "/cron/", label: "Cron Expression Visualizer" },
              { href: "/json-to-schema/", label: "JSON to Schema Converter" },
            ].map((tool) => (
              <li key={tool.href}>
                <Link
                  href={tool.href}
                  className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
                >
                  <span className="font-medium">{tool.label}</span>
                  <ArrowRight size={14} className="shrink-0 text-zinc-600" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}
