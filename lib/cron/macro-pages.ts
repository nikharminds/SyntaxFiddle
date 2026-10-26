import parser from "cron-parser";
import type { MetadataRoute } from "next";
import { SITE_URL } from "../site";

/**
 * Landing pages for the Vixie cron shortcut macros (@daily, @hourly, …).
 *
 * Kept separate from CRON_SCHEDULES on purpose: that registry enforces
 * "one intent, one URL" on schedule *patterns*, while a macro page targets
 * the keyword intent of the macro itself ("what does @daily mean") — the
 * expansion firing at the same times as an existing schedule page is
 * expected, not a violation.
 */

export interface CronMacroFaq {
  question: string;
  answer: string;
}

export interface CronMacroSection {
  heading: string;
  body: string[];
}

export interface CronMacroPage {
  slug: string;
  macro: string;
  aliases: string[];
  /** 5-field expansion, or null when the macro has no recurring schedule. */
  expansion: string | null;
  /** Plain statement of when the macro fires. */
  firesLabel: string;
  humanReadable: string;
  title: string;
  seoDescription: string;
  quartzEquivalent: string | null;
  awsEquivalent: string | null;
  relatedSlugs: string[];
  sections: CronMacroSection[];
  faqs: CronMacroFaq[];
}

export const CRON_MACRO_PAGES: CronMacroPage[] = [
  {
    slug: "at-daily",
    macro: "@daily",
    aliases: ["@midnight"],
    expansion: "0 0 * * *",
    firesLabel: "00:00 every day, in the cron daemon's local time",
    humanReadable: "Every Day at Midnight",
    title: "Cron @daily Macro: Meaning, Time & Expansion | SyntaxFiddle",
    seoDescription:
      "The @daily cron macro runs at 00:00 every day — identical to 0 0 * * *. See exactly when it fires, timezone caveats, Quartz and AWS equivalents, and simulate it live.",
    quartzEquivalent: "0 0 0 * * ?",
    awsEquivalent: "0 0 * * ? *",
    relatedSlugs: [
      "daily-at-midnight",
      "at-hourly",
      "at-weekly",
      "at-monthly",
      "daily-at-8am",
      "every-hour",
    ],
    sections: [
      {
        heading: "What @daily actually does",
        body: [
          "@daily is a Vixie-cron shorthand: instead of writing five fields, the macro expands to exactly 0 0 * * * — minute 0, hour 0, every day of the month, every month, every day of the week. It fires once a day at 00:00 in the timezone the cron daemon itself runs in, which on a modern server is almost always UTC. The @midnight alias is accepted everywhere @daily is and behaves identically; macro names are case-insensitive, so @DAILY parses too.",
          "The expansion happens before the scheduler ever sees your line, which is why @daily and 0 0 * * * are indistinguishable in every observable way: same run times, same logs, same environment. Write the macro when a human will read the crontab; write the five fields when a tool will parse it — plenty of cron testers, linters, and schedulers reject macros outright, which is exactly the confusion that sends people to this page.",
        ],
      },
      {
        heading: "Where @daily breaks down",
        body: [
          "Platform support is the practical limit. Quartz and Spring's @Scheduled reject @daily — Quartz requires '?' in one day field, so the equivalent is 0 0 0 * * ?. AWS EventBridge likewise wants 0 0 * * ? * (six fields, trailing year, '?' in day-of-week). Kubernetes CronJobs accept only the five-field form. Alpine's busybox crond does not implement macros at all, while mainstream Linux (Debian, Ubuntu, RHEL) and macOS ship Vixie-compatible daemons that do.",
          "The classic confusion: /etc/cron.daily/ is NOT @daily. That directory is anacron territory on most distros — jobs run with a randomized delay, at most once a day, serialized, and skipped if the machine was off. @daily in a user crontab fires precisely at 00:00 with no delay and no catch-up. Same intent, completely different machinery — worth knowing before you debug why a job \"missed\" its window.",
        ],
      },
    ],
    faqs: [
      {
        question: "What time does @daily run?",
        answer:
          "At 00:00 (midnight) in the cron daemon's own timezone. On cloud servers that timezone is nearly always UTC, so the job fires at 00:00 UTC; on a laptop or on-prem box it follows the system clock. Check with `date` on the host — cron does not consult your shell's TZ variable.",
      },
      {
        question: "Is @daily exactly the same as 0 0 * * *?",
        answer:
          "Yes. The macro expands to that five-field expression before scheduling, so run times, logging, and environment are identical. Use the macro for readability; use the expansion for portability across tools that don't parse macros.",
      },
      {
        question: "Does @daily work in Quartz, Spring, or AWS EventBridge?",
        answer:
          "No. Quartz and Spring's @Scheduled require explicit fields — the Quartz equivalent is 0 0 0 * * ? — and AWS EventBridge needs 0 0 * * ? *. Neither platform implements Vixie macros.",
      },
      {
        question: "Why does @daily fail in some cron testers?",
        answer:
          "Many popular testers only implement the five-field grammar and treat a macro as a one-token error. This simulator expands @daily (and the other macros) natively in the Unix and Cloudflare dialects, showing the expanded fields, the next runs, and the plain-English meaning.",
      },
    ],
  },
  {
    slug: "at-hourly",
    macro: "@hourly",
    aliases: [],
    expansion: "0 * * * *",
    firesLabel: "At minute 0 of every hour",
    humanReadable: "Every Hour at Minute 0",
    title: "Cron @hourly Macro: Meaning & Expansion | SyntaxFiddle",
    seoDescription:
      "@hourly runs at the top of every hour (minute 0) — identical to 0 * * * *. See the expansion, offset-minute patterns to avoid load spikes, Quartz/AWS equivalents, and simulate live.",
    quartzEquivalent: "0 0 * * * ?",
    awsEquivalent: "0 * * * ? *",
    relatedSlugs: [
      "every-hour",
      "hourly-at-quarter-past",
      "hourly-at-half-past",
      "at-daily",
      "every-2-hours",
      "weekdays-at-9am",
    ],
    sections: [
      {
        heading: "What @hourly actually does",
        body: [
          "@hourly expands to 0 * * * *: minute 0, every hour, every day. It is the canonical \"top of the hour\" schedule — the one log rotation, hourly metrics flushes, and cheap health checks have used since the BSD days. Like all Vixie macros it is case-insensitive and accepted by Debian, Ubuntu, RHEL, and macOS cron; Quartz, AWS EventBridge, and Kubernetes CronJobs want the expanded five fields instead.",
          "Because the minute field is 0, an @hourly job fires at 00:00, 01:00, 02:00 — exactly aligned with the wall clock. That is the right default for anything a human correlates with \"hourly\" logs. It is also the most crowded minute of the hour: logrotate, cert checkers, and half the internet's monitoring run at :00 too.",
        ],
      },
      {
        heading: "The top-of-hour stampede",
        body: [
          "If an @hourly job calls a shared resource — an API with rate limits, a database that every server also polls at :00 — you have joined the thundering herd. The standard fix is an offset minute: 17 * * * * runs at :17 every hour, same cadence, none of the collision. The offset form is also what you want for health checks whose latency graphs should not spike in lockstep with the rest of the fleet.",
          "The systemd equivalent is OnCalendar=hourly on a .timer unit (which, like cron, fires at the top of the hour), and Celery beat expresses it as crontab(minute=0). Kubernetes has no macro form: schedule: \"0 * * * *\" in the CronJob spec. The expression is the contract everywhere; only the wrapper changes — and you can paste @hourly straight into the simulator above to watch the next fires in your timezone.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is the cron expression for every hour?",
        answer:
          "0 * * * *, which is exactly what @hourly expands to. If you need a different minute, replace the leading 0 — 30 * * * * runs at half past every hour.",
      },
      {
        question: "Is there a difference between @hourly and 0 * * * *?",
        answer:
          "None at runtime. @hourly is a readability macro that the cron daemon expands to 0 * * * * before scheduling. Prefer the explicit form when the expression will be parsed by tools that don't implement macros.",
      },
      {
        question: "How do I run hourly but not at minute 0?",
        answer:
          "There is no offset macro — set the minute explicitly: 17 * * * * fires at :17 of every hour. Offsetting is the common cure for top-of-hour load spikes on shared APIs and databases.",
      },
      {
        question: "Does @hourly work in Quartz or AWS EventBridge?",
        answer:
          "No. Quartz needs 0 0 * * * ? (seconds first, '?' in one day field) and AWS EventBridge needs 0 * * * ? * with the trailing year field. Both platforms accept only explicit fields.",
      },
    ],
  },
  {
    slug: "at-weekly",
    macro: "@weekly",
    aliases: [],
    expansion: "0 0 * * 0",
    firesLabel: "00:00 every Sunday",
    humanReadable: "Every Sunday at Midnight",
    title: "Cron @weekly Macro: Meaning, Day & Expansion | SyntaxFiddle",
    seoDescription:
      "@weekly fires every Sunday at 00:00 — the same as 0 0 * * 0. See the expansion, the Monday-midnight variant, weekend maintenance risks, and Quartz/AWS equivalents.",
    quartzEquivalent: "0 0 ? * 1",
    awsEquivalent: "0 0 ? * 1 *",
    relatedSlugs: [
      "every-sunday",
      "every-monday",
      "weekdays-at-midnight",
      "weekends-at-midnight",
      "at-monthly",
      "at-daily",
    ],
    sections: [
      {
        heading: "What @weekly actually does",
        body: [
          "@weekly expands to 0 0 * * 0 — midnight, every Sunday. In the Unix day-of-week field both 0 and 7 mean Sunday, so 0 0 * * 7 is the same schedule spelled differently. systemd's OnCalendar=weekly fires at the same instant (Sunday 00:00), and Celery beat writes it as crontab(day_of_week=0).",
          "Weekly cadence is the maintenance-window cadence: database VACUUM and OPTIMIZE runs, weekly full backups that the nightly incrementals roll up to, log archive rotation, and certificate renewal checks that need to succeed at least once between expirations. Sunday midnight is chosen because traffic bottoms out — but that also means failures land when nobody is watching.",
        ],
      },
      {
        heading: "Sunday midnight, and why you might move off it",
        body: [
          "Two practical arguments against the default slot. First, weekend coverage: a weekly job that fails at 00:00 Sunday may sit broken for 30+ hours before a human notices, which is exactly the window where success alerting earns its keep — a weekly schedule should always page on failure, not just log. Second, business alignment: for anything consumed Monday morning (reports, billing extracts, workspace resets), 0 0 * * 1 fires Monday 00:00 and guarantees freshness without a Sunday on-call. There is no @weekly variant for this; you write the explicit day.",
          "Daylight-saving transitions barely touch 00:00 — most zones shift at 01:00–03:00 local — but a handful shift at midnight, where a Sunday-00:00 job can fire twice or skip once a year. If a twice-or-never edge matters (idempotency guards, exactly-once billing), run the daemon in UTC or schedule at 02:00. The timezone switcher in the simulator shows exactly what your users' zone does.",
        ],
      },
    ],
    faqs: [
      {
        question: "What day of the week does @weekly run on?",
        answer:
          "Sunday at 00:00. The macro expands to 0 0 * * 0, where 0 (and equivalently 7) is Sunday in the Unix day-of-week field.",
      },
      {
        question: "How do I run a job weekly on Monday instead?",
        answer:
          "There is no @monday macro — use 0 0 * * 1 for Monday at midnight, or 0 8 * * 1 for Monday at 08:00. Only the day-of-week digit changes.",
      },
      {
        question: "Is @weekly the same as 0 0 * * 0?",
        answer:
          "Yes — identical run times and behavior. 0 0 * * 7 is also equivalent, since 7 is a second spelling of Sunday in Unix cron.",
      },
      {
        question: "What is the Quartz or AWS EventBridge equivalent of @weekly?",
        answer:
          "Quartz: 0 0 ? * 1 — seconds first, '?' in day-of-month, and note that Quartz numbers Sunday as 1. AWS EventBridge: 0 0 ? * 1 * with the trailing year field. Neither platform accepts the macro itself.",
      },
    ],
  },
  {
    slug: "at-monthly",
    macro: "@monthly",
    aliases: [],
    expansion: "0 0 1 * *",
    firesLabel: "00:00 on the 1st of every month",
    humanReadable: "First Day of Every Month",
    title: "Cron @monthly Macro: Meaning & Expansion | SyntaxFiddle",
    seoDescription:
      "@monthly runs at midnight on the 1st of every month — the same as 0 0 1 * *. See the expansion, load-smoothing alternatives to the 1st, and the Quartz/AWS equivalents.",
    quartzEquivalent: "0 0 0 1 * ?",
    awsEquivalent: "0 0 1 * ? *",
    relatedSlugs: [
      "first-day-of-month",
      "first-day-of-month-at-8am",
      "last-day-of-month",
      "at-yearly",
      "at-weekly",
      "quarterly",
    ],
    sections: [
      {
        heading: "What @monthly actually does",
        body: [
          "@monthly expands to 0 0 1 * * — 00:00 on day 1 of every month. Unlike \"last day of the month\" schedules (which need the L flag in Quartz/AWS, or day 28-31 trickery in Unix cron), day 1 is the same length in every month, so the schedule needs no special handling. systemd's OnCalendar=monthly matches it, and Celery beat writes crontab(day_of_month=1).",
          "The 1st is where the month-start workload lives: billing and invoice runs, subscription renewals, month-end report generation, credential and password rotations that expire monthly, storage snapshots pruned on a monthly cadence. Essentially anything a business accounts for by the calendar month keys off this one timestamp.",
        ],
      },
      {
        heading: "The 1st-of-the-month stampede",
        body: [
          "Because everyone keys off the 1st, the 00:00 on the 1st slot is the most contended minute of the month: payment processors, DNS providers, and internal batch queues all see their monthly peak. If your job talks to a third-party API, moving to the 2nd or 3rd (0 0 2 * *) buys an empty road for the price of one day's lag. For internal batch systems the same shift decouples your run from every other team's.",
          "One more planner's note: a job at 00:00 on the 1st is really \"end of the previous month\" in disguise. If it aggregates or reports on month M, all of M's data must be closed out before the job fires — fine for logs and metrics, risky for anything with late-arriving records (refunds, timezone-shifted orders, manually keyed entries). A 02:00 or 06:00 start on the 1st is the conventional buffer.",
        ],
      },
    ],
    faqs: [
      {
        question: "What time does @monthly run?",
        answer:
          "At 00:00 on the first day of each month, in the cron daemon's timezone — usually UTC on servers. It expands to 0 0 1 * *.",
      },
      {
        question: "How do I run a job monthly on a different day?",
        answer:
          "There is no macro for it — set the day-of-month field explicitly. 0 0 15 * * runs at midnight on the 15th; 0 6 2 * * runs at 06:00 on the 2nd. For the last day of the month, Unix cron needs the Quartz/AWS-style L flag or a day-range workaround.",
      },
      {
        question: "Is @monthly the same as 0 0 1 * *?",
        answer:
          "Yes, exactly. The macro is expanded before scheduling, so the two forms produce identical run times, logs, and environment.",
      },
      {
        question: "What is the Quartz or AWS EventBridge equivalent of @monthly?",
        answer:
          "Quartz: 0 0 0 1 * ? (seconds first, '?' in day-of-week). AWS EventBridge: 0 0 1 * ? * with the trailing year. Macros are not accepted in either dialect, so you always write the fields out.",
      },
    ],
  },
  {
    slug: "at-yearly",
    macro: "@yearly",
    aliases: ["@annually"],
    expansion: "0 0 1 1 *",
    firesLabel: "00:00 on January 1st",
    humanReadable: "January 1st at Midnight",
    title: "Cron @yearly & @annually: Meaning & Expansion | SyntaxFiddle",
    seoDescription:
      "@yearly (alias @annually) fires at 00:00 on January 1st — the same as 0 0 1 1 *. See the expansion, holiday-risk notes, fiscal-year alternatives, and Quartz/AWS equivalents.",
    quartzEquivalent: "0 0 0 1 1 ?",
    awsEquivalent: "0 0 1 1 ? *",
    relatedSlugs: [
      "yearly-on-january-1st",
      "december-thirty-first",
      "december-first",
      "at-monthly",
      "quarterly",
      "twice-a-year",
    ],
    sections: [
      {
        heading: "What @yearly actually does",
        body: [
          "@yearly expands to 0 0 1 1 * — 00:00 on January 1st — and @annually is a full alias: same expansion, same behavior, both accepted by every Vixie-compatible daemon. It is the rarest of the macros because so few workloads are genuinely annual: TLS CA rotations, compliance and audit scans, archive purges governed by retention policy, and yearly recap jobs.",
          "Note the trap in the name: @yearly means calendar-year, January 1st. Fiscal years, contract years, and subscription years almost never start on January 1st, so anything keyed to them needs an explicit expression — 0 0 1 4 * for an April fiscal start, for example. AWS EventBridge's year field gives you ranges and lists natively (0 0 1 1 ? 2027-2030) when the schedule itself is bounded.",
        ],
      },
      {
        heading: "January 1st is a holiday — schedule accordingly",
        body: [
          "00:00 on New Year's Day is the single worst-manned timestamp of the year: skeleton on-call crews, systems mid-maintenance window, and nobody reading dashboards. A long-running annual job that misbehaves there can burn most of the holiday before anyone notices. For annual jobs that touch anything human-facing, 0 0 2 1 * (January 2nd) or the first business day of January is the pragmatic choice; there is no macro for it, so write the fields.",
          "The second annual-job failure mode is silence: a job that runs once a year gets touched once a year, and by next January the credentials it used have expired, the API it calls has been deprecated, or the disk it writes to filled up in March. The standard defenses are a scheduled dry-run months earlier, success alerting that pages like any other job, and version-controlling the script instead of editing it live in crontab.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is @yearly the same as @annually?",
        answer:
          "Yes — @annually is a documented alias with the identical expansion, 0 0 1 1 *. Either spelling fires at 00:00 on January 1st.",
      },
      {
        question: "What date and time does @yearly run?",
        answer:
          "00:00 on January 1st, in the cron daemon's timezone (UTC on most servers). It expands to 0 0 1 1 *.",
      },
      {
        question: "How do I schedule a job yearly on a different date?",
        answer:
          "Write the month and day explicitly. 0 0 1 4 * fires at midnight on April 1st every year; 0 9 15 6 * at 09:00 on June 15th. There is no parameterized macro form.",
      },
      {
        question: "What is the Quartz or AWS EventBridge equivalent of @yearly?",
        answer:
          "Quartz: 0 0 0 1 1 ? — seconds first and '?' in day-of-week. AWS EventBridge: 0 0 1 1 ? *, where the trailing year can also bound the schedule, e.g. 0 0 1 1 ? 2027.",
      },
    ],
  },
  {
    slug: "at-reboot",
    macro: "@reboot",
    aliases: [],
    expansion: null,
    firesLabel: "Once, when the cron daemon starts",
    humanReadable: "Runs Once at Startup",
    title: "Cron @reboot: When It Fires & Common Pitfalls | SyntaxFiddle",
    seoDescription:
      "@reboot runs a command once when the cron daemon starts — every boot AND every daemon restart. See the exact semantics, cloud auto-scaling pitfalls, idempotency rules, and alternatives.",
    quartzEquivalent: null,
    awsEquivalent: null,
    relatedSlugs: ["never-runs", "at-daily", "every-5-minutes", "every-hour", "every-minute"],
    sections: [
      {
        heading: "What @reboot actually does",
        body: [
          "@reboot is not a schedule. It runs the command exactly once, when the cron daemon itself starts — and that is the detail that surprises people: \"daemon starts\" includes systemctl restart cron after a config change, not just machine boots. A job prefixed @reboot has no recurring fire times, which is why the simulator above reports it as un-simulatable rather than guessing a cadence.",
          "Legitimate uses are boot-time setup: clearing temp and lock files that a crash left behind, re-registering the host with a config-management or monitoring agent, seeding a local cache, or re-creating runtime directories under /run. The common thread: the work must be safe to run at an arbitrary moment, must not care how long the machine was off, and must finish without a schedule.",
        ],
      },
      {
        heading: "Pitfalls: auto-scaling, idempotency, and better tools",
        body: [
          "On cloud auto-scaling groups, every instance launch fires your @reboot job — scale from 4 to 40 nodes and the job runs 36 times in a burst against whatever it touches. Combine that with image baking (the fix usually belongs in the golden image or a userdata script, not cron) and you get the classic @reboot anti-pattern: a \"one-time\" setup step that actually runs on every server, forever. The rule: @reboot jobs must be idempotent and must assume siblings are running the same code right now.",
          "The modern replacements are purpose-built: systemd timers with OnBootSec=10 give you a delay after boot plus full journald logging, cloud-init handles first-boot provisioning properly, and Kubernetes init containers or Jobs own startup work for pods. Also know your daemon: mainstream Vixie cron implements @reboot, but busybox crond (Alpine) does not, and macOS deprecates cron in favor of launchd. If the job matters, prefer the mechanism your platform actually guarantees.",
        ],
      },
    ],
    faqs: [
      {
        question: "Does @reboot run on every reboot?",
        answer:
          "Yes — and more: it runs every time the cron daemon starts, which includes service restarts like systemctl restart cron, not only machine boots. If the daemon restarts daily for any reason, your \"boot-time\" job runs daily.",
      },
      {
        question: "Can I combine @reboot with a schedule in one entry?",
        answer:
          "No. A crontab line takes either a schedule or @reboot, never both. If you need startup setup plus recurring work, use two lines: one @reboot entry for the setup and a second line with the schedule.",
      },
      {
        question: "Is @reboot supported on every system?",
        answer:
          "It is implemented by Vixie-compatible daemons — Debian, Ubuntu, RHEL, macOS cron — but not by busybox crond (Alpine), and it means nothing to Quartz, AWS EventBridge, or Kubernetes. On Linux, a systemd timer with OnBootSec= is the more robust equivalent.",
      },
      {
        question: "Why can't @reboot be simulated?",
        answer:
          "Simulation requires future fire times, and @reboot has none — it fires at an event (daemon start), not at a time. The simulator instead reports exactly that, so you can confirm the behavior instead of staring at an empty timeline.",
      },
    ],
  },
];

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Lookup by slug — consumed by the /cron/[schedule] route. */
export function getMacroPage(slug: string): CronMacroPage | undefined {
  return CRON_MACRO_PAGES.find((page) => page.slug === slug);
}

export function getAllMacroPageSlugs(): string[] {
  return CRON_MACRO_PAGES.map((page) => page.slug);
}

/** Sitemap entries for the macro landing pages. */
export function macroSitemapEntries(): MetadataRoute.Sitemap {
  return CRON_MACRO_PAGES.map((page) => ({
    url: `${SITE_URL}/cron/${page.slug}/`,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));
}

/**
 * Fails fast on invalid data: slug format/uniqueness, macro/expansion
 * consistency with the engine, and parseable expansions.
 */
export function assertMacroPageIntegrity(): void {
  const violations: string[] = [];
  const seen = new Set<string>();

  for (const page of CRON_MACRO_PAGES) {
    if (!SLUG_PATTERN.test(page.slug)) {
      violations.push(`Slug "${page.slug}" is not lowercase kebab-case.`);
    }
    if (seen.has(page.slug)) violations.push(`Duplicate slug "${page.slug}".`);
    seen.add(page.slug);
    if (!page.macro.startsWith("@")) {
      violations.push(`Macro "${page.macro}" on "${page.slug}" must start with '@'.`);
    }
    if (page.expansion !== null) {
      try {
        parser.parseExpression(page.expansion, { utc: true }).next();
      } catch {
        violations.push(`Expansion "${page.expansion}" on "${page.slug}" does not parse.`);
      }
    }
    if (page.sections.length === 0 || page.faqs.length === 0) {
      violations.push(`Page "${page.slug}" is missing sections or FAQs.`);
    }
  }

  if (violations.length > 0) {
    throw new Error(
      `lib/cron/macro-pages.ts: macro page integrity check failed (${violations.length}):\n` +
        violations.map((v) => `  - ${v}`).join("\n"),
    );
  }
}

assertMacroPageIntegrity();
