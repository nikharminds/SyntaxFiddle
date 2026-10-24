/**
 * High-intent cron schedule directory rendered at /cron/<slug>/.
 *
 * Importing this module validates the dataset (unique kebab-case slugs, no
 * reserved routes, no overlap with the platform-specific cron recipes) and
 * throws on violation, so build, dev, and test all fail fast.
 */

import { RESERVED_ROUTES } from "./converters";
import { RECIPES } from "../cron/recipes";

export interface CronScheduleRoute {
  slug: string;
  expression: string;
  humanReadable: string;
  seoDescription: string;
}

export const CRON_SCHEDULES: CronScheduleRoute[] = [
  // --- MINUTE INTERVALS ---
  { slug: 'every-minute', expression: '* * * * *', humanReadable: 'Every Minute', seoDescription: 'Cron expression for running a task every single minute. Equivalent to AWS rate(1 minute).' },
  { slug: 'every-3-minutes', expression: '*/3 * * * *', humanReadable: 'Every 3 Minutes', seoDescription: 'How to configure a cron job to run every 3 minutes.' },
  { slug: 'every-4-minutes', expression: '*/4 * * * *', humanReadable: 'Every 4 Minutes', seoDescription: 'Cron schedule format for triggering a task every 4 minutes.' },
  { slug: 'every-5-minutes', expression: '*/5 * * * *', humanReadable: 'Every 5 Minutes', seoDescription: 'Learn how to run a cron job every 5 minutes. Includes AWS EventBridge and Quartz equivalents.' },
  { slug: 'every-10-minutes', expression: '*/10 * * * *', humanReadable: 'Every 10 Minutes', seoDescription: 'Cron expression to trigger a schedule every 10 minutes exactly.' },
  { slug: 'every-15-minutes', expression: '*/15 * * * *', humanReadable: 'Every 15 Minutes', seoDescription: 'Cron schedule format for running a task every 15 minutes (quarter-hourly).' },
  { slug: 'every-20-minutes', expression: '*/20 * * * *', humanReadable: 'Every 20 Minutes', seoDescription: 'Cron expression for executing a script every 20 minutes.' },
  { slug: 'every-30-minutes', expression: '*/30 * * * *', humanReadable: 'Every 30 Minutes (Half Hour)', seoDescription: 'Standard cron expression for half-hour intervals. View next execution times.' },
  { slug: 'every-45-minutes', expression: '*/45 * * * *', humanReadable: 'Every 45 Minutes', seoDescription: 'How to write a cron expression that runs every 45 minutes.' },

  // --- HOURLY INTERVALS ---
  { slug: 'every-hour', expression: '0 * * * *', humanReadable: 'Every Hour', seoDescription: 'Cron expression to execute a task at the top of every hour (minute 0).' },
  { slug: 'every-2-hours', expression: '0 */2 * * *', humanReadable: 'Every 2 Hours', seoDescription: 'Configure a cron job to run every 2 hours exactly at the top of the hour.' },
  { slug: 'every-3-hours', expression: '0 */3 * * *', humanReadable: 'Every 3 Hours', seoDescription: 'Cron schedule format for running tasks every 3 hours.' },
  { slug: 'every-4-hours', expression: '0 */4 * * *', humanReadable: 'Every 4 Hours', seoDescription: 'Cron schedule format for running tasks every 4 hours.' },
  { slug: 'every-6-hours', expression: '0 */6 * * *', humanReadable: 'Every 6 Hours', seoDescription: 'Standard cron syntax for 6-hour intervals (4 times a day).' },
  { slug: 'every-8-hours', expression: '0 */8 * * *', humanReadable: 'Every 8 Hours', seoDescription: 'Cron expression to run a script three times a day, every 8 hours.' },
  { slug: 'every-12-hours', expression: '0 */12 * * *', humanReadable: 'Every 12 Hours (Twice a Day)', seoDescription: 'Cron expression to run a script twice a day, every 12 hours.' },

  // --- DAILY (AM) ---
  { slug: 'every-day-at-830am', expression: '30 8 * * *', humanReadable: 'Every Day at 8:30 AM', seoDescription: 'Cron schedule to run daily at 8:30 AM.' },
  { slug: 'every-day-at-930am', expression: '30 9 * * *', humanReadable: 'Every Day at 9:30 AM', seoDescription: 'Cron schedule to run daily at 9:30 AM.' },

  // --- DAILY (PM) ---
  { slug: 'every-day-at-1145pm', expression: '45 23 * * *', humanReadable: 'Every Day at 11:45 PM', seoDescription: 'Run a cron job just before midnight at 11:45 PM.' },

  // --- WEEKLY (DAYS) ---
  { slug: 'every-monday', expression: '0 0 * * 1', humanReadable: 'Every Monday', seoDescription: 'Cron syntax to trigger a job every Monday at midnight.' },
  { slug: 'every-tuesday', expression: '0 0 * * 2', humanReadable: 'Every Tuesday', seoDescription: 'Cron syntax to trigger a job every Tuesday at midnight.' },
  { slug: 'every-wednesday', expression: '0 0 * * 3', humanReadable: 'Every Wednesday', seoDescription: 'Cron syntax to trigger a job every Wednesday at midnight.' },
  { slug: 'every-thursday', expression: '0 0 * * 4', humanReadable: 'Every Thursday', seoDescription: 'Cron syntax to trigger a job every Thursday at midnight.' },
  { slug: 'every-friday', expression: '0 0 * * 5', humanReadable: 'Every Friday', seoDescription: 'Cron syntax to trigger a job every Friday at midnight.' },
  { slug: 'every-saturday', expression: '0 0 * * 6', humanReadable: 'Every Saturday', seoDescription: 'Cron syntax to trigger a job every Saturday at midnight.' },
  { slug: 'every-sunday', expression: '0 0 * * 0', humanReadable: 'Every Sunday', seoDescription: 'Cron expression for weekly Sunday runs (using day 0 or 7).' },

  // --- WEEKLY (SPECIFIC TIMES) ---
  { slug: 'every-monday-at-8am', expression: '0 8 * * 1', humanReadable: 'Every Monday at 8:00 AM', seoDescription: 'Schedule a weekly cron job for Monday morning at 8 AM.' },
  { slug: 'every-monday-at-9am', expression: '0 9 * * 1', humanReadable: 'Every Monday at 9:00 AM', seoDescription: 'Schedule a weekly cron job for Monday morning at 9 AM.' },
  { slug: 'every-monday-at-noon', expression: '0 12 * * 1', humanReadable: 'Every Monday at Noon', seoDescription: 'Schedule a weekly cron job for Monday at 12:00 PM.' },
  { slug: 'every-wednesday-at-noon', expression: '0 12 * * 3', humanReadable: 'Every Wednesday at Noon', seoDescription: 'Schedule a weekly cron job for Wednesday at 12:00 PM.' },
  { slug: 'every-friday-at-5pm', expression: '0 17 * * 5', humanReadable: 'Every Friday at 5:00 PM', seoDescription: 'Cron expression for end-of-week tasks running at 5 PM on Fridays.' },
  { slug: 'every-sunday-at-2am', expression: '0 2 * * 0', humanReadable: 'Every Sunday at 2:00 AM', seoDescription: 'Typical cron schedule for weekend database maintenance.' },
  { slug: 'every-sunday-at-8am', expression: '0 8 * * 0', humanReadable: 'Every Sunday at 8:00 AM', seoDescription: 'Schedule a weekly Sunday morning job at 8 AM.' },
  { slug: 'every-weekday-at-8am', expression: '0 8 * * 1-5', humanReadable: 'Every Weekday at 8:00 AM', seoDescription: 'Run a task Monday through Friday at 8:00 AM.' },
  { slug: 'every-weekday-at-5pm', expression: '0 17 * * 1-5', humanReadable: 'Every Weekday at 5:00 PM', seoDescription: 'Run a task Monday through Friday at the close of business.' },
  { slug: 'every-weekday-at-10pm', expression: '0 22 * * 1-5', humanReadable: 'Every Weekday at 10:00 PM', seoDescription: 'Run a task Monday through Friday at 10:00 PM.' },

  // --- MONTHLY ---
  { slug: 'first-day-of-month', expression: '0 0 1 * *', humanReadable: 'First Day of the Month', seoDescription: 'Cron schedule to run on the 1st of every month at midnight.' },
  { slug: 'first-day-of-month-at-8am', expression: '0 8 1 * *', humanReadable: 'First Day of the Month at 8:00 AM', seoDescription: 'Cron schedule to run on the 1st of every month at 8 AM.' },
  { slug: 'first-day-of-month-at-9am', expression: '0 9 1 * *', humanReadable: 'First Day of the Month at 9:00 AM', seoDescription: 'Cron schedule to run on the 1st of every month at 9 AM.' },
  { slug: 'first-day-of-month-at-noon', expression: '0 12 1 * *', humanReadable: 'First Day of the Month at Noon', seoDescription: 'Cron schedule to run on the 1st of every month at 12:00 PM.' },
  { slug: 'second-day-of-month', expression: '0 0 2 * *', humanReadable: 'Second Day of the Month', seoDescription: 'Cron syntax to run on the 2nd day of every month.' },
  { slug: 'fifth-day-of-month', expression: '0 0 5 * *', humanReadable: 'Fifth Day of the Month', seoDescription: 'Cron syntax to run on the 5th day of every month.' },
  { slug: 'tenth-day-of-month', expression: '0 0 10 * *', humanReadable: 'Tenth Day of the Month', seoDescription: 'Cron syntax to run on the 10th day of every month.' },
  { slug: 'fifteenth-day-of-month-at-8am', expression: '0 8 15 * *', humanReadable: '15th Day of the Month at 8:00 AM', seoDescription: 'Run a mid-month task on the 15th at 8 AM.' },
  { slug: 'twentieth-day-of-month', expression: '0 0 20 * *', humanReadable: '20th Day of the Month', seoDescription: 'Cron syntax to run on the 20th day of every month.' },
  { slug: 'twenty-fifth-day-of-month', expression: '0 0 25 * *', humanReadable: '25th Day of the Month', seoDescription: 'Cron syntax to run on the 25th day of every month.' },
  { slug: 'last-day-of-month', expression: '0 0 L * *', humanReadable: 'Last Day of the Month', seoDescription: 'Cron syntax for end-of-month jobs. Learn how to use the L flag for Quartz and AWS.' },
  { slug: 'last-day-of-month-at-5pm', expression: '0 17 L * *', humanReadable: 'Last Day of the Month at 5:00 PM', seoDescription: 'End-of-month cron job running at 5 PM on the final day.' },

  // --- YEARLY & QUARTERLY ---
  { slug: 'december-first', expression: '0 0 1 12 *', humanReadable: 'December 1st', seoDescription: 'Cron syntax to run annually on December 1st at midnight.' },
  { slug: 'december-twenty-fifth', expression: '0 0 25 12 *', humanReadable: 'December 25th', seoDescription: 'Cron syntax to run annually on December 25th.' },
  { slug: 'december-thirty-first', expression: '0 0 31 12 *', humanReadable: 'December 31st', seoDescription: 'Cron syntax to run annually on December 31st at midnight.' },

  // --- MULTI-DAY / HYBRIDS ---
  { slug: 'monday-wednesday-friday-at-noon', expression: '0 12 * * 1,3,5', humanReadable: 'Mon, Wed, Fri at Noon', seoDescription: 'Run a task at 12 PM every Monday, Wednesday, and Friday.' },
  { slug: 'tuesday-thursday-at-noon', expression: '0 12 * * 2,4', humanReadable: 'Tuesday and Thursday at Noon', seoDescription: 'Run a task at 12 PM every Tuesday and Thursday.' },
  { slug: 'friday-the-13th', expression: '0 0 13 * 5', humanReadable: 'Friday the 13th', seoDescription: 'Cron syntax to run a job only when the 13th of the month lands on a Friday.' }
];

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const FIELD_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0, 59],
  [0, 23],
  [1, 31],
  [1, 12],
  [0, 7],
];

