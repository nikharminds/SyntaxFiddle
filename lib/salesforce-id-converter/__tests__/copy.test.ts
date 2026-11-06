import { describe, expect, it } from "vitest";
import type { ToolFaq } from "../../../components/schema/ToolSchema";
import {
  APEX_TO18_METHOD,
  buildIdConverterSections,
  EXCEL_CHECK_CHAR_FORMULA,
  ID_CONVERTER_FAQS,
} from "../copy";

function wordCount(sections: { heading: string; body: string[] }[]): number {
  return sections
    .map((section) => [section.heading, ...section.body].join(" "))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function assertSchemaReadyFaqs(faqs: ToolFaq[]) {
  expect(faqs.length).toBeGreaterThanOrEqual(5);
  expect(new Set(faqs.map((faq) => faq.question)).size).toBe(faqs.length);
  for (const faq of faqs) {
    expect(faq.question.length).toBeGreaterThan(10);
    expect(faq.answer.length).toBeGreaterThan(80);
  }
}

describe("salesforce id converter landing copy", () => {
  it("exceeds 500 words of technical prose", () => {
    expect(wordCount(buildIdConverterSections())).toBeGreaterThanOrEqual(500);
  });

  it("covers case-safety, the check-character algorithm, and Excel/Apex usage", () => {
    const text = buildIdConverterSections()
      .map((section) => [section.heading, ...section.body].join(" "))
      .join(" ");
    expect(text).toContain("case-insensitive");
    expect(text).toContain("check");
    expect(text).toContain("Excel");
    expect(text).toContain("Apex");
    expect(text).toContain("VLOOKUP");
    expect(text).toContain("prefix");
  });

  it("provides schema-ready FAQs", () => {
    assertSchemaReadyFaqs(ID_CONVERTER_FAQS);
  });

  it("ships a CODE-based Excel formula and an Apex method", () => {
    expect(EXCEL_CHECK_CHAR_FORMULA).toContain("CODE(");
    expect(EXCEL_CHECK_CHAR_FORMULA).toContain("MID(");
    expect(EXCEL_CHECK_CHAR_FORMULA).not.toContain("EXACT");
    expect(EXCEL_CHECK_CHAR_FORMULA).toContain("ABCDEFGHIJKLMNOPQRSTUVWXYZ012345");

    expect(APEX_TO18_METHOD).toContain("StringException");
    expect(APEX_TO18_METHOD).toContain("to18CharId");
    expect(APEX_TO18_METHOD).toContain("ABCDEFGHIJKLMNOPQRSTUVWXYZ012345");
    expect(APEX_TO18_METHOD).toContain("1 << i");
  });
});
