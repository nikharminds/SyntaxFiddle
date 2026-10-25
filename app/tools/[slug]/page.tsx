import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, FileCode2, Lock, Zap } from "lucide-react";
import { ConverterWorkbench } from "@/components/tools/converter-workbench";
import { PageHero } from "@/components/shared/page-hero";
import { Badge } from "@/components/ui/badge";
import {
  CONVERTER_ROUTES,
  getAllConverterSlugs,
  type SeoConverterRoute,
} from "@/lib/config/converters";
import { SITE_URL } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return getAllConverterSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const route = CONVERTER_ROUTES[slug];
  if (!route) return {};

  const ogImage = `${SITE_URL}/og/${route.slug}.jpg`;

  return {
    title: { absolute: route.metaTitle },
    description: route.metaDescription,
    keywords: route.keywords,
    alternates: { canonical: `/tools/${route.slug}/` },
    openGraph: {
      title: route.metaTitle,
      description: route.metaDescription,
      url: `${SITE_URL}/tools/${route.slug}/`,
      siteName: "SyntaxFiddle",
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: route.h1 }],
    },
    twitter: {
      card: "summary_large_image",
      title: route.metaTitle,
      description: route.metaDescription,
      images: [ogImage],
    },
  };
}

function buildStructuredData(route: SeoConverterRoute, url: string): unknown {
  return [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: route.h1,
      description: route.metaDescription,
      url,
      operatingSystem: "All",
      applicationCategory: "DeveloperApplication",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: route.faq.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Tools", item: `${SITE_URL}/tools/` },
        { "@type": "ListItem", position: 3, name: route.targetName, item: url },
      ],
    },
  ];
}

export default async function ToolConverterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const route = CONVERTER_ROUTES[slug];
  if (!route) notFound();

  const url = `${SITE_URL}/tools/${route.slug}/`;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildStructuredData(route, url)) }}
      />

      <nav aria-label="Breadcrumb">
        <ol className="flex list-none flex-wrap items-center gap-1.5 text-xs text-zinc-500">
          <li>
            <Link href="/" className="transition-colors hover:text-emerald-400">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/tools/" className="transition-colors hover:text-emerald-400">
              Tools
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-zinc-300">
            {route.h1}
          </li>
        </ol>
      </nav>

      <header className="mt-6">
        <PageHero
          badges={
            <>
              <Badge variant="success">100% Client-Side</Badge>
              <Badge variant="outline">Zero Upload</Badge>
              <Badge variant="outline">
                {route.sourceName} → {route.targetName}
              </Badge>
            </>
          }
          title={route.h1}
          description={route.tagline}
          facts={[
            {
              icon: Lock,
              title: "Zero upload, ever",
              description: `This ${route.sourceName} → ${route.targetName} conversion runs entirely in your browser — nothing touches a server.`,
            },
            {
              icon: Zap,
              title: "Instant & unlimited",
              description:
                "No sign-up, no quotas — paste your input and copy the result immediately, free forever.",
            },
            {
              icon: FileCode2,
              title: `Idiomatic ${route.targetName}`,
              description:
                "Output follows the target's own conventions — ready to paste straight into your project.",
            },
          ]}
        />
      </header>

      <section
        aria-label={`${route.sourceName} to ${route.targetName} converter workspace`}
        className="mt-8"
      >
        <ConverterWorkbench
          slug={route.slug}
          toolType={route.toolType}
          preloadedInput={route.preloadedInput}
        />
      </section>

      <article className="mt-14 space-y-14">
        <section aria-labelledby={`${route.slug}-about-heading`} className="max-w-3xl">
          <h2
            id={`${route.slug}-about-heading`}
            className="text-xl font-bold tracking-tight text-zinc-100"
          >
            About this conversion
          </h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">{route.staticSeoExplanation}</p>
        </section>

        <section aria-labelledby={`${route.slug}-syntax-heading`} className="max-w-3xl">
          <h2
            id={`${route.slug}-syntax-heading`}
            className="text-xl font-bold tracking-tight text-zinc-100"
          >
            Key Syntax Transformations
          </h2>
          <ul className="mt-5 list-none space-y-4">
            {route.syntaxHighlights.map((highlight) => (
              <li
                key={highlight.title}
                className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3"
              >
                <h3 className="text-sm font-semibold text-zinc-100">{highlight.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-zinc-400">
                  {highlight.description}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {route.sections && route.sections.length > 0 ? (
          <section aria-labelledby={`${route.slug}-docs-heading`} className="max-w-3xl">
            <h2
              id={`${route.slug}-docs-heading`}
              className="text-xl font-bold tracking-tight text-zinc-100"
            >
              Technical documentation
            </h2>
            <div className="mt-6 space-y-10">
              {route.sections.map((section) => (
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
        ) : null}

        <section aria-labelledby={`${route.slug}-faq-heading`} className="max-w-3xl">
          <h2
            id={`${route.slug}-faq-heading`}
            className="text-xl font-bold tracking-tight text-zinc-100"
          >
            Frequently Asked Questions
          </h2>
          <div className="mt-5 space-y-3">
            {route.faq.map((faq) => (
              <details
                key={faq.question}
                className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3"
              >
                <summary className="cursor-pointer text-sm font-semibold text-zinc-100">
                  {faq.question}
                </summary>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section aria-labelledby={`${route.slug}-related-heading`}>
          <h2
            id={`${route.slug}-related-heading`}
            className="text-xl font-bold tracking-tight text-zinc-100"
          >
            Related Converters
          </h2>
          <ul className="mt-5 grid list-none gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {route.relatedSlugs.map((relatedSlug) => {
              const related = CONVERTER_ROUTES[relatedSlug];
              if (!related) return null;
              return (
                <li key={relatedSlug}>
                  <Link
                    href={`/tools/${related.slug}/`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
                  >
                    <span className="font-medium">
                      {related.sourceName} to {related.targetName}
                    </span>
                    <ArrowRight size={14} className="shrink-0 text-zinc-600" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </article>
    </div>
  );
}
