import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Database, ShieldCheck, Zap } from "lucide-react";
import { AdUnit } from "@/components/ads/AdUnit";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ConverterLayout } from "@/components/converter/ConverterLayout";
import { ConverterSchema } from "@/components/converter/ConverterSchema";
import { PageHero } from "@/components/shared/page-hero";
import { PrivacyNote } from "@/components/converter/PrivacyNote";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { buildSeoSections } from "@/lib/converter/copy";
import { getPairExtraFaqs } from "@/lib/converter/pair-copy";
import {
  relatedConversionPairs,
  type ConversionPair,
} from "@/lib/converter/routes";
import { SITE_URL } from "@/lib/site";

/** Markdown-style inline links in deep-copy sections: [label](/slug/). */
const INLINE_LINK_PATTERN = /\[([^\]]+)\]\((\/[^\s)]*)\)/g;

function renderParagraphWithLinks(paragraph: string): ReactNode {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let linkKey = 0;
  for (const match of paragraph.matchAll(INLINE_LINK_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      nodes.push(paragraph.slice(lastIndex, index));
    }
    nodes.push(
      <Link
        key={`inline-link-${linkKey++}`}
        href={match[2]!}
        className="font-medium text-emerald-300 underline decoration-emerald-500/40 underline-offset-2 transition-colors hover:text-emerald-200"
      >
        {match[1]!}
      </Link>,
    );
    lastIndex = index + match[0].length;
  }
  if (lastIndex < paragraph.length) {
    nodes.push(paragraph.slice(lastIndex));
  }
  return nodes;
}

/**
 * Hero facts are target-aware: the default fact advertises SQL type
 * inference, which is misleading for non-SQL outputs such as YAML.
 */
const HERO_FACT_BY_TARGET: Partial<
  Record<ConversionPair["target"], { title: string; description: string }>
> = {
  yaml: {
    title: "Structure preserved",
    description: "Block-style YAML with honest scalar quoting — nesting kept intact.",
  },
  excel: {
    title: "Typed cells",
    description: "A real .xlsx workbook with typed cells and content-sized columns.",
  },
  markdown: {
    title: "Readable tables",
    description: "GitHub-Flavored pipe tables with escaped cells and numeric alignment.",
  },
};

export function buildPairMetadata(pair: ConversionPair): Metadata {
  const ogImage = `${SITE_URL}${pair.ogImage ?? "/og/csv.jpg"}`;
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
      images: [{ url: ogImage, width: 1200, height: 630, alt: pair.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${pair.title} — Online & Private | SyntaxFiddle`,
      description: pair.description,
      images: [ogImage],
    },
  };
}

export function ConversionLanding({ pair }: { pair: ConversionPair }) {
  const related = relatedConversionPairs(pair);
  const sections = buildSeoSections(pair);
  const faqs = [...pair.faqs, ...getPairExtraFaqs(pair.slug)];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
      <ConverterSchema pair={pair} />

      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "CSV & Excel Converter", href: "/csv/" },
          { label: `${pair.sourceLabel} to ${pair.targetLabel}` },
        ]}
      />

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
              ...(HERO_FACT_BY_TARGET[pair.target] ?? {
                title: "Typed output",
                description: "Columns are inferred as INTEGER, NUMERIC, BOOLEAN, or VARCHAR.",
              }),
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
                  {renderParagraphWithLinks(paragraph)}
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
          {faqs.map((faq) => (
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
            {/* Cross-link the SOQL formatter on pages that generate SOQL —
                high topical relevance + internal link equity for that tool. */}
            {pair.target === "soql-in" ? (
              <li>
                <Link
                  href="/soql-formatter/"
                  className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
                >
                  <span className="font-medium">SOQL Formatter &amp; Beautifier</span>
                  <ArrowRight size={14} className="shrink-0 text-zinc-600" />
                </Link>
              </li>
            ) : null}
          </ul>
        </Card>
      </section>

      <AdUnit format="bottom-content" className="mt-10" />
    </div>
  );
}
