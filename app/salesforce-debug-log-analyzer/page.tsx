import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Cpu, Gauge, ShieldCheck } from "lucide-react";
import { AdUnit } from "@/components/ads/AdUnit";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { PageHero } from "@/components/shared/page-hero";
import { LogAnalyzerLayout } from "@/components/salesforce-log/LogAnalyzerLayout";
import { ToolSchema } from "@/components/schema/ToolSchema";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  buildSalesforceLogSeoSections,
  SALESFORCE_LOG_FAQS,
} from "@/lib/salesforce-log/copy";
import { SITE_URL } from "@/lib/site";

const PAGE_URL = `${SITE_URL}/salesforce-debug-log-analyzer/`;
const TITLE = "Salesforce Debug Log Analyzer Online | Client-Side Privacy";
const DESCRIPTION =
  "Analyze Salesforce debug logs online, entirely in your browser: N+1 SOQL detection, grouped SOQL and DML statistics, governor-limit usage with close-to-limit alerts, and exceptions with stack traces. Parsed by a dedicated Web Worker — no API route exists, so your log can never leave this tab.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  keywords: [
    "salesforce debug log analyzer",
    "debug log analyzer",
    "salesforce debug log parser",
    "apex debug log",
    "salesforce log viewer",
    "salesforce governor limits",
    "LIMIT_USAGE_FOR_NS",
    "SOQL_EXECUTE_BEGIN",
    "n+1 soql",
    "soql in loop",
    "salesforce bulkify",
    "soql analyzer",
    "dml limit salesforce",
    "salesforce log parser online",
    "developer console alternative",
    "apex log analyzer",
    "salesforce debug log reader",
    "salesforce logs explained",
    "close to limit salesforce",
    "salesforce exception log",
  ],
  alternates: { canonical: "/salesforce-debug-log-analyzer/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    siteName: "SyntaxFiddle",
    type: "website",
    images: [
      { url: `${SITE_URL}/og/salesforce-debug-log-analyzer.jpg`, width: 1200, height: 630, alt: TITLE },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [`${SITE_URL}/og/salesforce-debug-log-analyzer.jpg`],
  },
};

const FEATURE_LIST = [
  "N+1 SOQL detection — structurally identical queries flagged by execution count",
  "Drag-and-drop .txt / .log upload with a paste-raw-text fallback",
  "Dedicated Web Worker parsing — 20 MB logs never freeze the page",
  "Per-namespace governor-limit peaks with CLOSE TO LIMIT detection",
  "SOQL/SOSL/DML forensics: rows, durations, aggregations, table-scan warnings",
  "Sortable, paginated tables for thousands of rows without DOM freezes",
  "Exceptions, fatal errors, and stack traces extracted with click-to-copy",
];

export default function SalesforceDebugLogAnalyzerPage() {
  const sections = buildSalesforceLogSeoSections();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      {/* WebApplication JSON-LD (applicationCategory: DeveloperApplication)
          plus FAQPage schema — emitted by ToolSchema. */}
      <ToolSchema
        name="Salesforce Debug Log Analyzer — N+1 Detection, Limits & Errors"
        description={DESCRIPTION}
        url={PAGE_URL}
        featureList={FEATURE_LIST}
        faqs={SALESFORCE_LOG_FAQS}
      />

      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Salesforce Tools", href: "/salesforce/" },
          { label: "Salesforce Debug Log Analyzer", href: "/salesforce-debug-log-analyzer/" },
        ]}
      />

      <header className="mt-6">
        <PageHero
          badges={
            <>
              <Badge variant="success">100% Client-Side</Badge>
              <Badge variant="outline">Web Worker Parsing</Badge>
              <Badge variant="outline">Zero Uploads</Badge>
            </>
          }
          title="Salesforce Debug Log Analyzer — N+1 Detection, Limits & Errors"
          description="Drop a Salesforce debug log and get an instant, structured diagnosis: N+1 SOQL loops flagged by structural fingerprint, governor-limit usage with close-to-limit alerts, per-statement SOQL/DML timings, and every exception with its stack trace — all parsed in a page-local Web Worker. Your logs contain customer data; they never leave this tab."
          facts={[
            {
              icon: ShieldCheck,
              title: "Private by architecture",
              description:
                "No API route exists. Parsing happens in a worker with no network access.",
            },
            {
              icon: Cpu,
              title: "N+1 loop detection",
              description:
                "Structural fingerprinting flags queries re-run with only filter values changing.",
            },
            {
              icon: Gauge,
              title: "Governor heat map",
              description:
                "Final LIMIT_USAGE_FOR_NS block per namespace, with CLOSE TO LIMIT flags.",
            },
          ]}
        />
      </header>

      <section aria-label="Debug log analyzer" className="mt-8">
        <LogAnalyzerLayout />
      </section>

      <AdUnit format="leaderboard" className="mt-10" />

      <section aria-labelledby="sfdla-docs-heading" className="mt-14 max-w-3xl">
        <h2 id="sfdla-docs-heading" className="text-xl font-bold tracking-tight text-zinc-100">
          How this debug log analyzer works
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

      <section aria-labelledby="sfdla-faq-heading" className="mt-14 max-w-3xl">
        <h2 id="sfdla-faq-heading" className="text-xl font-bold tracking-tight text-zinc-100">
          Frequently asked questions
        </h2>
        <div className="mt-6 space-y-6">
          {SALESFORCE_LOG_FAQS.map((faq) => (
            <div key={faq.question}>
              <h3 className="text-base font-semibold text-zinc-100">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <AdUnit format="bottom-content" className="mt-10" />

      <section aria-labelledby="sfdla-related-heading" className="mt-14">
        <h2 id="sfdla-related-heading" className="text-xl font-bold tracking-tight text-zinc-100">
          More Salesforce developer tools
        </h2>
        <Card className="mt-5 p-4 sm:p-5">
          <ul className="grid list-none gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { href: "/salesforce/", label: "All Salesforce Developer Tools" },
              { href: "/salesforce-id-converter/", label: "Salesforce ID Converter — 15 to 18 Digit" },
              { href: "/cron/salesforce/", label: "Salesforce Cron Expression Builder" },
              { href: "/soql-formatter/", label: "SOQL Formatter — Beautify Queries" },
              { href: "/json-to-apex/", label: "JSON to Apex Class Generator" },
              { href: "/tools/curl-to-salesforce-apex/", label: "cURL to Salesforce Apex" },
              { href: "/csv-to-soql/", label: "CSV to SOQL IN Clauses" },
              { href: "/regex-tester/", label: "Regex Tester & Visualizer" },
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
