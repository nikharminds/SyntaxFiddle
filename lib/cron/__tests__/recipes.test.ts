import { describe, expect, it } from "vitest";
import { analyzeCronExpression } from "../engine";
import {
  awsEquivalentExpression,
  getRecipe,
  nodeCronEquivalentExpression,
  RECIPES,
  unixEquivalentExpression,
} from "../recipes";

describe("recipe dataset integrity", () => {
  it("ships at least 90 recipes", () => {
    expect(RECIPES.length).toBeGreaterThanOrEqual(90);
  });

  it("has unique, URL-safe slugs", () => {
    const slugs = RECIPES.map((recipe) => recipe.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("links 6-8 resolvable related slugs per recipe, never itself", () => {
    for (const recipe of RECIPES) {
      expect(recipe.relatedSlugs.length).toBeGreaterThanOrEqual(6);
      expect(recipe.relatedSlugs.length).toBeLessThanOrEqual(8);
      expect(recipe.relatedSlugs).not.toContain(recipe.slug);
      for (const slug of recipe.relatedSlugs) {
        expect(getRecipe(slug)).toBeDefined();
      }
    }
  });

  it("analyzes every recipe expression as valid in its dialect", () => {
    for (const recipe of RECIPES) {
      const result = analyzeCronExpression(recipe.expression, recipe.dialect, "UTC", 3);
      if (!result.isValid) {
        throw new Error(
          `Recipe "${recipe.slug}" (${recipe.dialect}) failed validation: ${result.errorMessage}`
        );
      }
      expect(result.isValid).toBe(true);
      expect(result.humanReadable).not.toBe("");
    }
  });
});

describe("dialect conversion helpers", () => {
  it("passes Unix recipes through unchanged", () => {
    const recipe = getRecipe("every-6-minutes");
    expect(recipe).toBeDefined();
    expect(unixEquivalentExpression(recipe!)).toBe("*/6 * * * *");
  });

  it("keeps day-of-week names when porting AWS to Unix", () => {
    const recipe = getRecipe("aws-eventbridge-weekdays-at-9am");
    expect(recipe).toBeDefined();
    expect(unixEquivalentExpression(recipe!)).toBe("0 9 * * MON-FRI");
  });

  it("shifts numeric day-of-week when porting Unix to AWS", () => {
    const recipe = getRecipe("weekends-at-midnight");
    expect(recipe).toBeDefined();
    expect(awsEquivalentExpression(recipe!).expression).toBe("0 0 ? * 1,7 *");
  });

  it("keeps AWS recipes unchanged for AWS output", () => {
    const recipe = getRecipe("aws-eventbridge-every-5-minutes");
    expect(recipe).toBeDefined();
    expect(awsEquivalentExpression(recipe!)).toEqual({
      expression: "0/5 * * * ? *",
    });
  });

  it("refuses sub-minute Quartz conversions with a note", () => {
    const recipe = getRecipe("quartz-every-10-seconds");
    expect(recipe).toBeDefined();
    expect(unixEquivalentExpression(recipe!)).toBeNull();
    const conversion = awsEquivalentExpression(recipe!);
    expect(conversion.note).toBeDefined();
    expect(conversion.expression).toBe("0/1 * * * ? *");
  });

  it("drops a leading zero-seconds field when porting Quartz to Unix", () => {
    const recipe = getRecipe("spring-boot-every-5-minutes");
    expect(recipe).toBeDefined();
    expect(unixEquivalentExpression(recipe!)).toBe("0/5 * * * *");
  });

  it("wraps AWS expressions as seconds-first for node-cron", () => {
    const recipe = getRecipe("aws-eventbridge-daily-at-midnight");
    expect(recipe).toBeDefined();
    expect(nodeCronEquivalentExpression(recipe!)).toBe("0 0 0 * * *");
  });

  it("produces valid Unix conversions for every Unix-convertible recipe", () => {
    for (const recipe of RECIPES) {
      const unix = unixEquivalentExpression(recipe);
      if (unix === null) continue;
      const result = analyzeCronExpression(unix, "unix", "UTC", 3);
      expect(result.isValid).toBe(true);
    }
  });

  it("produces valid AWS conversions for every AWS-convertible recipe", () => {
    for (const recipe of RECIPES) {
      const conversion = awsEquivalentExpression(recipe);
      if (conversion.note) continue;
      const result = analyzeCronExpression(conversion.expression, "aws", "UTC", 3);
      expect(result.isValid).toBe(true);
    }
  });
});
