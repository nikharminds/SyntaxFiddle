import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Database, ShieldCheck, Zap } from "lucide-react";
import { AdUnit } from "@/components/ads/AdUnit";
import { ConverterLayout } from "@/components/converter/ConverterLayout";
import { ConverterSchema } from "@/components/converter/ConverterSchema";
import { PageHero } from "@/components/shared/page-hero";
import { PrivacyNote } from "@/components/converter/PrivacyNote";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { buildSeoSections } from "@/lib/converter/copy";
import {
  relatedConversionPairs,
  type ConversionPair,
} from "@/lib/converter/routes";
import { SITE_URL } from "@/lib/site";

export function buildPairMetadata(pair: ConversionPair): Metadata {
  return {
    title: pair.title,
    description: pair.description,
    keywords: pair.keywords,
    alternates: { canonical: `/${pair.slug}/` },
    openGraph: {
      title: `${pair.title} — Online & Private | SyntaxFiddle`,
      description: pair.description,
      url: `${SITE_URL}/${pair.slug}/`,
      siteName: "SyntaxFiddle",
      type: "website",
    },
  };
}

export function ConversionLanding({ pair }: { pair: ConversionPair }) {
  const related = relatedConversionPairs(pair);
  const sections = buildSeoSections(pair);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
      <ConverterSchema pair={pair} />

      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-zinc-500">
        <Link
          href="/csv/"
          className="inline-flex items-center gap-1 transition-colors hover:text-emerald-400"
        >
          <ArrowLeft size={13} />
          CSV &amp; Excel Converter
        </Link>
        <span aria-hidden>/</span>
        <span className="text-zinc-400">
          {pair.sourceLabel} to {pair.targetLabel}
        </span>
      </nav>

      <header className="mt-6">
        <PageHero
          badges={
            <>
              <Badge variant="success">Live</Badge>
              <Badge variant="info">100% client-side</Badge>
              <Badge variant="outline">
                {pair.sourceLabel} → {pair.targetLabel}
              </Badge>
            </>
          }
          title={pair.heading}
          description={pair.description}
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

      <div className="mt-10 space-y-6">
        <ConverterLayout initialSource={pair.source} initialTarget={pair.target} />
        <PrivacyNote />
        <AdUnit format="top-workspace" />
      </div>

      <section aria-labelledby="docs-heading" className="mt-14 max-w-3xl">
        <h2
          id="docs-heading"
          className="text-xl font-bold tracking-tight text-zinc-100"
        >
          Technical reference
        </h2>
        <div className="mt-6 space-y-10">
          {sections.map((section) => (
            <div key={section.heading}>
              <h3 className="text-base font-semibold text-zinc-100">{section.heading}</h3>
              {section.body.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 48)}
                  className="mt-3 text-sm leading-6 text-zinc-400"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="faq-heading" className="mt-14 max-w-3xl">
        <h2 id="faq-heading" className="text-xl font-bold tracking-tight text-zinc-100">
          Frequently asked questions
        </h2>
        <div className="mt-6 space-y-6">
          {pair.faqs.map((faq) => (
            <div key={faq.question}>
              <h3 className="text-base font-semibold text-zinc-100">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="related-heading" className="mt-14">
        <h2 id="related-heading" className="text-xl font-bold tracking-tight text-zinc-100">
          Other conversions
        </h2>
        <Card className="mt-5 p-4 sm:p-5">
          <ul className="grid list-none gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((candidate) => (
              <li key={candidate.slug}>
                <Link
                  href={`/${candidate.slug}/`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
                >
                  <span className="font-medium">
                    {candidate.sourceLabel} to {candidate.targetLabel}
                  </span>
                  <ArrowRight size={14} className="shrink-0 text-zinc-600" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <AdUnit format="bottom-content" className="mt-10" />
    </div>
  );
}
