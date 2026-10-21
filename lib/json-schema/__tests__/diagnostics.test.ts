import { describe, expect, it } from "vitest";
import { diagnoseFromMessage, diagnoseJsonSyntax } from "../diagnostics";

describe("diagnoseJsonSyntax", () => {
  it("returns null for valid JSON", () => {
    expect(diagnoseJsonSyntax('{"a": [1, 2, {"b": null}]}')).toBeNull();
  });

  it("locates a missing comma on the correct line and column", () => {
    const diagnostic = diagnoseJsonSyntax(
      '{\n  "id": 1,\n  "name": "Ada" "role": "admin"\n}',
    );
    expect(diagnostic).not.toBeNull();
    expect(diagnostic?.line).toBe(3);
    expect(diagnostic?.column).toBeGreaterThan(1);
    expect(diagnostic?.message).toContain("Missing comma");
  });

  it("explains single-quoted keys", () => {
    const diagnostic = diagnoseJsonSyntax("{'a': 1}");
    expect(diagnostic?.message).toContain("double-quoted");
  });

  it("explains truncated JSON", () => {
    const diagnostic = diagnoseJsonSyntax('{"a": [1, 2');
    expect(diagnostic?.message).toContain("cut off");
  });

  it("explains trailing commas", () => {
    const diagnostic = diagnoseJsonSyntax("[1, 2,]");
    expect(diagnostic?.message).toContain("Trailing commas");
  });

  it("handles error on the final line of a tall document", () => {
    const lines = Array.from({ length: 43 }, (_, i) => `  "key${i}": ${i},`);
    const raw = `{\n${lines.join("\n")}\n  "oops" 42\n}`;
    const diagnostic = diagnoseJsonSyntax(raw);
    expect(diagnostic?.line).toBe(45);
  });
});

describe("diagnoseFromMessage engine compatibility", () => {
  it("uses line/column directly from Firefox-style messages", () => {
    const diagnostic = diagnoseFromMessage(
      '{"a": 1}',
      "JSON.parse: unexpected character at line 3 column 5 of the JSON data",
    );
    expect(diagnostic.line).toBe(3);
    expect(diagnostic.column).toBe(5);
  });

  it("falls back to a generic hint without location info", () => {
    const diagnostic = diagnoseFromMessage("{}", "something novel exploded");
    expect(diagnostic.line).toBeNull();
    expect(diagnostic.column).toBeNull();
    expect(diagnostic.message).toBe("Invalid JSON syntax");
  });
});
