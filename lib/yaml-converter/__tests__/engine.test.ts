import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { parseExcel, parseJsonTable } from "../../converter/parsers";
import { generateYaml } from "../../converter/generators";

/**
 * Unit tests for the two YAML converters:
 *
 * - JSON to YAML: parseJsonTable carries the original JSON tree on
 *   ParsedTable.sourceJson, and generateYaml renders it structure-preserving
 *   block YAML (nested objects -> nested mappings, arrays -> block sequences).
 * - Excel to YAML: parseExcel decodes a real workbook buffer into a table,
 *   and generateYaml renders each row as a list item mapping (headers as
 *   keys, cells as honestly quoted scalars).
 */

describe("json -> yaml engine", () => {
  it("converts a deeply nested JSON object with structure preserved", () => {
    const json = JSON.stringify({
      app: {
        db: {
          primary: { host: "db-1", port: 5432, tags: ["primary", "fast"] },
          replicas: [
            { name: "rep-1", port: 5433 },
            { name: "rep-2", port: 5434 },
          ],
        },
        cache: null,
      },
    });

    const yaml = generateYaml(parseJsonTable(json));

    expect(yaml).toBe(
      [
        "app:",
        "  db:",
        "    primary:",
        "      host: db-1",
        "      port: 5432",
        "      tags:",
        "        - primary",
        "        - fast",
        "    replicas:",
        "      - name: rep-1",
        "        port: 5433",
        "      - name: rep-2",
        "        port: 5434",
        "  cache: null",
      ].join("\n"),
    );
  });

  it("throws a descriptive error for invalid JSON input", () => {
    expect(() => parseJsonTable("{ not json")).toThrow(/Invalid JSON/);
    expect(() => parseJsonTable("")).toThrow(
      /The pasted JSON appears to be empty/,
    );
  });
});

describe("excel -> yaml engine", () => {
  it("converts a minimal Excel workbook buffer to a YAML list of objects", async () => {
    // Minimal fixture: a real .xlsx built in-memory (Sheet1 with typed cells),
    // handed to the converter as an ArrayBuffer exactly like a file drop.
    const sheet = XLSX.utils.aoa_to_sheet([
      ["Id", "Name", "Port", "Active"],
      ["001", "acme", 8080, true],
      ["002", "globex", 8081, false],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Services");
    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    }) as Buffer;
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ) as ArrayBuffer;

    const table = await parseExcel(arrayBuffer);
    expect(table.headers).toEqual(["Id", "Name", "Port", "Active"]);

    const yaml = generateYaml(table);
    expect(yaml).toBe(
      [
        // "001" is Text in the sheet: quoted so YAML cannot coerce it to a
        // number. Native types stay bare: Port (numeric) and Active (boolean).
        '- Id: "001"',
        "  Name: acme",
        "  Port: 8080",
        "  Active: true",
        '- Id: "002"',
        "  Name: globex",
        "  Port: 8081",
        "  Active: false",
      ].join("\n"),
    );
  });
});
