import { describe, expect, it } from "vitest";
import parser from "cron-parser";
import {
  assertCronScheduleIntegrity,
  CRON_SCHEDULES,
  executionPatternKey,
  getAllCronScheduleSlugs,
  getCronSchedule,
  relatedCronSchedules,
  type CronScheduleRoute,
} from "../cron-schedules";
import { RESERVED_ROUTES } from "../converters";
import { RECIPES } from "../../cron/recipes";

// Importing the module already ran the module-scope integrity assertion.

const EXPECTED_COUNT = 54;

function makeSchedule(overrides: Partial<CronScheduleRoute> = {}): CronScheduleRoute {
  return {
    slug: "every-99-minutes",
    expression: "37 4 * * 2",
    humanReadable: "Every 99 Minutes",
    seoDescription: "Test schedule.",
    ...overrides,
  };
}

describe("cron schedule registry", () => {
  it("contains the expected schedule count with unique slugs", () => {
    expect(CRON_SCHEDULES.length).toBe(EXPECTED_COUNT);
    expect(new Set(getAllCronScheduleSlugs()).size).toBe(EXPECTED_COUNT);
  });

  it("parses every expression and yields five ascending UTC executions", () => {
    for (const schedule of CRON_SCHEDULES) {
      const interval = parser.parseExpression(schedule.expression, { utc: true });
      const runs: Date[] = [];
      for (let i = 0; i < 5; i += 1) {
        runs.push(interval.next().toDate());
      }
      expect(runs.length, schedule.slug).toBe(5);
      expect(runs[0]!.getTime(), schedule.slug).toBeLessThan(runs[4]!.getTime());
      for (const run of runs) {
        expect(run.getUTCSeconds(), schedule.slug).toBe(0);
      }
    }
  });

  it("never collides with reserved routes or cron recipe pages", () => {
    for (const slug of getAllCronScheduleSlugs()) {
      expect(RESERVED_ROUTES).not.toContain(slug);
      expect(RECIPES.some((recipe) => recipe.slug === slug), slug).toBe(false);
    }
  });

  it("never fires at the same times as a Unix cron recipe page", () => {
    const recipePatterns = new Set(
      RECIPES.filter((recipe) => recipe.category !== "platform-specific")
        .map((recipe) => executionPatternKey(recipe.expression))
        .filter((key): key is string => key !== null),
    );
    for (const schedule of CRON_SCHEDULES) {
      const key = executionPatternKey(schedule.expression);
      if (!key) continue;
      expect(recipePatterns.has(key), schedule.slug).toBe(false);
    }
  });

  it("resolves slugs and returns related schedules excluding self", () => {
    const first = CRON_SCHEDULES[0];
    if (!first) throw new Error("empty registry");
    expect(getCronSchedule(first.slug)).toBe(first);

    const related = relatedCronSchedules(first.slug);
    expect(related.length).toBe(6);
    expect(related.some((item) => item.slug === first.slug)).toBe(false);
    expect(relatedCronSchedules("does-not-exist")).toEqual([]);
  });

  it("passes the integrity assertion for the shipped registry", () => {
    expect(() => assertCronScheduleIntegrity()).not.toThrow();
  });
});

describe("cron schedule guard (failure paths)", () => {
  it("throws on duplicate slugs", () => {
    expect(() =>
      assertCronScheduleIntegrity([makeSchedule(), makeSchedule()]),
    ).toThrow(/Duplicate slug/u);
  });

  it("throws on reserved-route collisions", () => {
    expect(() =>
      assertCronScheduleIntegrity([makeSchedule({ slug: "cron" })]),
    ).toThrow(/reserved route/u);
  });

  it("throws on cron recipe collisions", () => {
    expect(() =>
      assertCronScheduleIntegrity([makeSchedule({ slug: "daily-at-2am" })]),
    ).toThrow(/recipe page/u);
  });

  it("throws on non-kebab-case slugs", () => {
    expect(() =>
      assertCronScheduleIntegrity([makeSchedule({ slug: "Every_5" })]),
    ).toThrow(/kebab-case/u);
  });

  it("throws when a schedule fires at the same times as a recipe", () => {
    expect(() =>
      assertCronScheduleIntegrity([makeSchedule({ slug: "unique-slug", expression: "0 2 * * *" })]),
    ).toThrow(/fires at the same times as existing page/u);
  });

  it("throws when two schedules fire at the same times", () => {
    expect(() =>
      assertCronScheduleIntegrity([makeSchedule(), makeSchedule({ slug: "another-slug" })]),
    ).toThrow(/fires at the same times as schedule/u);
  });
});
