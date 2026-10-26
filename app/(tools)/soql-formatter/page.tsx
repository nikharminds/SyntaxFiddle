import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Database, ShieldCheck, Zap } from "lucide-react";
import { AdUnit } from "@/components/ads/AdUnit";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { PageHero } from "@/components/shared/page-hero";
import { ToolSchema } from "@/components/schema/ToolSchema";
import { SoqlFormatterWorkspace } from "@/components/tools/soql-formatter/workspace";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { buildSoqlSeoSections, SOQL_FAQS, SOQL_FEATURE_LIST } from "@/lib/formatters/seo";
import { SITE_URL } from "@/lib/site";

const PAGE_URL = `${SITE_URL}/soql-formatter/`;
const TITLE = "SOQL Formatter & Beautifier (100% Offline) | SyntaxFiddle";
const DESCRIPTION =
  "Format and beautify Salesforce SOQL queries instantly. 100% offline, client-side execution ensures your enterprise schema and proprietary data never leave your browser.";

export const metadata: Metadata = {
  // `absolute` keeps the layout title template from appending a second suffix —
  // the required title already carries "| SyntaxFiddle".
  title: { absolute: TITLE },
  description: DESCRIPTION,
  keywords: [
    "soql formatter",
    "soql beautifier",
    "format soql",
    "salesforce soql formatter",
    "salesforce query formatter",
    "soql prettifier",
    "soql indent",
    "apex soql formatter",
    "online soql formatter",
    "offline soql formatter",
    "soql syntax highlighter",
  ],
  alternates: { canonical: "/soql-formatter/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    siteName: "SyntaxFiddle",
    type: "website",
    images: [{ url: `${SITE_URL}/og/soql-formatter.jpg`, width: 1200, height: 630, alt: "SOQL Formatter & Beautifier" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description:
      "Format and beautify Salesforce SOQL queries instantly — 100% offline, zero uploads.",
    images: [`${SITE_URL}/og/soql-formatter.jpg`],
  },
};

const RELATED_TOOLS = [
  { href: "/csv-to-soql/", label: "CSV to SOQL" },
  { href: "/excel-to-soql/", label: "Excel to SOQL" },
  { href: "/tools/curl-to-salesforce-apex/", label: "cURL to Salesforce Apex" },
  { href: "/jwt-decoder/", label: "JWT Decoder — Secure & Offline" },
  { href: "/regex-tester/", label: "Regex Tester & Debugger" },
];

export default function SoqlFormatterPage() {
  const sections = buildSoqlSeoSections();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <ToolSchema
        name="SOQL Formatter & Beautifier — 100% Offline"
        description={DESCRIPTION}
        url={PAGE_URL}
        featureList={SOQL_FEATURE_LIST}
        faqs={SOQL_FAQS}
      />

      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "SOQL Formatter" }]} />

      <header className="mt-6">
        <PageHero
          badges={
            <>
              <Badge variant="success">100% Client-Side</Badge>
              <Badge variant="outline">Offline Web Worker</Badge>
              <Badge variant="outline">Salesforce-Native Parser</Badge>
            </>
          }
          title="SOQL Formatter & Beautifier"
          description="Paste any SOQL query — from a one-line SELECT to a nested relationship query with TYPEOF branches and WITH SECURITY_ENFORCED — and get cleanly indented, keyword-capitalized SOQL as you type. Formatting runs in a background Web Worker, so even massive queries never freeze the page, and nothing you paste ever leaves your browser."
          facts={[
            {
              icon: Database,
              title: "Salesforce-native parser",
              description:
                "Subqueries, __c / __r / __mdt field paths, TYPEOF, and date literals parsed atomically.",
            },
            {
              icon: Zap,
              title: "Formats as you type",
              description:
                "A persistent Web Worker re-indents every keystroke without blocking the UI thread.",
            },
            {
              icon: ShieldCheck,
              title: "Zero-upload architecture",
              description:
                "No backend exists — queries describing your org schema never leave this tab.",
            },
          ]}
        />
      </header>

      <section aria-label="SOQL formatter workspace" className="mt-8">
        <SoqlFormatterWorkspace />
      </section>

      <AdUnit format="leaderboard" className="mt-10" />

      <section aria-labelledby="soql-docs-heading" className="mt-14 max-w-3xl">
        <h2 id="soql-docs-heading" className="text-xl font-bold tracking-tight text-zinc-100">
          How the SOQL formatter works
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

      <section aria-labelledby="soql-faq-heading" className="mt-14 max-w-3xl">
        <h2 id="soql-faq-heading" className="text-xl font-bold tracking-tight text-zinc-100">
          Frequently asked questions
        </h2>
        <div className="mt-6 space-y-6">
          {SOQL_FAQS.map((faq) => (
            <div key={faq.question}>
              <h3 className="text-base font-semibold text-zinc-100">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <AdUnit format="bottom-content" className="mt-10" />

      <section aria-labelledby="soql-related-heading" className="mt-14">
        <h2 id="soql-related-heading" className="text-xl font-bold tracking-tight text-zinc-100">
          Related Salesforce &amp; developer tools
        </h2>
        <Card className="mt-5 p-4 sm:p-5">
          <ul className="grid list-none gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {RELATED_TOOLS.map((tool) => (
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
