import Link from "next/link";
import { ArrowRight, CalendarClock, Clock, Repeat, ServerCog } from "lucide-react";
import parser from "cron-parser";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import {
  CRON_MACRO_PAGES,
  type CronMacroPage,
  getMacroPage,
} from "@/lib/cron/macro-pages";
import { getCronSchedule } from "@/lib/config/cron-schedules";
import { getRecipe } from "@/lib/cron/recipes";
import { SITE_URL } from "@/lib/site";

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

type RelatedEntry = { slug: string; label: string; expression: string };

function resolveRelated(slug: string): RelatedEntry | null {
  const macro = getMacroPage(slug);
  if (macro) return { slug, label: macro.humanReadable, expression: macro.macro };

  const schedule = getCronSchedule(slug);
  if (schedule) return { slug, label: schedule.humanReadable, expression: schedule.expression };

  const recipe = getRecipe(slug);
  if (recipe) {
    return {
      slug,
      label: recipe.title.replace(/^Cron Expression for /, ""),
      expression: recipe.expression,
    };
  }
  return null;
}

function MacroStructuredData({ macroPage }: { macroPage: CronMacroPage }) {
  const url = `${SITE_URL}/cron/${macroPage.slug}/`;
  const structuredData: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: `Cron ${macroPage.macro} Macro`,
      description: macroPage.seoDescription,
      url,
      operatingSystem: "All",
      applicationCategory: "DeveloperApplication",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Cron Directory", item: `${SITE_URL}/cron/` },
        { "@type": "ListItem", position: 3, name: macroPage.macro, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: macroPage.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function CronMacroLanding({ macroPage }: { macroPage: CronMacroPage }) {
  const url = `${SITE_URL}/cron/${macroPage.slug}/`;
  const isReboot = macroPage.expansion === null;
  const nextRuns = isReboot ? [] : computeNextRunsUtc(macroPage.macro);
  const related = macroPage.relatedSlugs
    .filter((slug) => slug !== macroPage.slug)
    .map(resolveRelated)
    .filter((entry): entry is RelatedEntry => entry !== null);
  const siblings = CRON_MACRO_PAGES.filter((page) => page.slug !== macroPage.slug);
  const simulateHref = `/cron?expr=${encodeURIComponent(macroPage.macro)}`;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <MacroStructuredData macroPage={macroPage} />

      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Cron Directory", href: "/cron/" },
          { label: macroPage.macro },
        ]}
        currentPageClassName="font-mono text-zinc-300"
      />

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <header className="max-w-3xl">
          <h1 className="font-mono text-3xl font-bold tracking-wider text-emerald-400 sm:text-4xl">
            {macroPage.macro}
          </h1>
          {macroPage.aliases.length > 0 ? (
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
              <span>Alias:</span>
              {macroPage.aliases.map((alias) => (
                <code
                  key={alias}
                  className="rounded border border-zinc-800 bg-zinc-950 px-1.5 py-0.5 font-mono text-xs text-emerald-300"
                >
                  {alias}
                </code>
              ))}
            </p>
          ) : null}
          <p className="mt-4 text-base leading-7 text-zinc-400">
            <span className="font-semibold text-zinc-100">{macroPage.humanReadable}.</span>{" "}
            {macroPage.seoDescription}
          </p>
        </header>

        {/* Hero visual: macro -> expansion at a glance */}
        <aside
          aria-label={`${macroPage.macro} quick reference`}
          className="rounded-xl border border-zinc-800 bg-zinc-950 p-5"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Quick reference
          </p>
          <p className="mt-3 font-mono text-2xl font-bold text-emerald-400">
            {macroPage.macro}
          </p>
          {isReboot ? (
            <p className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
              <ServerCog size={15} className="text-amber-400" aria-hidden />
              No recurring schedule — fires once at daemon start
            </p>
          ) : (
            <>
              <p className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                <span aria-hidden>↓ expands to</span>
              </p>
              <p className="mt-1 font-mono text-xl font-semibold text-zinc-100">
                {macroPage.expansion}
              </p>
            </>
          )}
          <dl className="mt-4 space-y-2 border-t border-zinc-800 pt-4 text-sm">
            <div className="flex items-start gap-2">
              <Clock size={14} className="mt-1 shrink-0 text-emerald-400" aria-hidden />
              <div>
                <dt className="sr-only">Fires</dt>
                <dd className="text-zinc-300">{macroPage.firesLabel}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Repeat size={14} className="mt-1 shrink-0 text-emerald-400" aria-hidden />
              <div>
                <dt className="sr-only">Dialects</dt>
                <dd className="text-zinc-300">Unix cron · Cloudflare Workers</dd>
              </div>
            </div>
          </dl>
        </aside>
      </div>

      <section aria-label="Macro reference table" className="mt-10 max-w-3xl">
        <table className="w-full text-sm">
          <caption className="sr-only">
            Where the {macroPage.macro} macro is supported and its equivalents
          </caption>
          <thead>
            <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wide text-zinc-500">
              <th scope="col" className="py-3 pr-4 font-medium">
                Dialect
              </th>
              <th scope="col" className="py-3 font-medium">
                Expression
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-zinc-800/60">
              <td className="py-2.5 pr-4 text-zinc-400">Unix cron / Cloudflare</td>
              <td className="py-2.5 font-mono text-emerald-400">{macroPage.macro}</td>
            </tr>
            {macroPage.quartzEquivalent ? (
              <tr className="border-b border-zinc-800/60">
                <td className="py-2.5 pr-4 text-zinc-400">Quartz / Spring</td>
                <td className="py-2.5 font-mono text-zinc-200">
                  {macroPage.quartzEquivalent}
                </td>
              </tr>
            ) : null}
            {macroPage.awsEquivalent ? (
              <tr className="border-b border-zinc-800/60">
                <td className="py-2.5 pr-4 text-zinc-400">AWS EventBridge</td>
                <td className="py-2.5 font-mono text-zinc-200">{macroPage.awsEquivalent}</td>
              </tr>
            ) : null}
            {isReboot ? (
              <tr>
                <td className="py-2.5 pr-4 text-zinc-400">Quartz / AWS EventBridge</td>
                <td className="py-2.5 text-zinc-500">Not supported — no event to map</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      {isReboot ? (
        <section
          aria-labelledby="reboot-note-heading"
          className="mt-8 max-w-3xl rounded-xl border border-amber-500/30 bg-amber-500/10 p-4"
        >
          <h2
            id="reboot-note-heading"
            className="flex items-center gap-2 text-base font-semibold text-amber-200"
          >
            <ServerCog size={16} aria-hidden />
            {macroPage.macro} has no fire times to list
          </h2>
          <p className="mt-2 text-sm leading-6 text-amber-100/80">
            It runs once, when the cron daemon starts — every boot and every daemon
            restart. The table other schedule pages show does not apply; the simulator
            reports the same instead of guessing.
          </p>
        </section>
      ) : (
        <section aria-labelledby="next-runs-heading" className="mt-10">
          <h2
            id="next-runs-heading"
            className="flex items-center gap-2 text-xl font-bold tracking-tight text-zinc-100"
          >
            <CalendarClock size={18} className="text-emerald-400" aria-hidden />
            Next {NEXT_RUN_COUNT} executions of {macroPage.macro} (UTC)
          </h2>
          <div className="mt-4 max-w-xl overflow-hidden rounded-xl border border-zinc-800">
            <table className="w-full text-sm">
              <caption className="sr-only">
                Next {NEXT_RUN_COUNT} execution times in UTC for {macroPage.macro}
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
                {nextRuns.map((run, index) => (
                  <tr key={run} className="border-b border-zinc-800/60 last:border-0">
                    <td className="px-4 py-2.5 text-zinc-500">{index + 1}</td>
                    <td className="px-4 py-2.5 font-mono text-zinc-200">{run} UTC</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section aria-label="Simulate this macro" className="mt-8">
        <Link
          href={simulateHref}
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-500 px-5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400"
        >
          {isReboot
            ? `See how ${macroPage.macro} is handled`
            : `Edit & simulate ${macroPage.macro} in your timezone`}
          <ArrowRight size={15} aria-hidden />
        </Link>
      </section>

      <article aria-labelledby="deep-dive-heading" className="mt-14 max-w-3xl">
        <h2 id="deep-dive-heading" className="text-xl font-bold tracking-tight text-zinc-100">
          {macroPage.macro} in production
        </h2>
        <div className="mt-6 space-y-10">
          {macroPage.sections.map((section) => (
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

        <h2 className="mt-14 text-xl font-bold tracking-tight text-zinc-100">
          Common questions
        </h2>
        <div className="mt-4 space-y-6">
          {macroPage.faqs.map((faq) => (
            <div key={faq.question}>
              <h3 className="text-base font-semibold text-zinc-100">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{faq.answer}</p>
            </div>
          ))}
        </div>
      </article>

      <section aria-labelledby="all-macros-heading" className="mt-14">
        <h2 id="all-macros-heading" className="text-xl font-bold tracking-tight text-zinc-100">
          All cron shortcut macros
        </h2>
        <ul className="mt-5 grid list-none gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {siblings.map((page) => (
            <li key={page.slug}>
              <Link
                href={`/cron/${page.slug}/`}
                className="flex h-full items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
              >
                <span className="min-w-0">
                  <span className="block truncate font-mono font-medium">{page.macro}</span>
                  <span className="block truncate text-xs text-zinc-500">
                    {page.humanReadable}
                  </span>
                </span>
                <ArrowRight size={14} className="shrink-0 text-zinc-600" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {related.length > 0 ? (
        <section aria-labelledby="related-schedules-heading" className="mt-8">
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
                    <span className="block truncate font-medium">{item.label}</span>
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
