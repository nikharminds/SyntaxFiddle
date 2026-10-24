import { describe, expect, it } from "vitest";
import { CONVERSION_PAIRS } from "../routes";
import { PAIR_DEEP_SECTIONS, PAIR_EXTRA_FAQS } from "../pair-copy";

describe("converter pair differentiation", () => {
  it("every conversion pair has deep sections and extra FAQs", () => {
    for (const pair of CONVERSION_PAIRS) {
      expect(PAIR_DEEP_SECTIONS[pair.slug], pair.slug).toBeDefined();
      expect(PAIR_EXTRA_FAQS[pair.slug], pair.slug).toBeDefined();
      expect(PAIR_DEEP_SECTIONS[pair.slug]!.length).toBeGreaterThanOrEqual(1);
      expect(PAIR_EXTRA_FAQS[pair.slug]!.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("deep sections are substantial and unique per pair", () => {
    const headings: string[] = [];
    for (const [slug, sections] of Object.entries(PAIR_DEEP_SECTIONS)) {
      for (const section of sections) {
        headings.push(section.heading);
        expect(section.body.length, slug).toBeGreaterThanOrEqual(2);
        for (const paragraph of section.body) {
          expect(paragraph.length, slug).toBeGreaterThan(250);
        }
      }
    }
    expect(new Set(headings).size).toBe(headings.length);
  });

  it("extra FAQs are substantial and unique across the site", () => {
    const questions: string[] = [];
    for (const [slug, faqs] of Object.entries(PAIR_EXTRA_FAQS)) {
      for (const faq of faqs) {
        questions.push(faq.question);
        expect(faq.question.length, slug).toBeGreaterThan(15);
        expect(faq.answer.length, slug).toBeGreaterThan(200);
      }
    }
    expect(new Set(questions).size).toBe(questions.length);
  });

  it("no extra-faq question duplicates a templated pair FAQ", () => {
    for (const pair of CONVERSION_PAIRS) {
      const templated = new Set(pair.faqs.map((faq) => faq.question));
      for (const faq of PAIR_EXTRA_FAQS[pair.slug] ?? []) {
        expect(templated.has(faq.question), pair.slug).toBe(false);
      }
    }
  });
});
