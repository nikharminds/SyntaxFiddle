import type { Metadata } from "next";
import Link from "next/link";
import {
  AlignLeft,
  ArrowRight,
  Braces,
  Cpu,
  FileSearch,
  FileSpreadsheet,
  KeyRound,
  ShieldCheck,
  SquareTerminal,
  Table2,
  type LucideIcon,
} from "lucide-react";
import { AdUnit } from "@/components/ads/AdUnit";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { PageHero } from "@/components/shared/page-hero";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  SALESFORCE_HUB_DESCRIPTION,
  SALESFORCE_HUB_FAQS,
  SALESFORCE_HUB_KEYWORDS,
  SALESFORCE_HUB_TITLE,
  SALESFORCE_HUB_URL,
  SALESFORCE_TOOLS,
} from "@/lib/salesforce/hub";
import { SITE_URL } from "@/lib/site";

const PAGE_URL = `${SITE_URL}${SALESFORCE_HUB_URL}`;

export const metadata: Metadata = {
  title: { absolute: SALESFORCE_HUB_TITLE },
  description: SALESFORCE_HUB_DESCRIPTION,
  keywords: SALESFORCE_HUB_KEYWORDS,
  alternates: { canonical: SALESFORCE_HUB_URL },
  openGraph: {
    title: SALESFORCE_HUB_TITLE,
    description: SALESFORCE_HUB_DESCRIPTION,
    url: PAGE_URL,
    siteName: "SyntaxFiddle",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og/salesforce.jpg`,
        width: 1200,
        height: 630,
        alt: SALESFORCE_HUB_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SALESFORCE_HUB_TITLE,
    description: SALESFORCE_HUB_DESCRIPTION,
    images: [`${SITE_URL}/og/salesforce.jpg`],
  },
};

const TOOL_ICONS: Record<string, LucideIcon> = {
  "/salesforce-debug-log-analyzer/": FileSearch,
  "/soql-formatter/": AlignLeft,
  "/json-to-apex/": Braces,
  "/csv-to-soql/": Table2,
  "/excel-to-soql/": FileSpreadsheet,
  "/tools/curl-to-salesforce-apex/": SquareTerminal,
};

/**
 * Hub structured data: CollectionPage + ItemList (crawlable inventory of the
 * cluster) + FAQPage, in one @graph. Tool pages themselves carry WebApplication
 * schema via ToolSchema.
 */
const hubJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      name: "Salesforce Developer Tools",
      url: PAGE_URL,
      description: SALESFORCE_HUB_DESCRIPTION,
      isPartOf: { "@type": "WebSite", name: "SyntaxFiddle", url: `${SITE_URL}/` },
    },
    {
      "@type": "ItemList",
      name: "Salesforce developer tools",
      itemListElement: SALESFORCE_TOOLS.map((tool, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: tool.label,
        url: `${SITE_URL}${tool.href}`,
      })),
    },
    {
      "@type": "FAQPage",
      mainEntity: SALESFORCE_HUB_FAQS.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
  ],
};

export default function SalesforceHubPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(hubJsonLd) }}
      />

      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Salesforce Tools", href: SALESFORCE_HUB_URL },
        ]}
      />

      <header className="mt-6">
        <PageHero
          badges={
            <>
              <Badge variant="success">{SALESFORCE_TOOLS.length} Free Tools</Badge>
              <Badge variant="outline">100% Client-Side</Badge>
              <Badge variant="outline">No Org Login</Badge>
            </>
          }
          title="Salesforce Developer Tools — Free, Online & 100% Client-Side"
          description="A complete Apex and SOQL toolkit that runs entirely in your browser: analyze debug logs for N+1 loops and governor-limit pressure, format SOQL, generate Apex classes from JSON, build WHERE IN clauses from spreadsheets, and transpile cURL to Apex. No account, no OAuth, no uploads — your org data never leaves this tab."
          facts={[
            {
              icon: ShieldCheck,
              title: "Private by design",
              description: "No API route exists — logs and payloads are parsed locally.",
            },
            {
              icon: KeyRound,
              title: "No org connection",
              description: "Zero OAuth, zero credentials. Paste, drop, and go.",
            },
            {
              icon: Cpu,
              title: "Built for real workloads",
              description: "Web Worker parsing handles Salesforce's 20 MB log ceiling.",
            },
          ]}
        />
      </header>

      <section aria-labelledby="sf-tools-heading" className="mt-10">
        <h2 id="sf-tools-heading" className="text-xl font-bold tracking-tight text-zinc-100">
          All Salesforce tools
        </h2>
        <ul className="mt-5 grid list-none gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SALESFORCE_TOOLS.map((tool) => {
            const Icon = TOOL_ICONS[tool.href] ?? FileSearch;
            return (
              <li key={tool.href}>
                <Card hover className="h-full">
                  <Link
                    href={tool.href}
                    className="flex h-full flex-col gap-3 p-5 focus-visible:outline-none"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10">
                        <Icon size={18} className="text-emerald-400" aria-hidden />
                      </span>
                      {tool.badge ? <Badge variant="success">{tool.badge}</Badge> : null}
                    </div>
                    <h3 className="text-base font-semibold tracking-tight text-zinc-100">
                      {tool.label}
                    </h3>
                    <p className="text-sm leading-6 text-zinc-400">{tool.tagline}</p>
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-1 text-sm font-medium text-emerald-400">
                      Open {tool.shortLabel}
                      <ArrowRight size={14} aria-hidden />
                    </span>
                  </Link>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      <AdUnit format="leaderboard" className="mt-10" />

      <section aria-labelledby="sf-workflow-heading" className="mt-14 max-w-3xl">
        <h2 id="sf-workflow-heading" className="text-xl font-bold tracking-tight text-zinc-100">
          A client-side workflow for Salesforce performance work
        </h2>
        <div className="mt-6 space-y-8 text-sm leading-6 text-zinc-400">
          <p>
            Most Salesforce performance investigations start with a{" "}
            <Link
              href="/salesforce-debug-log-analyzer/"
              className="font-medium text-emerald-400 hover:underline"
            >
              Salesforce debug log analyzer
            </Link>
            . Debug logs record every SOQL statement, DML operation, governor-limit snapshot,
            and exception in a transaction — but raw, they are megabytes of dense event lines.
            Drop one into the analyzer and you get grouped query statistics with execution
            durations, a close-to-limit heat map for every namespace, and N+1 loops flagged by
            structural fingerprint. Because parsing happens in a Web Worker on your machine,
            logs containing customer record data are safe to inspect — nothing is uploaded,
            ever.
          </p>
          <p>
            When the analyzer flags a{" "}
            <Link
              href="/salesforce-debug-log-analyzer/"
              className="font-medium text-emerald-400 hover:underline"
            >
              potential N+1
            </Link>{" "}
            — the same query shape re-executed once per record — the fix is bulkification:
            collect the varying filter values and run one query with an IN bind. Building those
            bind lists is where the{" "}
            <Link href="/csv-to-soql/" className="font-medium text-emerald-400 hover:underline">
              CSV to SOQL
            </Link>{" "}
            and{" "}
            <Link
              href="/excel-to-soql/"
              className="font-medium text-emerald-400 hover:underline"
            >
              Excel to SOQL
            </Link>{" "}
            converters earn their keep: paste an ID column, get a safely escaped WHERE IN
            clause. Long, nested queries are easier to review after a pass through the{" "}
            <Link href="/soql-formatter/" className="font-medium text-emerald-400 hover:underline">
              SOQL formatter
            </Link>
            , which understands subqueries, TYPEOF blocks, and __r relationship paths.
          </p>
          <p>
            Integrations get their own toolkit: paste a JSON payload — a SOQL query result, a
            REST response, a platform event — into the{" "}
            <Link href="/json-to-apex/" className="font-medium text-emerald-400 hover:underline">
              JSON to Apex class generator
            </Link>{" "}
            for a typed wrapper with a static parse, and turn any captured{" "}
            <Link
              href="/tools/curl-to-salesforce-apex/"
              className="font-medium text-emerald-400 hover:underline"
            >
              cURL command into Apex HttpRequest
            </Link>{" "}
            callout code with headers, auth, and query strings intact. Every tool in this hub
            shares the same guarantee: static pages, zero server runtimes, and zero data
            logged.
          </p>
        </div>
      </section>

      <section aria-labelledby="sf-faq-heading" className="mt-14 max-w-3xl">
        <h2 id="sf-faq-heading" className="text-xl font-bold tracking-tight text-zinc-100">
          Frequently asked questions
        </h2>
        <div className="mt-6 space-y-6">
          {SALESFORCE_HUB_FAQS.map((faq) => (
            <div key={faq.question}>
              <h3 className="text-base font-semibold text-zinc-100">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <AdUnit format="bottom-content" className="mt-10" />

      <section aria-labelledby="sf-related-heading" className="mt-14">
        <h2 id="sf-related-heading" className="text-xl font-bold tracking-tight text-zinc-100">
          Beyond Salesforce
        </h2>
        <Card className="mt-5 p-4 sm:p-5">
          <ul
            className={cn(
              "grid list-none gap-2 sm:grid-cols-2 lg:grid-cols-4",
            )}
          >
            {[
              { href: "/tools/", label: "Developer Tools Directory" },
              { href: "/cron/", label: "Cron Tester & Generator" },
              { href: "/regex-tester/", label: "Regex Tester & Visualizer" },
              { href: "/blog/", label: "Engineering Blog" },
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
                >
                  <span className="font-medium">{link.label}</span>
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
