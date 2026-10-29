import { describe, expect, it } from "vitest";
import { diagnoseXmlSyntax, generateSchemaFromXml, parseXml } from "../parser";

describe("xml parser", () => {
  it("parses a simple element with sniffed scalars", () => {
    const result = parseXml("<root><a>42</a><b>true</b><c>hello</c></root>");
    expect(result).toEqual({
      ok: true,
      rootName: "root",
      value: { a: 42, b: true, c: "hello" },
    });
  });

  it("keeps leading-zero numbers as strings", () => {
    const result = parseXml("<root><zip>00700</zip></root>");
    expect(result.ok && (result.value as Record<string, unknown>).zip).toBe("00700");
  });

  it("maps attributes to @-prefixed properties", () => {
    const result = parseXml('<book id="101" in-stock="true">Title</book>');
    expect(result).toEqual({
      ok: true,
      rootName: "book",
      value: { "@id": 101, "@in-stock": true, "#text": "Title" },
    });
  });

  it("collects repeated siblings into arrays", () => {
    const result = parseXml("<root><item>1</item><item>2</item><item>3</item></root>");
    expect(result.ok && (result.value as Record<string, unknown>).item).toEqual([1, 2, 3]);
  });

  it("converts empty and self-closing elements to null", () => {
    const result = parseXml("<root><a></a><b/></root>");
    expect(result).toEqual({ ok: true, rootName: "root", value: { a: null, b: null } });
  });

  it("decodes entities including numeric references", () => {
    const result = parseXml("<root><t>A &amp; B &lt;C&gt; &#65;&#x42;</t></root>");
    expect(result.ok && (result.value as Record<string, unknown>).t).toBe("A & B <C> AB");
  });

  it("preserves CDATA verbatim without scalar sniffing", () => {
    const result = parseXml("<root><code><![CDATA[007 && <raw>]]></code></root>");
    expect(result.ok && (result.value as Record<string, unknown>).code).toBe("007 && <raw>");
  });

  it("skips declaration, comments, and DOCTYPE", () => {
    const xml = '<?xml version="1.0"?>\n<!DOCTYPE root [\n<!ENTITY x "y">\n]>\n<!-- hi -->\n<root><a>1</a></root>';
    const result = parseXml(xml);
    expect(result.ok).toBe(true);
  });

  it("reports mismatched closing tags with location", () => {
    const result = parseXml("<root>\n  <a>1</b>\n</root>");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.detail.message).toContain("Mismatched closing tag");
      expect(result.detail.line).toBeGreaterThan(1);
    }
  });

  it("reports unclosed elements", () => {
    const result = parseXml("<root><a>1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.detail.message).toContain("Unclosed element <a>");
  });

  it("rejects unknown entities", () => {
    const result = parseXml("<root>&bogus;</root>");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.detail.message).toContain("Unknown entity &bogus;");
  });

  it("rejects junk after the root element", () => {
    const result = parseXml("<root/><tail/>");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.detail.message).toContain("after the root element");
  });

  it("rejects empty input", () => {
    expect(parseXml("   ").ok).toBe(false);
  });

  it("returns null diagnostics for valid documents", () => {
    expect(diagnoseXmlSyntax("<a><b>1</b></a>")).toBeNull();
  });
});

describe("xml schema generation", () => {
  const CATALOG = `<catalog>
    <book id="1" available="true">
      <title>Midnight Rain</title>
      <price>5.95</price>
      <published_at>2000-12-16T00:00:00Z</published_at>
    </book>
  </catalog>`;

  it("generates a zod schema from XML with wire keys preserved by default", () => {
    const code = generateSchemaFromXml(CATALOG, "zod");
    expect(code).toContain("title");
    expect(code).toContain("price");
    expect(code).toContain("published_at");
    expect(code).not.toContain(".transform(");
    const camelCode = generateSchemaFromXml(CATALOG, "zod", undefined, {
      keyCasing: "camel",
    });
    expect(camelCode).toContain("publishedAt");
  });

  it("generates TypeScript interfaces from XML", () => {
    const code = generateSchemaFromXml(CATALOG, "ts");
    expect(code).toContain("interface");
    expect(code.toLowerCase()).toContain("catalog");
  });

  it("derives the root type name from the document when no rootName is given", () => {
    const code = generateSchemaFromXml("<my-config><a>1</a></my-config>", "ts");
    expect(code).toContain("MyConfig");
  });

  it("throws with a message on malformed XML", () => {
    expect(() => generateSchemaFromXml("<a><b></a>", "zod")).toThrow();
  });
});
