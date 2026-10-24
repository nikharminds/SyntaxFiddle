import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarClock } from "lucide-react";
import parser from "cron-parser";
import { CronRecipeView, getRecipeAnalysis } from "./recipe-view";
import {
  CRON_SCHEDULES,
  getAllCronScheduleSlugs,
  getCronSchedule,
  relatedCronSchedules,
  type CronScheduleRoute,
} from "@/lib/config/cron-schedules";
import { getRecipeDeepContent } from "@/lib/cron/deep-content";
import { getRecipe, RECIPES } from "@/lib/cron/recipes";
import { SITE_URL } from "@/lib/site";

export const dynamicParams = false;

const SCHEDULE_SLUG_SET = new Set(getAllCronScheduleSlugs());

export function generateStaticParams(): { schedule: string }[] {
  return [
    ...getAllCronScheduleSlugs().map((schedule) => ({ schedule })),
    ...RECIPES.filter((recipe) => !SCHEDULE_SLUG_SET.has(recipe.slug)).map((recipe) => ({
      schedule: recipe.slug,
    })),
  ];
}

function buildScheduleMetadata(schedule: CronScheduleRoute): Metadata {
  const title = `Cron Expression: ${schedule.humanReadable} (${schedule.expression}) | SyntaxFiddle`;
  const url = `${SITE_URL}/cron/${schedule.slug}/`;

  return {
    title: { absolute: title },
    description: schedule.seoDescription,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: schedule.seoDescription,
      url,
      type: "website",
      siteName: "SyntaxFiddle",
      images: [{ url: `${SITE_URL}/og/cron.jpg`, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: schedule.seoDescription,
      images: [`${SITE_URL}/og/cron.jpg`],
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ schedule: string }>;
}): Promise<Metadata> {
  const { schedule: slug } = await params;

  const schedule = getCronSchedule(slug);
  if (schedule) return buildScheduleMetadata(schedule);

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

const NEXT_RUN_COUNT = 5;

function computeNextRunsUtc(expression: string): string[] {
  try {
    const interval = parser.parseExpression(expression, { utc: true });
    const runs: string[] = [];
    for (let i = 0; i < NEXT_RUN_COUNT; i += 1) {
      runs.push(
        interval
          .next()
          .toDate()
          .toISOString()
          .slice(0, 16)
          .replace("T", " "),
      );
    }
    return runs;
  } catch {
    return [];
  }
}

function ScheduleStructuredData({ schedule }: { schedule: CronScheduleRoute }) {
  const url = `${SITE_URL}/cron/${schedule.slug}/`;
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: `Cron Expression: ${schedule.humanReadable}`,
      description: schedule.seoDescription,
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
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Cron Directory", item: `${SITE_URL}/cron/` },
        { "@type": "ListItem", position: 3, name: schedule.humanReadable, item: url },
      ],
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

function ScheduleLanding({ schedule }: { schedule: CronScheduleRoute }) {
  const url = `${SITE_URL}/cron/${schedule.slug}/`;
  const nextRuns = computeNextRunsUtc(schedule.expression);
  const related = relatedCronSchedules(schedule.slug);
  const deepContent = getRecipeDeepContent(schedule.slug);
  const simulateHref = `/cron?expr=${encodeURIComponent(schedule.expression)}`;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <ScheduleStructuredData schedule={schedule} />

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
            {schedule.humanReadable}
          </li>
        </ol>
      </nav>

      <header className="mt-6 max-w-3xl">
        <h1 className="font-mono text-3xl font-bold tracking-wider text-emerald-400 sm:text-4xl">
          {schedule.expression}
        </h1>
        <p className="mt-4 text-base leading-7 text-zinc-400">
          <span className="font-semibold text-zinc-100">{schedule.humanReadable}</span> —{" "}
          {schedule.seoDescription}
        </p>
      </header>

      <section aria-labelledby="next-runs-heading" className="mt-10">
        <h2
          id="next-runs-heading"
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-zinc-100"
        >
          <CalendarClock size={18} className="text-emerald-400" aria-hidden />
          Next {NEXT_RUN_COUNT} executions (UTC)
        </h2>
        <div className="mt-4 max-w-xl overflow-hidden rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <caption className="sr-only">
              Next {NEXT_RUN_COUNT} execution times in UTC for {schedule.expression}
            </caption>
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60 text-left text-xs uppercase tracking-wide text-zinc-500">
                <th scope="col" className="px-4 py-3 font-medium">
                  #
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Execution time (UTC)
                </th>
              </tr>
            </thead>
            <tbody>
              {nextRuns.length > 0 ? (
                nextRuns.map((run, index) => (
                  <tr key={run} className="border-b border-zinc-800/60 last:border-0">
                    <td className="px-4 py-2.5 text-zinc-500">{index + 1}</td>
                    <td className="px-4 py-2.5 font-mono text-zinc-200">{run} UTC</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-sm text-zinc-500">
                    No upcoming executions could be computed for this expression.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-label="Simulate this schedule" className="mt-8">
        <Link
          href={simulateHref}
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-500 px-5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400"
        >
          Edit &amp; Simulate in Local Timezone
          <ArrowRight size={15} aria-hidden />
        </Link>
      </section>

      {deepContent ? (
        <article aria-labelledby="deep-dive-heading" className="mt-14 max-w-3xl">
          <h2
            id="deep-dive-heading"
            className="text-xl font-bold tracking-tight text-zinc-100"
          >
            Running &ldquo;{schedule.expression}&rdquo; in production
          </h2>
          <div className="mt-6 space-y-10">
            {deepContent.sections.map((section) => (
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

          {deepContent.extraFaqs.length > 0 ? (
            <>
              <h2 className="mt-14 text-xl font-bold tracking-tight text-zinc-100">
                Common questions
              </h2>
              <div className="mt-4 space-y-6">
                {deepContent.extraFaqs.map((faq) => (
                  <div key={faq.question}>
                    <h3 className="text-base font-semibold text-zinc-100">{faq.question}</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </article>
      ) : null}

      {related.length > 0 ? (
        <section aria-labelledby="related-schedules-heading" className="mt-14">
          <h2
            id="related-schedules-heading"
            className="text-xl font-bold tracking-tight text-zinc-100"
          >
            Related cron schedules
          </h2>
          <ul className="mt-5 grid list-none gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/cron/${item.slug}/`}
                  className="flex h-full items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{item.humanReadable}</span>
                    <span className="block truncate font-mono text-xs text-zinc-500">
                      {item.expression}
                    </span>
                  </span>
                  <ArrowRight size={14} className="shrink-0 text-zinc-600" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

export default async function CronSchedulePage({
  params,
}: {
  params: Promise<{ schedule: string }>;
}) {
  const { schedule: slug } = await params;

  const schedule = getCronSchedule(slug);
  if (schedule) return <ScheduleLanding schedule={schedule} />;

  const recipe = getRecipe(slug);
  if (!recipe) notFound();

  return <CronRecipeView recipe={recipe} />;
}
