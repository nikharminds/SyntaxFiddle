import { describe, expect, it } from "vitest";
import { analyzeCronExpression } from "../engine";
import { getRecipe, RECIPES } from "../recipes";
import { buildRecipeSnippets } from "../seo";
import type { ToolFaq } from "../../../components/schema/ToolSchema";
import {
  SALESFORCE_FAQS,
  SALESFORCE_FIELDS,
  SALESFORCE_RECIPE_SLUGS,
  SALESFORCE_SECTIONS,
  SALESFORCE_SPECIAL_CHARS,
} from "../salesforce-content";

function wordCount(sections: { heading: string; body: string[] }[]): number {
  return sections
    .map((section) => [section.heading, ...section.body].join(" "))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
}

describe("salesforce cron landing content", () => {
  it("exceeds 500 words of technical prose", () => {
    expect(wordCount(SALESFORCE_SECTIONS)).toBeGreaterThanOrEqual(500);
  });

  it("covers the seconds field, 1-based weekdays, timezone behavior, and job limits", () => {
    const text = SALESFORCE_SECTIONS.map((section) =>
      [section.heading, ...section.body].join(" "),
    ).join(" ");
    expect(text).toContain("seconds");
    expect(text).toContain("1 is Sunday");
    expect(text).toContain("timezone of the scheduling user");
    expect(text).toContain("100 scheduled Apex jobs");
    expect(text).toContain("CronTrigger");
  });

  it("provides schema-ready FAQs", () => {
    expect(SALESFORCE_FAQS.length).toBeGreaterThanOrEqual(5);
    expect(new Set(SALESFORCE_FAQS.map((faq) => faq.question)).size).toBe(
      SALESFORCE_FAQS.length,
    );
    for (const faq of SALESFORCE_FAQS as ToolFaq[]) {
      expect(faq.question.length).toBeGreaterThan(10);
      expect(faq.answer.length).toBeGreaterThan(80);
    }
  });

  it("documents all seven fields including the optional year", () => {
    expect(SALESFORCE_FIELDS).toHaveLength(7);
    expect(SALESFORCE_FIELDS[6]).toMatchObject({ name: "Year", required: false });
    expect(SALESFORCE_FIELDS[5]?.allowed).toContain("1 = SUN");
  });

  it("documents the special characters the dialect spec allows", () => {
    const chars = SALESFORCE_SPECIAL_CHARS.map((row) => row.char);
    for (const char of ["?", "L", "W", "#", "/"]) {
      expect(chars).toContain(char);
    }
  });

  it("links only existing salesforce recipes", () => {
    expect(SALESFORCE_RECIPE_SLUGS.length).toBeGreaterThanOrEqual(12);
    for (const slug of SALESFORCE_RECIPE_SLUGS) {
      const recipe = getRecipe(slug);
      expect(recipe, `unknown recipe ${slug}`).toBeDefined();
      expect(recipe?.dialect).toBe("salesforce");
    }
  });
});

describe("salesforce recipe snippets", () => {
  it("ships an Apex System.schedule tab for every salesforce recipe", () => {
    const salesforceRecipes = RECIPES.filter((recipe) => recipe.dialect === "salesforce");
    expect(salesforceRecipes.length).toBeGreaterThanOrEqual(12);

    for (const recipe of salesforceRecipes) {
      const snippets = buildRecipeSnippets(recipe);
      const apex = snippets.find((snippet) => snippet.language === "apex");
      expect(apex, `missing apex tab for ${recipe.slug}`).toBeDefined();
      expect(apex?.code).toContain("System.schedule(");
      expect(apex?.code).toContain(`'${recipe.expression}'`);
      // Every snippet expression must stay valid in its own dialect.
      expect(analyzeCronExpression(recipe.expression, "salesforce", "UTC", 1).isValid).toBe(
        true,
      );
    }
  });
});
