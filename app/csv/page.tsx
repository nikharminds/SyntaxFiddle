import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Database, ShieldCheck, Zap } from "lucide-react";
import { ConverterLayout } from "@/components/converter/ConverterLayout";
import { PageHero } from "@/components/shared/page-hero";
import { Card } from "@/components/ui/card";
import { CONVERSION_PAIRS } from "@/lib/converter/routes";

export const metadata: Metadata = {
  title: "CSV/Excel to SQL, JSON, SOQL & XML Converter",
  description:
    "Convert CSV or Excel files into typed SQL INSERT statements, clean JSON, Salesforce SOQL IN clauses, or XML documents — 100% in your browser, zero uploads.",
  keywords: [
    "csv to sql",
    "csv to json",
    "csv to xml",
    "excel to sql",
    "excel to json",
    "xlsx converter",
    "csv converter",
    "soql in clause",
    "salesforce data loader",
    "insert statement generator",
  ],
};

export default function CsvPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
      <header>
        <PageHero
          badges={null}
          title="CSV & Excel to SQL / JSON / SOQL / XML Converter"
          description={
            <>
              Drop a spreadsheet or paste raw rows and export database-ready SQL,
              API-ready JSON, Salesforce{" "}
              <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-sm text-emerald-300">WHERE IN</code> clauses,
              or XML documents. Delimiter sniffing, column type inference,
              and batched output — all executed locally, so the bytes never leave
              your machine.
            </>
          }
          facts={[
            {
              icon: Zap,
              title: "Instant pipeline",
              description: "Paste, drop, or upload — conversion updates automatically.",
            },
            {
              icon: Database,
              title: "Typed output",
              description: "Columns are inferred as INTEGER, NUMERIC, BOOLEAN, or VARCHAR.",
            },
            {
              icon: ShieldCheck,
              title: "100% local",
              description: "Files never leave your browser, even at the 15MB cap.",
            },
          ]}
        />
      </header>

      <section aria-labelledby="conversions-heading" className="mt-8">
        <h2 id="conversions-heading" className="sr-only">
         Supported conversions
        </h2>
        <Card className="p-4 sm:p-5">
          <ul className="grid list-none gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {CONVERSION_PAIRS.map((pair) => (
              <li key={pair.slug}>
                <Link
                  href={`/${pair.slug}/`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
                >
                  <span className="font-medium">
                    {pair.sourceLabel} to {pair.targetLabel}
                  </span>
                  <ArrowRight size={14} className="shrink-0 text-zinc-600" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <div className="mt-10">
        <ConverterLayout />
      </div>
    </div>
  );
}
