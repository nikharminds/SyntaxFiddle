import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { parseCsv, parseExcel } from "../parsers";
import {
  generateJson,
  generateSoqlIn,
  generateSql,
  generateXml,
} from "../generators";
import type { ParsedTable } from "../types";
import { CONVERSION_PAIRS, getConversionPair } from "../routes";
import { buildSeoSections } from "../copy";

describe("conversion pair registry", () => {
  it("generates 8 unique slugs covering every source and target", () => {
    expect(CONVERSION_PAIRS).toHaveLength(8);
    expect(new Set(CONVERSION_PAIRS.map((pair) => pair.slug)).size).toBe(8);
    expect(getConversionPair("csv-to-json")?.target).toBe("json");
    expect(getConversionPair("excel-to-soql")?.target).toBe("soql-in");
    expect(getConversionPair("csv-to-xml")?.target).toBe("xml");
    expect(getConversionPair("unknown-pair")).toBeUndefined();
  });

  it("titles SOQL pages with the full clause name", () => {
    expect(getConversionPair("csv-to-soql")?.title).toBe(
      "CSV to SOQL IN Clause Converter",
    );
  });

  it("produces 500+ words of technical copy per landing page", () => {
    for (const pair of CONVERSION_PAIRS) {
      const words = buildSeoSections(pair)
        .map((section) => [section.heading, ...section.body].join(" "))
        .join(" ")
        .split(/\s+/).length;
      expect(words).toBeGreaterThanOrEqual(500);
    }
  });
});

describe("parseCsv", () => {
  it("autodetects comma delimiter", async () => {
    const table = await parseCsv("Name,Age,City\nO'Reilly,34,Dublin\nSmith,28,London");

    expect(table.headers).toEqual(["Name", "Age", "City"]);
    expect(table.rowCount).toBe(2);
    expect(table.rows[0]?.Name).toBe("O'Reilly");
    expect(table.rows[1]?.City).toBe("London");
  });

  it("autodetects semicolon delimiter", async () => {
    const table = await parseCsv("Name;Age\nO'Reilly;34\nSmith;28");

    expect(table.headers).toEqual(["Name", "Age"]);
    expect(table.rowCount).toBe(2);
    expect(table.rows[0]?.Age).toBe("34");
  });

  it("autodetects tab and pipe delimiters", async () => {
    const tabbed = await parseCsv("Name\tAge\nO'Reilly\t34");
    const piped = await parseCsv("Name|Age\nO'Reilly|34");

    expect(tabbed.rows[0]?.Age).toBe("34");
    expect(piped.rows[0]?.Age).toBe("34");
  });

  it("handles escaped quotes inside quoted fields", async () => {
    const table = await parseCsv(
      'Name,Note\n"Smith, John","said ""hi"", twice"',
    );

    expect(table.rows[0]?.Name).toBe("Smith, John");
    expect(table.rows[0]?.Note).toBe('said "hi", twice');
  });

  it("skips empty lines and trims headers", async () => {
    const table = await parseCsv("  Name  , Age\n\nO'Reilly, 34\n\n");

    expect(table.headers).toEqual(["Name", "Age"]);
    expect(table.rowCount).toBe(1);
  });
});

