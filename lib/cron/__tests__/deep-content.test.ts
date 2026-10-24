import { describe, expect, it } from "vitest";
import {
  deepContentSlugs,
  getRecipeDeepContent,
  RECIPE_DEEP_CONTENT,
} from "../deep-content";
import { getRecipe } from "../recipes";
import { getCronSchedule } from "../../config/cron-schedules";

describe("cron deep content", () => {
  it("targets at least ten head-term recipes", () => {
    expect(Object.keys(RECIPE_DEEP_CONTENT).length).toBeGreaterThanOrEqual(10);
  });

  it("only references pages that exist (recipe or schedule)", () => {
    for (const slug of deepContentSlugs()) {
      expect(getRecipe(slug) ?? getCronSchedule(slug), slug).toBeDefined();
    }
  });

  it("head-term slugs are covered", () => {
    const expected = [
      "every-minute",
      "every-5-minutes",
      "every-10-minutes",
      "every-15-minutes",
      "every-30-minutes",
      "every-hour",
      "daily-at-midnight",
      "daily-at-8am",
      "daily-at-9am",
      "weekdays-at-9am",
      "every-monday-at-9am",
      "first-day-of-month",
    ];
    for (const slug of expected) {
      expect(RECIPE_DEEP_CONTENT[slug], slug).toBeDefined();
    }
  });

  it("provides two substantial sections per recipe", () => {
    for (const [slug, content] of Object.entries(RECIPE_DEEP_CONTENT)) {
      expect(content.sections.length, slug).toBeGreaterThanOrEqual(2);
      for (const section of content.sections) {
        expect(section.heading.length, slug).toBeGreaterThan(15);
        expect(section.body.length, slug).toBeGreaterThanOrEqual(2);
        for (const paragraph of section.body) {
          expect(paragraph.length, slug).toBeGreaterThan(250);
        }
      }
    }
  });

  it("provides schema-ready extra FAQs", () => {
    for (const [slug, content] of Object.entries(RECIPE_DEEP_CONTENT)) {
      expect(content.extraFaqs.length, slug).toBeGreaterThanOrEqual(2);
      for (const faq of content.extraFaqs) {
        expect(faq.question.length, slug).toBeGreaterThan(15);
        expect(faq.answer.length, slug).toBeGreaterThan(200);
      }
    }
  });

  it("section headings differ across recipes (no templated duplicates)", () => {
    const headings = Object.values(RECIPE_DEEP_CONTENT).flatMap((content) =>
      content.sections.map((section) => section.heading),
    );
    expect(new Set(headings).size).toBe(headings.length);
  });

  it("lookup by slug matches the registry", () => {
    expect(getRecipeDeepContent("every-5-minutes")).toBeDefined();
    expect(getRecipeDeepContent("daily-at-3am")).toBeUndefined();
  });
});