function expandCronField(field: string, min: number, max: number): string | null {
  const values = new Set<number>();
  const normalize = (value: number) => (max === 7 && value === 7 ? 0 : value);
  for (const part of field.split(",")) {
    let match: RegExpMatchArray | null;
    if (part === "*") {
      for (let value = min; value <= max; value += 1) values.add(normalize(value));
    } else if ((match = part.match(/^\*\/(\d+)$/))) {
      for (let value = min; value <= max; value += Number(match[1])) {
        values.add(normalize(value));
      }
    } else if ((match = part.match(/^(\d+)-(\d+)(?:\/(\d+))?$/))) {
      const step = match[3] ? Number(match[3]) : 1;
      for (let value = Number(match[1]); value <= Number(match[2]); value += step) {
        values.add(normalize(value));
      }
    } else if ((match = part.match(/^(\d+)$/))) {
      values.add(normalize(Number(match[1])));
    } else {
      return null;
    }
  }
  return [...values].sort((a, b) => a - b).join(".");
}

/**
 * Canonical key of the exact set of times an expression fires, so that
 * equivalent spellings — a step value with or without an explicit range,
 * or day-of-week lists in different orders — compare as equal.
 * Returns null for non-5-field or L/W/# expressions.
 */
export function executionPatternKey(expression: string): string | null {
  const fields = expression.trim().split(/\s+/);
  if (fields.length !== 5) return null;
  const sets: string[] = [];
  for (let index = 0; index < fields.length; index += 1) {
    const range = FIELD_RANGES[index];
    const field = fields[index];
    if (!range || !field) return null;
    const set = expandCronField(field, range[0], range[1]);
    if (set === null) return null;
    sets.push(set);
  }
  return sets.join("|");
}