describe("parseExcel", () => {
  it("reads the first sheet with row 0 as headers, preserving native types", async () => {
    const sheet = XLSX.utils.aoa_to_sheet([
      ["Name", "Age", "Active"],
      ["O'Reilly", 34, true],
      ["Smith", 28, false],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ) as ArrayBuffer;

    const table = await parseExcel(arrayBuffer);

    expect(table.headers).toEqual(["Name", "Age", "Active"]);
    expect(table.rowCount).toBe(2);
    expect(table.rows[0]?.Name).toBe("O'Reilly");
    expect(table.rows[0]?.Age).toBe(34);
    expect(table.rows[0]?.Active).toBe(true);
  });
});

describe("generateSql", () => {
  const table: ParsedTable = {
    headers: ["Name", "Age", "Score", "Active"],
    rows: [
      { Name: "O'Reilly", Age: "34", Score: "99.5", Active: "true" },
      { Name: "Smith", Age: "28", Score: "87.25", Active: "false" },
    ],
    rowCount: 2,
  };

  it("escapes single quotes as doubled quotes", () => {
    const sql = generateSql(table, { tableName: "people", dropTable: false });

    expect(sql).toContain("'O''Reilly'");
    expect(sql).not.toContain("'O'Reilly'");
  });

  it("infers column types", () => {
    const sql = generateSql(table, { tableName: "people", dropTable: false });

    expect(sql).toContain("Name VARCHAR(255)");
    expect(sql).toContain("Age INTEGER");
    expect(sql).toContain("Score NUMERIC");
    expect(sql).toContain("Active BOOLEAN");
  });

  it("emits DROP TABLE only when requested and renders booleans unquoted", () => {
    const withDrop = generateSql(table, { tableName: "people", dropTable: true });
    const withoutDrop = generateSql(table, { tableName: "people", dropTable: false });

    expect(withDrop).toContain("DROP TABLE IF EXISTS people;");
    expect(withoutDrop).not.toContain("DROP TABLE");
    expect(withoutDrop).toContain("99.5, true)");
    expect(withoutDrop).toContain("87.25, false)");
  });

  it("batches INSERT statements every 500 rows by default", () => {
    const big: ParsedTable = {
      headers: ["Id"],
      rows: Array.from({ length: 1001 }, (_, index) => ({ Id: String(index) })),
      rowCount: 1001,
    };
    const sql = generateSql(big, { tableName: "t", dropTable: false });

    expect(sql.split("INSERT INTO").length - 1).toBe(3);
    expect(sql).toContain("VALUES");
  });

  it("quotes identifiers that are not plain SQL identifiers", () => {
    const tricky: ParsedTable = {
      headers: ["First Name"],
      rows: [{ "First Name": "Smith" }],
      rowCount: 1,
    };
    const sql = generateSql(tricky, { tableName: "my table", dropTable: false });

    expect(sql).toContain('CREATE TABLE "my table" (');
    expect(sql).toContain('"First Name" VARCHAR(255)');
  });
});

describe("generateSoqlIn", () => {
  it("builds a clean IN clause from 15 and 18 character Salesforce IDs", () => {
    const table: ParsedTable = {
      headers: ["Id", "Name"],
      rows: [
        { Id: "001xx000003DGA2AA4", Name: "Acme" },
        { Id: "001xx000003DGA2A", Name: "Globex" },
        { Id: "001xx000003DGA2AA4", Name: "Acme duplicate" },
        { Id: "", Name: "Blank id row" },
      ],
      rowCount: 4,
    };

    const soql = generateSoqlIn(table, { targetField: "Id", selectedColumn: "Id" });

    expect(soql).toBe("Id IN ('001xx000003DGA2AA4', '001xx000003DGA2A')");
  });

  it("escapes backslashes and single quotes", () => {
    const table: ParsedTable = {
      headers: ["Name"],
      rows: [{ Name: "It's a\\test" }],
      rowCount: 1,
    };

    const soql = generateSoqlIn(table, { targetField: "Account.Name", selectedColumn: "Name" });

    expect(soql).toBe("Account.Name IN ('It\\'s a\\\\test')");
  });

  it("chunks with comments when unique values exceed 200", () => {
    const table: ParsedTable = {
      headers: ["Id"],
      rows: Array.from({ length: 205 }, (_, index) => ({
        Id: `001xx000003DGA2A${String(index).padStart(2, "0")}`,
      })),
      rowCount: 205,
    };

    const soql = generateSoqlIn(table, { targetField: "Id", selectedColumn: "Id" });

    expect(soql).toContain("// 205 unique values split into 2 chunks of <= 200");
    expect(soql).toContain("// Chunk 1 of 2");
    expect(soql).toContain("Id IN ('001xx000003DGA2A00'");
    expect(soql).toContain("// Chunk 2 of 2");
    expect(soql).toContain("OR Id IN (");
  });

  it("returns a comment when the column has no non-empty values", () => {
    const table: ParsedTable = {
      headers: ["Id", "Name"],
      rows: [{ Id: "", Name: "Acme" }],
      rowCount: 1,
    };

    const soql = generateSoqlIn(table, { targetField: "Id", selectedColumn: "Id" });

    expect(soql).toBe('// Column "Id" contains no non-empty values');
  });
});

describe("generateXml", () => {
  const table: ParsedTable = {
    headers: ["Name", "Age", "Notes"],
    rows: [
      { Name: "O'Reilly & Sons", Age: 34, Notes: 'said "hi" <loudly>' },
      { Name: "Smith", Age: 28, Notes: "" },
    ],
    rowCount: 2,
  };

  it("escapes XML special characters in text nodes", () => {
    const xml = generateXml(table, { rootElement: "people", rowElement: "person" });

    expect(xml).toContain("<Name>O&apos;Reilly &amp; Sons</Name>");
    expect(xml).toContain("<Notes>said &quot;hi&quot; &lt;loudly&gt;</Notes>");
  });

  it("wraps rows in configurable root and row elements with a declaration", () => {
    const xml = generateXml(table, { rootElement: "people", rowElement: "person" });

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain("<people>");
    expect(xml).toContain("</people>");
    expect(xml).toContain("  <person>");
    expect(xml).toContain("    <Age>34</Age>");
  });

  it("renders empty values as self-closing tags and sanitizes invalid tag names", () => {
    const tricky: ParsedTable = {
      headers: ["First Name", "2024 Total"],
      rows: [{ "First Name": "Smith", "2024 Total": "" }],
      rowCount: 1,
    };
    const xml = generateXml(tricky, { rootElement: "root", rowElement: "row" });

    expect(xml).toContain("<First_Name>Smith</First_Name>");
    expect(xml).toContain("<_2024_Total />");
  });
});

describe("generateJson", () => {
  const table: ParsedTable = {
    headers: ["Name", "Age"],
    rows: [{ Name: "O'Reilly", Age: "34" }],
    rowCount: 1,
  };

  it("formats pretty-printed JSON by default", () => {
    const json = generateJson(table);

    expect(json).toBe('[\n  {\n    "Name": "O\'Reilly",\n    "Age": "34"\n  }\n]');
  });

  it("supports minified output", () => {
    const json = generateJson(table, { minified: true });

    expect(json).toBe('[{"Name":"O\'Reilly","Age":"34"}]');
  });
});
