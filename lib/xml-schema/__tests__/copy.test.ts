import { describe, expect, it } from "vitest";
import { buildXmlSchemaSeoSections, XML_SCHEMA_FAQS } from "../copy";

describe("xml schema seo copy", () => {
  it("ships at least four deep sections with substantial paragraphs", () => {
    const sections = buildXmlSchemaSeoSections();
    expect(sections.length).toBeGreaterThanOrEqual(4);
    for (const section of sections) {
      expect(section.body.length).toBeGreaterThanOrEqual(2);
      for (const paragraph of section.body) {
        expect(paragraph.length).toBeGreaterThan(200);
      }
    }
  });

  it("ships at least six FAQs with substantive answers", () => {
    expect(XML_SCHEMA_FAQS.length).toBeGreaterThanOrEqual(6);
    for (const faq of XML_SCHEMA_FAQS) {
      expect(faq.answer.length).toBeGreaterThan(200);
    }
  });

  it("states the conventions honestly", () => {
    const all = buildXmlSchemaSeoSections().map((s) => s.heading + s.body.join(" ")).join(" ");
    expect(all).toContain("@");
    expect(all.toLowerCase()).toContain("array");
    expect(all.toLowerCase()).toContain("#text");
  });
});