/** Lookup by slug — consumed by the /cron/[schedule] route. */
export function getCronSchedule(slug: string): CronScheduleRoute | undefined {
  return CRON_SCHEDULES.find((schedule) => schedule.slug === slug);
}

/** All schedule slugs, in dataset order. */
export function getAllCronScheduleSlugs(): string[] {
  return CRON_SCHEDULES.map((schedule) => schedule.slug);
}

/** Neighboring schedules in dataset order, for on-page cross-links. */
export function relatedCronSchedules(slug: string, count = 6): CronScheduleRoute[] {
  const index = CRON_SCHEDULES.findIndex((schedule) => schedule.slug === slug);
  if (index === -1) return [];

  const related: CronScheduleRoute[] = [];
  for (let offset = 1; related.length < count && offset < CRON_SCHEDULES.length; offset += 1) {
    for (const candidate of [CRON_SCHEDULES[index + offset], CRON_SCHEDULES[index - offset]]) {
      if (candidate && !related.includes(candidate)) {
        related.push(candidate);
      }
      if (related.length >= count) break;
    }
  }
  return related;
}

/**
 * Throws if the dataset is invalid: duplicate or non-kebab-case slugs, a slug
 * colliding with a reserved route, a slug already owned by a cron recipe
 * page, or an expression that fires at the same times as another schedule or
 * a Unix-recipe page (one intent, one URL).
 */
