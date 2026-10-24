import { describe, expect, it } from "vitest";
import { parseXmlTable } from "../parsers";
import { generateExcelBase64, runConversion } from "../generators";
import type { ParsedTable } from "../types";

const CATALOG = `<?xml version="1.0"?>
<catalog>
  <book id="101" available="true">
    <title>Midnight Rain</title>
    <price>5.95</price>
    <author><name>Ralls</name></author>
  </book>
  <book id="102" available="false">
    <title>XML Guide</title>
    <price>44.95</price>
    <author><name>Gambardella</name></author>
  </book>
</catalog>`;

describe("parseXmlTable", () => {
  it("extracts rows from the repeating record element", () => {
    const table = parseXmlTable(CATALOG);
    expect(table.rowCount).toBe(2);
    expect(table.headers).toContain("@id");
    expect(table.headers).toContain("title");
    expect(table.headers).toContain("author.name");
    expect(table.rows[0]!["@id"]).toBe(101);
    expect(table.rows[0]!.price).toBe(5.95);
    expect(table.rows[0]!["@available"]).toBe(true);
  });

  it("handles sparse records with union headers", () => {
    const table = parseXmlTable(
      "<rows><r><a>1</a></r><r><b>two</b></r></rows>",
    );
    expect(table.headers).toEqual(["a", "b"]);
  });

  it("rejects documents without a repeating record element", () => {
    expect(() => parseXmlTable("<root><a>1</a></root>")).toThrow(/repeating record element/i);
  });

  it("propagates parse errors with location", () => {
    expect(() => parseXmlTable("<root><a>1</b></root>")).toThrow(/line 1/i);
  });

  it("extracts sitemap-style records", () => {
    const table = parseXmlTable(
      "<urlset><url><loc>https://a.dev/</loc><lastmod>2026-01-01</lastmod></url><url><loc>https://b.dev/</loc></url></urlset>",
    );
    expect(table.rowCount).toBe(2);
  });
});

describe("generateExcelBase64", () => {
  const table: ParsedTable = {
    headers: ["id", "price", "active"],
    rows: [
      { id: 1, price: 5.95, active: true },
      { id: 2, price: 44.95, active: false },
    ],
    rowCount: 2,
  };

  it("produces a valid xlsx (zip) payload", () => {
    const base64 = generateExcelBase64(table);
    expect(base64.startsWith("UEsDB")).toBe(true);
    expect(base64.length).toBeGreaterThan(500);
  });

  it("preview via runConversion returns csv text", () => {
    const preview = runConversion(table, { target: "excel", options: {} });
    expect(preview).toContain("id,price,active");
    expect(preview).toContain("5.95");
  });
});

describe("xml to json pipeline", () => {
  it("feeds the json generator from xml records", () => {
    const table = parseXmlTable(CATALOG);
    const json = runConversion(table, { target: "json", options: {} });
    const parsed = JSON.parse(json) as Array<Record<string, unknown>>;
    expect(parsed.length).toBe(2);
    expect(parsed[0]!["@id"]).toBe(101);
  });
});
