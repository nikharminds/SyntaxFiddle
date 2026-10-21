import { describe, expect, it } from "vitest";
import {
  buildJsonSchemaSeoSections,
  JSON_SCHEMA_FAQS,
} from "../copy";
import type { ToolFaq } from "../../../components/schema/ToolSchema";

function prose(): string {
  return buildJsonSchemaSeoSections()
    .map((section) => [section.heading, ...section.body].join(" "))
    .join(" ");
}

function assertSchemaReadyFaqs(faqs: ToolFaq[]) {
  expect(faqs.length).toBeGreaterThanOrEqual(5);
  expect(new Set(faqs.map((faq) => faq.question)).size).toBe(faqs.length);
  for (const faq of faqs) {
    expect(faq.question.length).toBeGreaterThan(10);
    expect(faq.answer.length).toBeGreaterThan(80);
  }
}

describe("json-to-schema hub page copy", () => {
  it("exceeds 500 words of technical prose", () => {
    expect(prose().split(/\s+/).filter(Boolean).length).toBeGreaterThanOrEqual(500);
  });

  it("covers inference mechanics, all four targets, and the privacy angle", () => {
    const text = prose();
    expect(text).toContain("z.coerce.date()");
    expect(text).toContain("KeyMap");
    expect(text).toContain("populate_by_name");
    expect(text).toContain("json:\"original_key\"");
    expect(text).toContain("Web Worker");
    expect(text).toMatch(/GDPR|HIPAA/);
    expect(text).toMatch(/PII|personally identifiable/i);
    expect(text).toMatch(/watchdog/i);
  });

  it("has six sections with multi-paragraph bodies", () => {
    const sections = buildJsonSchemaSeoSections();
    expect(sections.length).toBe(6);
    for (const section of sections) {
      expect(section.body.length).toBeGreaterThanOrEqual(2);
      expect(section.heading.length).toBeGreaterThan(15);
    }
  });

  it("provides schema-ready FAQs", () => {
    assertSchemaReadyFaqs(JSON_SCHEMA_FAQS as ToolFaq[]);
  });
});