export function assertCronScheduleIntegrity(
  schedules: readonly CronScheduleRoute[] = CRON_SCHEDULES,
): void {
  const violations: string[] = [];
  const seen = new Set<string>();
  const schedulePatterns = new Map<string, string>();
  const recipePatterns = new Map<string, string>();
  for (const recipe of RECIPES) {
    if (recipe.category === "platform-specific") continue;
    const key = executionPatternKey(recipe.expression);
    if (key) recipePatterns.set(key, recipe.slug);
  }

  for (const schedule of schedules) {
    if (RESERVED_ROUTES.includes(schedule.slug)) {
      violations.push(`Slug "${schedule.slug}" collides with a reserved route.`);
    }
    if (!SLUG_PATTERN.test(schedule.slug)) {
      violations.push(`Slug "${schedule.slug}" is not lowercase kebab-case.`);
    }
    if (seen.has(schedule.slug)) {
      violations.push(`Duplicate slug "${schedule.slug}".`);
    }
    seen.add(schedule.slug);

    if (RECIPES.some((recipe) => recipe.slug === schedule.slug)) {
      violations.push(
        `Slug "${schedule.slug}" is already owned by a cron recipe page.`,
      );
    }

    const pattern = executionPatternKey(schedule.expression);
    if (pattern) {
      const recipeOwner = recipePatterns.get(pattern);
      if (recipeOwner) {
        violations.push(
          `Schedule "${schedule.slug}" fires at the same times as existing page "${recipeOwner}".`,
        );
      }
      const scheduleOwner = schedulePatterns.get(pattern);
      if (scheduleOwner) {
        violations.push(
          `Schedule "${schedule.slug}" fires at the same times as schedule "${scheduleOwner}".`,
        );
      }
      schedulePatterns.set(pattern, schedule.slug);
    }
  }

  if (violations.length > 0) {
    throw new Error(
      `lib/config/cron-schedules.ts: schedule registry integrity check failed (${violations.length} violation${violations.length === 1 ? "" : "s"}):\n` +
        violations.map((violation) => `  - ${violation}`).join("\n"),
    );
  }
}

// Validate on import so any consumer (build, dev, or test) fails fast.
assertCronScheduleIntegrity();
