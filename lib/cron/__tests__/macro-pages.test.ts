import { describe, expect, it } from "vitest";
import { analyzeCronExpression } from "../engine";
import { getAllCronScheduleSlugs } from "../../config/cron-schedules";
import { RECIPES } from "../recipes";
import { CRON_MACRO_PAGES, getMacroPage } from "../macro-pages";

describe("macro landing pages", () => {
  it("has unique, kebab-case slugs that collide with no other cron page", () => {
    const taken = new Set<string>([
      ...getAllCronScheduleSlugs(),
      ...RECIPES.map((recipe) => recipe.slug),
    ]);

    for (const page of CRON_MACRO_PAGES) {
      expect(taken.has(page.slug)).toBe(false);
      expect(page.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      taken.add(page.slug);
    }
  });

  it("covers exactly the macros the engine supports (plus @reboot)", () => {
    const pageMacros = CRON_MACRO_PAGES.map((page) => page.macro).sort();
    expect(pageMacros).toEqual(
      ["@daily", "@hourly", "@monthly", "@reboot", "@weekly", "@yearly"].sort(),
    );
  });

  it("keeps every listed expansion in sync with the engine", () => {
    for (const page of CRON_MACRO_PAGES) {
      if (page.macro === "@reboot") continue;
      const result = analyzeCronExpression(page.macro, "unix", "UTC");
      expect(result.isValid).toBe(true);
      expect(result.fields.map((field) => field.value)).toEqual(
        page.expansion?.split(" "),
      );
    }
  });

  it("rejects every page macro in dialects without macro support", () => {
    for (const page of CRON_MACRO_PAGES) {
      if (page.macro === "@reboot") continue;
      const quartz = analyzeCronExpression(page.macro, "quartz", "UTC");
      expect(quartz.isValid).toBe(false);
      expect(quartz.errorMessage).toContain(page.quartzEquivalent);
      const aws = analyzeCronExpression(page.macro, "aws", "UTC");
      expect(aws.isValid).toBe(false);
      expect(aws.errorMessage).toContain(page.awsEquivalent);
    }
  });

  it("resolves related slugs against schedules, recipes, and macro pages", () => {
    const known = new Set<string>([
      ...getAllCronScheduleSlugs(),
      ...RECIPES.map((recipe) => recipe.slug),
      ...CRON_MACRO_PAGES.map((page) => page.slug),
    ]);

    for (const page of CRON_MACRO_PAGES) {
      expect(page.relatedSlugs.length).toBeGreaterThan(0);
      for (const slug of page.relatedSlugs) {
        expect(known.has(slug)).toBe(true);
      }
    }
  });

  it("looks pages up by slug", () => {
    expect(getMacroPage("at-daily")?.macro).toBe("@daily");
    expect(getMacroPage("nope")).toBeUndefined();
  });
});
