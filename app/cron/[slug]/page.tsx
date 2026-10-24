import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { CodeSnippets } from "@/components/cron/code-snippets";
import { CronPlayground } from "@/components/cron/cron-playground";
import { RelatedRecipes } from "@/components/cron/related-recipes";
import { StructuredData } from "@/components/cron/structured-data";
import { AdUnit } from "@/components/ads/AdUnit";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DIALECTS } from "@/lib/cron/dialects";
import { analyzeCronExpression, type CronAnalysisResult } from "@/lib/cron/engine";
import { getRecipeDeepContent, type RecipeDeepContent } from "@/lib/cron/deep-content";
import { getRecipe, RECIPES } from "@/lib/cron/recipes";
import { buildRecipeFaqs, buildRecipeSnippets } from "@/lib/cron/seo";
import { SITE_URL } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return RECIPES.map((recipe) => ({ slug: recipe.slug }));
}

const ANALYSIS_CACHE = new Map<string, CronAnalysisResult>();

function getRecipeAnalysis(slug: string): CronAnalysisResult {
  const cached = ANALYSIS_CACHE.get(slug);
  if (cached) return cached;
  const recipe = getRecipe(slug);
  if (!recipe) {
    throw new Error(`Unknown recipe: ${slug}`);
  }
  const result = analyzeCronExpression(recipe.expression, recipe.dialect, "UTC", 5);
  ANALYSIS_CACHE.set(slug, result);
  return result;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const recipe = getRecipe(slug);
  if (!recipe) return {};

  const analysis = getRecipeAnalysis(slug);
  const displayExpression =
    recipe.dialect === "aws" ? `cron(${recipe.expression})` : recipe.expression;
  const title = `${displayExpression} - ${recipe.title} | SyntaxFiddle`;
  const description = `${analysis.humanReadable}. ${recipe.description}`;
  const url = `${SITE_URL}/cron/${recipe.slug}/`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "SyntaxFiddle",
      images: [{ url: `${SITE_URL}/og/cron.jpg`, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_URL}/og/cron.jpg`],
    },
  };
}

export default async function CronRecipePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const recipe = getRecipe(slug);
  if (!recipe) notFound();

  const analysis = getRecipeAnalysis(slug);
  const faqs = buildRecipeFaqs(recipe, analysis.humanReadable, analysis.fields);
  const snippets = buildRecipeSnippets(recipe);
  const deepContent: RecipeDeepContent | undefined = getRecipeDeepContent(slug);
  const allFaqs = deepContent ? [...faqs, ...deepContent.extraFaqs] : faqs;
  const dialectLabel = DIALECTS[recipe.dialect].label;
  const url = `${SITE_URL}/cron/${recipe.slug}/`;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <StructuredData recipe={recipe} url={url} faqs={allFaqs} />

      <nav aria-label="Breadcrumb">
        <ol className="flex list-none flex-wrap items-center gap-1.5 text-xs text-zinc-500">
          <li>
            <Link href="/" className="transition-colors hover:text-emerald-400">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/cron/" className="transition-colors hover:text-emerald-400">
              Cron Directory
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-zinc-300">
            {recipe.title}
          </li>
        </ol>
      </nav>

      <header className="mt-6 max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{dialectLabel}</Badge>
          <Badge variant="success">100% Client-Side</Badge>
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
          {recipe.title}
        </h1>
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <code className="font-mono text-xl font-semibold tracking-wider text-emerald-400">
            {recipe.expression}
          </code>
          <span className="text-sm text-zinc-400">{analysis.humanReadable}</span>
        </div>
        <p className="mt-4 text-base leading-7 text-zinc-400">{recipe.description}</p>
      </header>

      <section aria-labelledby="playground-heading" className="mt-10">
        <h2 id="playground-heading" className="sr-only">
          Live playground
        </h2>
        <CronPlayground
          initialExpression={recipe.expression}
          initialDialect={recipe.dialect}
          syncUrl={false}
        />
      </section>

      <section aria-labelledby="fields-heading" className="mt-14">
        <h2 className="text-xl font-bold tracking-tight text-zinc-100" id="fields-heading">
          Field breakdown
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          How each field of{" "}
          <code className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-xs text-emerald-400">
            {recipe.expression}
          </code>{" "}
          is interpreted in the {dialectLabel} format.
        </p>
        <Card className="mt-4 overflow-hidden p-0">
          <table className="w-full text-sm">
            <caption className="sr-only">Field breakdown of {recipe.expression}</caption>
            <thead>
              <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wide text-zinc-500">
                <th scope="col" className="px-4 py-3 font-medium">
                  Field
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Value
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Allowed
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {analysis.fields.map((field) => (
                <tr key={field.name} className="border-b border-zinc-800/60 last:border-0">
                  <td className="px-4 py-3 text-zinc-300">{field.name}</td>
                  <td className="px-4 py-3 font-mono text-emerald-400">{field.value}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{field.allowedRange}</td>
                  <td className="px-4 py-3">
                    {field.isValid ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle2 size={13} />
                        Valid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-red-400">
                        <XCircle size={13} />
                        {field.error}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      <section aria-labelledby="snippets-heading" className="mt-14">
        <h2
          className="text-xl font-bold tracking-tight text-zinc-100"
          id="snippets-heading"
        >
          Use &ldquo;{recipe.expression}&rdquo; in real code
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Copy-paste configurations for the most common schedulers, converted to each
          platform&rsquo;s dialect where needed.
        </p>
        <div className="mt-4">
          <CodeSnippets snippets={snippets} />
        </div>
      </section>

      <AdUnit format="rectangle" className="mt-10" />

      {deepContent ? (
        <section aria-labelledby="deep-dive-heading" className="mt-14 max-w-3xl">
          <h2 id="deep-dive-heading" className="text-xl font-bold tracking-tight text-zinc-100">
            Running &ldquo;{recipe.expression}&rdquo; in production
          </h2>
          <div className="mt-6 space-y-10">
            {deepContent.sections.map((section) => (
              <div key={section.heading}>
                <h3 className="text-base font-semibold text-zinc-100">{section.heading}</h3>
                {section.body.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 48)}
                    className="mt-3 text-sm leading-7 text-zinc-400"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="faq-heading" className="mt-14 max-w-3xl">
        <h2 className="text-xl font-bold tracking-tight text-zinc-100" id="faq-heading">
          Frequently asked questions
        </h2>
        <div className="mt-4 space-y-6">
          {allFaqs.map((faq) => (
            <div key={faq.question}>
              <h3 className="text-base font-semibold text-zinc-100">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <article className="mt-14 max-w-3xl">
        <h2 className="text-xl font-bold tracking-tight text-zinc-100">
          About the &ldquo;{recipe.expression}&rdquo; schedule
        </h2>
        <p className="mt-3 text-sm leading-7 text-zinc-400">
          <code className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-xs text-emerald-400">
            {recipe.expression}
          </code>{" "}
          is the {dialectLabel} way to say &ldquo;{analysis.humanReadable}&rdquo;. The
          simulator above evaluates it entirely in your browser — the timeline, the
          next-run table, and the timezone switcher all run client-side, so you can
          paste production schedules without them ever leaving your machine.
        </p>
        <p className="mt-3 text-sm leading-7 text-zinc-400">
          Every page in this directory follows the same structure: a plain-English
          translation, a per-field breakdown, platform-specific snippets, and a
          timezone-aware simulator. Move between the related intervals below to compare
          dialects, and validate one final time in the simulator with your own timezone
          before shipping.
        </p>
      </article>

      <RelatedRecipes slugs={recipe.relatedSlugs} currentSlug={recipe.slug} />
    </div>
  );
}
