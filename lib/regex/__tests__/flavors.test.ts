import { describe, expect, it } from "vitest";
import { REGEX_FLAVOR_CONTENT } from "../flavors";
import { REGEX_FLAVORS } from "../dialects";

function wordCount(sections: { heading: string; body: string[] }[]): number {
  return sections
    .map((section) => [section.heading, ...section.body].join(" "))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
}

describe("regex flavor landing copy", () => {
  it("covers every flavor exactly once", () => {
    expect(REGEX_FLAVOR_CONTENT.map((content) => content.id).sort()).toEqual(
      REGEX_FLAVORS.map((flavor) => flavor.id).sort(),
    );
  });

  for (const content of REGEX_FLAVOR_CONTENT) {
    describe(content.slug, () => {
      it("exceeds 500 words of technical prose", () => {
        expect(wordCount(content.sections)).toBeGreaterThanOrEqual(500);
      });

      it("has four substantial sections with multi-paragraph bodies", () => {
        expect(content.sections.length).toBe(4);
        for (const section of content.sections) {
          expect(section.body.length).toBeGreaterThanOrEqual(2);
          for (const paragraph of section.body) {
            expect(paragraph.length).toBeGreaterThan(200);
          }
        }
      });

      it("provides schema-ready FAQs", () => {
        expect(content.faqs.length).toBeGreaterThanOrEqual(6);
        expect(new Set(content.faqs.map((faq) => faq.question)).size).toBe(
          content.faqs.length,
        );
        for (const faq of content.faqs) {
          expect(faq.question.length).toBeGreaterThan(10);
          expect(faq.answer.length).toBeGreaterThan(200);
        }
      });

      it("ships a cheat sheet and a differences table", () => {
        expect(content.cheatSheet.length).toBeGreaterThanOrEqual(8);
        expect(content.differences.length).toBeGreaterThanOrEqual(8);
        expect(new Set(content.cheatSheet.map((row) => row.token)).size).toBe(
          content.cheatSheet.length,
        );
        expect(new Set(content.differences.map((row) => row.construct)).size).toBe(
          content.differences.length,
        );
      });

      it("carries SEO metadata and keywords", () => {
        expect(content.title.includes("| SyntaxFiddle")).toBe(true);
        expect(content.heading.length).toBeGreaterThan(20);
        expect(content.description.length).toBeGreaterThan(120);
        expect(content.keywords.length).toBeGreaterThanOrEqual(8);
        expect(content.featureList.length).toBeGreaterThanOrEqual(5);
        expect(content.facts.length).toBe(3);
      });
    });
  }
});
