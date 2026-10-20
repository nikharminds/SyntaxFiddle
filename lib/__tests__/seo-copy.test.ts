import { describe, expect, it } from "vitest";
import { buildJwtSeoSections, JWT_FAQS } from "../jwt/copy";
import {
  buildRegexSeoSections,
  REGEX_CHEAT_SHEET,
  REGEX_FAQS,
} from "../regex/copy";
import type { ToolFaq } from "../../components/schema/ToolSchema";

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

describe("jwt landing page copy", () => {
  it("exceeds 500 words of technical prose", () => {
    expect(wordCount(buildJwtSeoSections())).toBeGreaterThanOrEqual(500);
  });

  it("covers base64url, segment anatomy, and server-tool risk", () => {
    const text = buildJwtSeoSections()
      .map((section) => [section.heading, ...section.body].join(" "))
      .join(" ");
    expect(text).toContain("Base64Url");
    expect(text).toContain("header.payload.signature");
    expect(text).toMatch(/server|network/);
    expect(text).toContain("Uint8Array");
  });

  it("provides schema-ready FAQs", () => {
    assertSchemaReadyFaqs(JWT_FAQS);
  });
});

describe("regex landing page copy", () => {
  it("exceeds 500 words of technical prose", () => {
    expect(wordCount(buildRegexSeoSections())).toBeGreaterThanOrEqual(500);
  });

  it("covers the JS flavor and catastrophic backtracking", () => {
    const text = buildRegexSeoSections()
      .map((section) => [section.heading, ...section.body].join(" "))
      .join(" ");
    expect(text).toContain("ECMAScript");
    expect(text).toContain("Catastrophic backtracking");
    expect(text).toContain("Web Worker");
  });

  it("ships a cheat sheet covering the core tokens", () => {
    const tokens = REGEX_CHEAT_SHEET.map((row) => row.token);
    for (const token of ["\\d", "\\w", "^", "$", "(?<name>…)", "(?:…)"]) {
      expect(tokens).toContain(token);
    }
    for (const row of REGEX_CHEAT_SHEET) {
      expect(row.meaning.length).toBeGreaterThan(3);
      expect(row.example.length).toBeGreaterThan(3);
    }
  });

  it("provides schema-ready FAQs", () => {
    assertSchemaReadyFaqs(REGEX_FAQS);
  });
});
