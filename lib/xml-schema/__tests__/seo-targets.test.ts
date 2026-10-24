import { describe, expect, it } from "vitest";
import {
  getXmlSchemaSeoTarget,
  XML_SCHEMA_SEO_TARGETS,
  XML_SCHEMA_TARGET_SLUGS,
} from "../seo-targets";

const EXPECTED_TITLES: Record<string, string> = {
  "xml-to-zod": "XML to Zod Schema Generator (Secure & Offline) | SyntaxFiddle",
  "xml-to-typescript": "XML to TypeScript Interface Converter (Zero-Upload) | SyntaxFiddle",
  "xml-to-pydantic": "XML to Pydantic BaseModel (Offline) | SyntaxFiddle",
  "xml-to-go-struct": "XML to Go Struct Converter | SyntaxFiddle",
};

const VALID_TARGETS = new Set(["zod", "ts", "pydantic", "go"]);

function prose(target: (typeof XML_SCHEMA_SEO_TARGETS)[number]): string {
  return target.sections
    .map((section) => [section.heading, ...section.body].join(" "))
    .join(" ");
}

describe("xml-to-schema SEO targets", () => {
  it("covers the four required landing pages with exact titles", () => {
    expect([...XML_SCHEMA_TARGET_SLUGS]).toEqual(Object.keys(EXPECTED_TITLES));
    for (const target of XML_SCHEMA_SEO_TARGETS) {
      expect(target.title).toBe(EXPECTED_TITLES[target.slug]);
    }
  });

  it("maps every slug to a valid workspace target", () => {
    for (const target of XML_SCHEMA_SEO_TARGETS) {
      expect(VALID_TARGETS.has(target.target)).toBe(true);
    }
    expect(getXmlSchemaSeoTarget("xml-to-typescript")?.target).toBe("ts");
    expect(getXmlSchemaSeoTarget("xml-to-go-struct")?.target).toBe("go");
    expect(getXmlSchemaSeoTarget("xml-to-nope")).toBeUndefined();
  });

  it("exceeds 500 words of technical prose per target", () => {
    for (const target of XML_SCHEMA_SEO_TARGETS) {
      expect(prose(target).split(/\s+/).filter(Boolean).length).toBeGreaterThanOrEqual(500);
    }
  });

  it("explains why offline conversion matters for PII on every page", () => {
    for (const target of XML_SCHEMA_SEO_TARGETS) {
      const privacySection = target.sections.find((section) =>
        /why offline conversion matters/i.test(section.heading),
      );
      expect(privacySection, target.slug).toBeDefined();
      expect(privacySection?.body.join(" ")).toMatch(/PII|personally identifiable/);
    }
  });

  it("provides schema-ready FAQs", () => {
    for (const target of XML_SCHEMA_SEO_TARGETS) {
      expect(target.faqs.length).toBeGreaterThanOrEqual(5);
      expect(new Set(target.faqs.map((faq) => faq.question)).size).toBe(
        target.faqs.length,
      );
      for (const faq of target.faqs) {
        expect(faq.question.length).toBeGreaterThan(10);
        expect(faq.answer.length).toBeGreaterThan(80);
      }
    }
  });

  it("ships feature lists and keywords for rich results", () => {
    for (const target of XML_SCHEMA_SEO_TARGETS) {
      expect(target.featureList.length).toBeGreaterThanOrEqual(5);
      expect(target.keywords.length).toBeGreaterThanOrEqual(5);
      expect(target.keywords).toContain(target.slug.replace(/-/g, " "));
    }
  });
});
