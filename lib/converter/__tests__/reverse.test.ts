import { describe, expect, it } from "vitest";
import { parseJsonTable, parseSqlInserts } from "../parsers";
import { generateCsv, generateMarkdown, generateYaml, runConversion } from "../generators";
import { CONVERSION_PAIRS, getConversionPair } from "../routes";

describe("json table parser", () => {
  it("parses an array of objects", () => {
    const table = parseJsonTable('[{"a": 1, "b": "x"}, {"a": 2, "b": "y"}]');
    expect(table.headers).toEqual(["a", "b"]);
    expect(table.rowCount).toBe(2);
    expect(table.rows[0]).toEqual({ a: 1, b: "x" });
  });

  it("flattens nested objects with dot paths and stringifies arrays", () => {
    const table = parseJsonTable('[{"user": {"name": "Ada"}, "tags": ["a", "b"]}]');
    expect(table.headers).toEqual(["user.name", "tags"]);
    expect(table.rows[0]!["user.name"]).toBe("Ada");
    expect(table.rows[0]!["tags"]).toBe('["a","b"]');
  });

  it("fills missing keys across sparse records", () => {
    const table = parseJsonTable('[{"a": 1}, {"b": 2}]');
    expect(table.headers).toEqual(["a", "b"]);
    expect(table.rows[0]!["b"]).toBe("");
    expect(table.rows[1]!["a"]).toBe("");
  });

  it("handles object-of-arrays and single-object shapes", () => {
    const columns = parseJsonTable('{"x": [1, 2], "y": ["a", "b"]}');
    expect(columns.headers).toEqual(["x", "y"]);
    expect(columns.rowCount).toBe(2);
    const single = parseJsonTable('{"name": "Ada"}');
    expect(single.rowCount).toBe(1);
  });

  it("rejects invalid and unsupported shapes", () => {
    expect(() => parseJsonTable("not json")).toThrow(/Invalid JSON/);
    expect(() => parseJsonTable("42")).toThrow(/Unsupported JSON shape/);
  });
});

describe("sql inserts parser", () => {
  it("parses multi-row inserts with a column list", () => {
    const sql = "INSERT INTO users (id, name) VALUES (1, 'Ada'), (2, 'Grace');";
    const table = parseSqlInserts(sql);
    expect(table.headers).toEqual(["id", "name"]);
    expect(table.rowCount).toBe(2);
    expect(table.rows[1]!["name"]).toBe("Grace");
  });

  it("un-escapes doubled quotes and maps NULL/booleans", () => {
    const sql = `INSERT INTO t (a, b, c, d) VALUES ('O''Brien', NULL, TRUE, FALSE);`;
    const table = parseSqlInserts(sql);
    expect(table.rows[0]!["a"]).toBe("O'Brien");
    expect(table.rows[0]!["b"]).toBe("");
    expect(table.rows[0]!["c"]).toBe(true);
    expect(table.rows[0]!["d"]).toBe(false);
  });

  it("merges multiple statements and accepts quoted identifiers", () => {
    const sql = [
      'INSERT INTO "my table" ("Col A", `col_b`) VALUES (1, 2);',
      "INSERT INTO ignored (\"Col A\", col_b) VALUES (3, 4);",
    ].join("\n");
    const table = parseSqlInserts(sql);
    expect(table.headers).toEqual(["Col A", "col_b"]);
    expect(table.rowCount).toBe(2);
  });

  it("infers positional columns when the list is missing", () => {
    const table = parseSqlInserts("INSERT INTO t VALUES (10, 'x'), (20, 'y');");
    expect(table.headers).toEqual(["column_1", "column_2"]);
    expect(table.rowCount).toBe(2);
  });

  it("rejects selects and placeholder statements", () => {
    expect(() => parseSqlInserts("SELECT * FROM users;")).toThrow(/No INSERT/);
    expect(() => parseSqlInserts("INSERT INTO t (a) VALUES (?);")).not.toThrow();
  });
});

