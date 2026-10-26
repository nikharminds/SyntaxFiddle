"use client";

import Link from "next/link";
import { AtSign, CalendarClock, Layers, Link2 } from "lucide-react";
import { AdUnit } from "@/components/ads/AdUnit";
import { CronPlayground } from "@/components/cron/cron-playground";
import { RelatedRecipes } from "@/components/cron/related-recipes";
import { PageHero } from "@/components/shared/page-hero";
import { Badge } from "@/components/ui/badge";

const CRON_FACTS = [
  {
    icon: Layers,
    title: "4 cron dialects",
    description: "Unix, Quartz, AWS EventBridge, and Cloudflare on one screen.",
  },
  {
    icon: CalendarClock,
    title: "Live run timeline",
    description: "The next 50 runs simulated locally, updating as you type.",
  },
  {
    icon: Link2,
    title: "URL-synced state",
    description: "Expression, dialect, and timezone live in the share link.",
  },
];

const POPULAR_SLUGS = [
  "every-5-minutes",
  "every-15-minutes",
  "every-hour",
  "daily-at-midnight",
  "weekdays-at-9am",
  "every-monday",
  "first-day-of-month",
  "last-day-of-month",
  "aws-eventbridge-every-hour",
  "aws-eventbridge-daily-at-8am",
  "quartz-every-10-seconds",
  "spring-boot-daily",
  "cloudflare-every-5-minutes",
];

const CRON_MACRO_LINKS = [
  { href: "/cron/at-daily/", macro: "@daily", label: "Every day at 00:00" },
  { href: "/cron/at-hourly/", macro: "@hourly", label: "Top of every hour" },
  { href: "/cron/at-weekly/", macro: "@weekly", label: "Sunday at 00:00" },
  { href: "/cron/at-monthly/", macro: "@monthly", label: "1st of the month" },
  { href: "/cron/at-yearly/", macro: "@yearly", label: "January 1st" },
  { href: "/cron/at-reboot/", macro: "@reboot", label: "Once at startup" },
];

export default function CronPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header>
        <PageHero
          badges={
            <>
              <Badge variant="success">100% Client-Side</Badge>
              <Badge variant="outline">URL-synced</Badge>
              <Badge variant="outline">Zero-latency parsing</Badge>
            </>
          }
          title="Cron Expression Tester & Generator"
          description={
            <>
              Type an expression — validation, the plain-English translation, and the run
              timeline update instantly as you type. Everything is computed in your
              browser, and the URL updates silently so you can share the exact state.
              Looking for a specific schedule? Browse the{" "}
              <a href="#related" className="text-emerald-400 hover:underline">
                popular cron recipes
              </a>{" "}
              below.
            </>
          }
          facts={CRON_FACTS}
        />
      </header>

      <section aria-label="Cron playground" className="mt-8">
        <CronPlayground />
      </section>

      <AdUnit format="leaderboard" className="mt-10" />

      <div id="related" className="mt-10">
        <RelatedRecipes slugs={POPULAR_SLUGS} />
      </div>

      <section id="macros" aria-labelledby="macros-heading" className="mt-14">
        <h2
          id="macros-heading"
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-zinc-100"
        >
          <AtSign size={18} className="text-emerald-400" aria-hidden />
          Cron shortcut macros
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          The tester expands <code className="font-mono text-emerald-400">@daily</code>,{" "}
          <code className="font-mono text-emerald-400">@hourly</code>,{" "}
          <code className="font-mono text-emerald-400">@weekly</code> and friends natively —
          each reference page explains the expansion, timezone behavior, and the Quartz and
          AWS EventBridge equivalents.
        </p>
        <ul className="mt-5 grid list-none gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CRON_MACRO_LINKS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex h-full items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
              >
                <span className="min-w-0">
                  <span className="block font-mono font-medium text-emerald-400">
                    {item.macro}
                  </span>
                  <span className="block truncate text-xs text-zinc-500">{item.label}</span>
                </span>
                <span aria-hidden className="text-zinc-600">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
