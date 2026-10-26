import { describe, expect, it } from "vitest";
import { buildSoqlSeoSections, SOQL_FAQS } from "../seo";

function wordCount(sections: { heading: string; body: string[] }[]): number {
  return sections
    .map((section) => [section.heading, ...section.body].join(" "))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
}

describe("SOQL formatter landing page copy", () => {
  it("exceeds 500 words of technical prose", () => {
    expect(wordCount(buildSoqlSeoSections())).toBeGreaterThanOrEqual(500);
  });

  it("covers subqueries, custom field suffixes, security clauses, and the no-backend guarantee", () => {
    const text = buildSoqlSeoSections()
      .map((section) => [section.heading, ...section.body].join(" "))
      .join(" ");
    expect(text).toContain("subquer");
    expect(text).toContain("__c");
    expect(text).toContain("__mdt");
    expect(text).toContain("WITH SECURITY_ENFORCED");
    expect(text).toContain("Web Worker");
    expect(text).toMatch(/server|network/);
  });

  it("provides schema-ready FAQs", () => {
    expect(SOQL_FAQS.length).toBeGreaterThanOrEqual(5);
    expect(new Set(SOQL_FAQS.map((faq) => faq.question)).size).toBe(SOQL_FAQS.length);
    for (const faq of SOQL_FAQS) {
      expect(faq.question.length).toBeGreaterThan(10);
      expect(faq.answer.length).toBeGreaterThan(80);
    }
  });
});