describe("csv / markdown / yaml generators", () => {
  const table = {
    headers: ["Name", "Score", "Note"],
    rows: [
      { Name: "Ada, Lovelace", Score: 99, Note: "first | one" },
      { Name: "Grace", Score: 95, Note: "" },
    ],
    rowCount: 2,
  };

  it("generates RFC 4180-quoted CSV", () => {
    const csv = generateCsv(table);
    expect(csv.split("\n")[0]).toBe("Name,Score,Note");
    expect(csv).toContain('"Ada, Lovelace",99,first | one');
  });

  it("supports alternative delimiters", () => {
    const tsv = generateCsv(table, { delimiter: "\t" });
    expect(tsv).toContain("Ada, Lovelace\t99\tfirst | one");
  });

  it("generates GFM markdown with escaped pipes and right-aligned numerics", () => {
    const md = generateMarkdown(table);
    expect(md.split("\n")[0]).toBe("| Name | Score | Note |");
    expect(md).toContain("| --- | ---: | --- |");
    expect(md).toContain("first \\| one");
  });

  it("can disable numeric alignment", () => {
    const md = generateMarkdown(table, { alignNumbers: false });
    expect(md).toContain("| --- | --- | --- |");
  });

  it("generates block YAML with honest scalar quoting and every header keyed", () => {
    const t = {
      headers: ["name", "on", "port"],
      rows: [{ name: "yes-quote me", on: true, port: "8080" }],
      rowCount: 1,
    };
    const yaml = generateYaml(t);
    expect(yaml.split("\n")[0]).toBe('- name: "yes-quote me"');
    // "on" is quoted as a key: YAML 1.1 loaders (PyYAML) would otherwise
    // resolve it as a boolean.
    expect(yaml).toContain('  "on": true');
    expect(yaml).toContain('  port: "8080"');
  });

  it("quotes empty cells in YAML to distinguish them from null", () => {
    const yaml = generateYaml({
      headers: ["a"],
      rows: [{ a: "" }],
      rowCount: 1,
    });
    expect(yaml).toBe('- a: ""');
  });

  it("preserves JSON structure: single object becomes a block mapping", () => {
    const yaml = generateYaml(
      parseJsonTable('{"database": {"host": "localhost", "port": 5432}, "replicas": 3}'),
    );
    expect(yaml).toBe("database:\n  host: localhost\n  port: 5432\nreplicas: 3");
  });

  it("preserves JSON structure: arrays of objects become block sequences", () => {
    const yaml = generateYaml(
      parseJsonTable('[{"name": "Ada", "tags": ["admin"]}, {"name": "Grace"}]'),
    );
    expect(yaml.split("\n")).toEqual([
      "- name: Ada",
      "  tags:",
      "    - admin",
      "- name: Grace",
    ]);
  });

  it("quotes YAML-ambiguous JSON strings and translates null honestly", () => {
    const yaml = generateYaml(
      parseJsonTable('[{"flag": "on", "code": "8080", "empty": "", "gone": null, "ok": true}]'),
    );
    expect(yaml).toContain('flag: "on"');
    expect(yaml).toContain('code: "8080"');
    expect(yaml).toContain('empty: ""');
    expect(yaml).toContain("gone: null");
    expect(yaml).toContain("ok: true");
  });

  it("converts tabular JSON shapes through the table path with headers as keys", () => {
    const arrayOfArrays = generateYaml(parseJsonTable('[["Name", "Age"], ["Ada", 36]]'));
    expect(arrayOfArrays.split("\n")[0]).toBe("- Name: Ada");
    expect(arrayOfArrays).toContain("  Age: 36");

    const columnArrays = generateYaml(parseJsonTable('{"x": [1, 2], "y": ["a", "b"]}'));
    expect(columnArrays.split("\n")[0]).toBe("- x: 1");
    expect(columnArrays).toContain("  y: b");
  });

  it("renders empty JSON collections inline and quotes unsafe keys", () => {
    const yaml = generateYaml(
      parseJsonTable('{"items": [], "meta": {}, "weird key: x": "v"}'),
    );
    expect(yaml).toContain("items: []");
    expect(yaml).toContain("meta: {}");
    expect(yaml).toContain('"weird key: x": v');
  });
});

describe("reverse conversion routes", () => {
  it("registers the reverse pairs with landing metadata", () => {
    for (const slug of [
      "json-to-csv",
      "sql-to-csv",
      "csv-to-markdown",
      "csv-to-yaml",
      "json-to-yaml",
    ]) {
      const pair = getConversionPair(slug);
      expect(pair, slug).toBeDefined();
      expect(pair!.title.length, slug).toBeGreaterThan(10);
      expect(pair!.faqs.length, slug).toBeGreaterThanOrEqual(5);
    }
    expect(CONVERSION_PAIRS.length).toBe(20);
    for (const slug of ["xml-to-json", "xml-to-csv", "xml-to-excel", "json-to-excel", "sql-to-excel"]) {
      expect(getConversionPair(slug), slug).toBeDefined();
    }
    for (const slug of ["excel-to-markdown", "excel-to-yaml"]) {
      expect(getConversionPair(slug), slug).toBeDefined();
    }
  });

  it("round-trips: JSON -> SQL -> CSV preserves rows", () => {
    const json = JSON.stringify([
      { id: 1, name: "Ada" },
      { id: 2, name: "Grace" },
    ]);
    const parsed = parseJsonTable(json);
    const sql = runConversion(parsed, {
      target: "sql",
      options: { tableName: "t", dropTable: false },
    });
    const back = parseSqlInserts(sql);
    expect(back.rowCount).toBe(2);
    expect(back.rows[1]!["name"]).toBe("Grace");
    const csv = generateCsv(back);
    expect(csv).toContain("2,Grace");
  });
});
