import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Braces, Fingerprint, Layers, WifiOff } from "lucide-react";
import { AdUnit } from "@/components/ads/AdUnit";
import { IdConverterLayout } from "@/components/salesforce-id-converter/IdConverterLayout";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { CopyButton } from "@/components/shared/copy-button";
import { PageHero } from "@/components/shared/page-hero";
import { ToolSchema } from "@/components/schema/ToolSchema";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  APEX_TO18_METHOD,
  buildIdConverterSections,
  EXCEL_CHECK_CHAR_FORMULA,
  ID_CONVERTER_FAQS,
} from "@/lib/salesforce-id-converter/copy";
import { SITE_URL } from "@/lib/site";

const PAGE_URL = `${SITE_URL}/salesforce-id-converter/`;
const TITLE = "Salesforce ID Converter — 15 to 18 Digit | SyntaxFiddle";
const DESCRIPTION =
  "Convert Salesforce IDs between 15 and 18 characters in bulk — with object-prefix detection and checksum verification. Verified Excel formula and Apex method included.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  keywords: [
    "salesforce id converter",
    "15 digit to 18 digit salesforce",
    "salesforce 18 digit id",
    "convert 15 to 18 digit id",
    "salesforce 18 to 15",
    "case safe id salesforce",
    "salesforce record id converter",
    "salesforce id excel formula",
    "salesforce id apex",
    "salesforce id bulk convert",
  ],
  alternates: { canonical: "/salesforce-id-converter/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    siteName: "SyntaxFiddle",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og/salesforce-id-converter.jpg`,
        width: 1200,
        height: 630,
        alt: TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [`${SITE_URL}/og/salesforce-id-converter.jpg`],
  },
};

const FEATURE_LIST = [
  "Single and bulk conversion — paste one Id or a column of thousands",
  "Object-prefix detection for standard objects (001 = Account, 003 = Contact, 500 = Case, …)",
  "Checksum verification flags 18-character Ids whose suffix does not match",
  "Copy-paste Excel formula and Apex utility method included",
  "100% client-side — Ids never leave the browser",
];

function CodeBlock({ title, code, note }: { title: string; code: string; note?: string }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
        <CopyButton value={code} label="Copy" />
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-6 text-zinc-200">
        <code>{code}</code>
      </pre>
      {note ? (
        <p className="border-t border-zinc-800 px-4 py-3 text-xs leading-5 text-zinc-500">{note}</p>
      ) : null}
    </Card>
  );
}

export default function SalesforceIdConverterPage() {
  const sections = buildIdConverterSections();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <ToolSchema
        name="Salesforce ID Converter — 15 to 18 Digit, Case-Safe"
        description={DESCRIPTION}
        url={PAGE_URL}
        featureList={FEATURE_LIST}
        faqs={ID_CONVERTER_FAQS}
        breadcrumbs={[
          { name: "Home", item: `${SITE_URL}/` },
          { name: "Salesforce", item: `${SITE_URL}/salesforce/` },
          { name: "Salesforce ID Converter", item: PAGE_URL },
        ]}
      />

      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Salesforce", href: "/salesforce/" },
          { label: "Salesforce ID Converter" },
        ]}
      />

      <header className="mt-6">
        <PageHero
          badges={
            <>
              <Badge variant="success">100% Client-Side</Badge>
              <Badge variant="outline">Bulk Mode</Badge>
              <Badge variant="outline">No Org Login</Badge>
            </>
          }
          title="Salesforce ID Converter — 15 ⇄ 18 Characters"
          description="Paste a Salesforce record ID and get the case-safe 18-character form (and back again) instantly — with object-prefix detection and checksum verification. Below the tool: why two ID lengths exist, how the check characters are computed, and the exact Excel formula and Apex method to do it yourself."
          facts={[
            {
              icon: WifiOff,
              title: "Nothing uploaded",
              description: "Conversion runs in your tab — bulk exports never leave the machine.",
            },
            {
              icon: Fingerprint,
              title: "Checksum aware",
              description: "Flags 18-character Ids whose case-parity suffix doesn't match.",
            },
            {
              icon: Layers,
              title: "Prefix lookup",
              description: "001 → Account, 003 → Contact — standard objects named automatically.",
            },
          ]}
        />
      </header>

      <section aria-label="Salesforce ID converter" className="mt-8">
        <IdConverterLayout />
      </section>

      <AdUnit format="leaderboard" className="mt-10" />

      <section aria-labelledby="id-excel-heading" className="mt-14">
        <h2 id="id-excel-heading" className="text-xl font-bold tracking-tight text-zinc-100">
          Convert 15-to-18-digit Salesforce IDs yourself: Excel &amp; Apex
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          The same algorithm, in the two places Salesforce teams need it most — spreadsheets and
          Apex exports. Both are verified against the converter above.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <CodeBlock
            title="Excel formula (first check character)"
            code={EXCEL_CHECK_CHAR_FORMULA}
            note="Avoid UPPER-comparison formulas — they treat digits as uppercase and produce wrong check characters. CODE-based tests are correct in every Excel version, LibreOffice, and Google Sheets."
          />
          <CodeBlock
            title="Apex utility method"
            code={APEX_TO18_METHOD}
            note="Add to a utility class; call per row when exporting Ids to case-insensitive systems. Passing an 18-character Id through is a no-op, so it is safe to call unconditionally."
          />
        </div>
      </section>

      <section aria-labelledby="id-docs-heading" className="mt-14 max-w-3xl">
        <h2 id="id-docs-heading" className="text-xl font-bold tracking-tight text-zinc-100">
          How Salesforce IDs and the 18-character checksum work
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

      <section aria-labelledby="id-faq-heading" className="mt-14 max-w-3xl">
        <h2 id="id-faq-heading" className="text-xl font-bold tracking-tight text-zinc-100">
          Frequently asked questions
        </h2>
        <div className="mt-6 space-y-6">
          {ID_CONVERTER_FAQS.map((faq) => (
            <div key={faq.question}>
              <h3 className="text-base font-semibold text-zinc-100">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <AdUnit format="bottom-content" className="mt-10" />

      <section aria-labelledby="id-related-heading" className="mt-14">
        <h2 id="id-related-heading" className="text-xl font-bold tracking-tight text-zinc-100">
          More Salesforce developer tools
        </h2>
        <Card className="mt-5 p-4 sm:p-5">
          <ul className="grid list-none gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { href: "/salesforce/", label: "All Salesforce Developer Tools" },
              { href: "/salesforce-debug-log-analyzer/", label: "Debug Log Analyzer" },
              { href: "/soql-formatter/", label: "SOQL Formatter — Beautify Queries" },
              { href: "/cron/salesforce/", label: "Salesforce Cron Expression Builder" },
              { href: "/json-to-apex/", label: "JSON to Apex Class Generator" },
              { href: "/tools/curl-to-salesforce-apex/", label: "cURL to Salesforce Apex" },
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
