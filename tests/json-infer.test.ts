import { describe, expect, it } from "vitest";
import {
  generateSchema,
  inferJson,
  isIso8601,
  JsonSchemaInferenceError,
  MAX_INFERENCE_DEPTH,
  toCamelCase,
} from "../lib/json-schema";
import type { SchemaOptions, TypeDef } from "../lib/json-schema";

const ts = (raw: string, rootName = "Root", options?: SchemaOptions): string =>
  generateSchema(raw, "ts", rootName, options);
const zod = (raw: string, rootName = "Root", options?: SchemaOptions): string =>
  generateSchema(raw, "zod", rootName, options);
const pydantic = (raw: string, rootName = "Root"): string =>
  generateSchema(raw, "pydantic", rootName);
const go = (raw: string, rootName = "Root"): string =>
  generateSchema(raw, "go", rootName);

function captureInferenceError(raw: string): JsonSchemaInferenceError {
  try {
    inferJson(raw);
  } catch (error) {
    if (error instanceof JsonSchemaInferenceError) return error;
    throw new Error(
      `Expected JsonSchemaInferenceError, got ${String(error)} instead`,
    );
  }
  throw new Error("Expected inferJson to throw, but it resolved");
}

function nestedArrays(depth: number, leaf = 1): string {
  return `${"[".repeat(depth)}${leaf}${"]".repeat(depth)}`;
}

function nestedObjects(depth: number): string {
  const leaf = '"end"';
  return `${'{"a":'.repeat(depth)}${leaf}${"}".repeat(depth)}`;
}

describe("deep recursive array merging", () => {
  it("merges mixed primitives into a deduplicated union", () => {
    const def = inferJson('[1, "string", true]');
    expect(def).toEqual({
      kind: "array",
      items: {
        kind: "union",
        variants: [
          { kind: "integer" },
          { kind: "string" },
          { kind: "boolean" },
        ],
      },
    });
    expect(ts('[1, "string", true]')).toBe(
      "export type Root = (number | string | boolean)[];\n",
    );
    const zodCode = zod('[1, "string", true]');
    expect(zodCode).toContain("z.union([");
    expect(zodCode).toContain("z.number().int()");
    expect(zodCode).toContain("z.string()");
    expect(zodCode).toContain("z.boolean()");
    expect(pydantic('[1, "string", true]')).toContain(
      "List[Union[int, str, bool]]",
    );
  });

  it("deduplicates homogeneous arrays to a single type", () => {
    const def = inferJson("[1, 2, 3]");
    expect(def).toEqual({ kind: "array", items: { kind: "integer" } });
    expect(ts("[1, 2, 3]")).toBe("export type Root = number[];\n");
  });

  it("merges divergent objects into one shape with optional fields", () => {
    const def = inferJson('[{ "a": 1 }, { "b": 2 }]');
    expect(def).toEqual({
      kind: "array",
      items: {
        kind: "object",
        properties: [
          { originalKey: "a", key: "a", type: { kind: "integer" }, optional: true },
          { originalKey: "b", key: "b", type: { kind: "integer" }, optional: true },
        ],
      },
    });
    const tsCode = ts('[{ "a": 1 }, { "b": 2 }]');
    expect(tsCode).toContain("a?: number;");
    expect(tsCode).toContain("b?: number;");
    expect(zod('[{ "a": 1 }, { "b": 2 }]')).toContain(
      "a: z.number().int().optional()",
    );
    expect(pydantic('[{ "a": 1 }, { "b": 2 }]')).toContain(
      "a: Optional[int] = None",
    );
    const goCode = go('[{ "a": 1 }, { "b": 2 }]');
    expect(goCode).toMatch(/A\s+\*int64\s+`json:"a,omitempty"`/);
  });

  it("keeps shared fields required when merging object arrays", () => {
    const tsCode = ts('[{ "id": 1, "a": 0 }, { "id": 2, "b": 3 }]');
    expect(tsCode).toMatch(/^ {2}id: number;$/m);
    expect(tsCode).toContain("a?: number;");
    expect(tsCode).toContain("b?: number;");
  });

  it("folds conflicting field types into unions", () => {
    const tsCode = ts('[{ "a": 1 }, { "a": "s" }]');
    expect(tsCode).toContain("a: number | string;");
  });

  it("merges nested arrays element-wise", () => {
    const def = inferJson('[[1, 2], ["a", "b"]]');
    expect(def).toEqual({
      kind: "array",
      items: {
        kind: "array",
        items: {
          kind: "union",
          variants: [{ kind: "integer" }, { kind: "string" }],
        },
      },
    });
    expect(ts('[[1, 2], ["a", "b"]]')).toBe(
      "export type Root = (number | string)[][];\n",
    );
    const zodCode = zod('[[1, 2], ["a", "b"]]');
    expect(zodCode).toContain("z.array(z.array(z.union([");
  });

  it("merges object trees recursively across array elements", () => {
    const tsCode = ts('[{"a": [{"b": 1}]}, {"a": [{"c": "x"}]}]');
    expect(tsCode).toContain("a: RootItemAItem[];");
    expect(tsCode).toContain("b?: number;");
    expect(tsCode).toContain("c?: string;");
  });
});

describe("primitives, null, and ISO 8601 dates", () => {
  it("maps null per target: z.null() / null / Any / any", () => {
    expect(zod("null")).toContain("export const RootSchema = z.null();");
    expect(ts("null")).toBe("export type Root = null;\n");
    expect(pydantic("null")).toContain("Root = Any");
    expect(go("null")).toContain("type Root = any");
  });

  it("wraps nullable unions per target", () => {
    expect(zod("[1, null]")).toContain("z.number().int().nullable()");
    expect(ts("[1, null]")).toBe("export type Root = (number | null)[];\n");
    expect(pydantic("[1, null]")).toContain("List[Optional[int]]");
    expect(go("[1, null]")).toContain("[]*int64");
  });

  it("detects ISO 8601 strings and rejects lookalikes", () => {
    expect(isIso8601("2024-10-21T18:42:00Z")).toBe(true);
    expect(isIso8601("2024-10-21")).toBe(true);
    expect(isIso8601("2024-10-21T18:42:00+05:30")).toBe(true);
    expect(isIso8601("2024-10-21T18:42:00.123Z")).toBe(true);
    expect(isIso8601("2024-13-01")).toBe(false);
    expect(isIso8601("42")).toBe(false);
    expect(isIso8601("not a date")).toBe(false);
    expect(isIso8601("18:42:00")).toBe(false);
  });

  it("infers ISO dates as runtime Date types (z.coerce.date / datetime / time.Time) and honest TS strings", () => {
    const raw = '{"created_at": "2024-10-21T18:42:00Z"}';
    const zodCode = zod(raw);
    expect(zodCode).toContain("created_at: z.coerce.date()");
    expect(zodCode).not.toContain(".transform(");
    expect(zod(raw, "Root", { keyCasing: "camel" })).toContain(
      "createdAt: v.created_at",
    );
    expect(pydantic(raw)).toContain("created_at: datetime");
    const goCode = go(raw);
    expect(goCode).toContain('import "time"');
    expect(goCode).toMatch(/CreatedAt\s+time\.Time\s+`json:"created_at"`/);
    expect(ts(raw)).toContain("created_at: string;");
  });

  it("leaves non-ISO strings as plain strings", () => {
    expect(zod('{"note": "2024-ish"}')).toContain("note: z.string()");
    expect(pydantic('{"note": "2024-ish"}')).toContain("note: str");
  });

  it("maps top-level primitives for every target", () => {
    expect(zod("42")).toContain("z.number().int()");
    expect(zod("2.5")).toContain("export const RootSchema = z.number();");
    expect(zod('"hello"')).toContain("z.string()");
    expect(zod("true")).toContain("z.boolean()");
    expect(ts("42")).toBe("export type Root = number;\n");
    expect(go("42")).toContain("type Root = int64");
    expect(go("2.5")).toContain("type Root = float64");
    expect(pydantic("42")).toContain("Root = int");
    expect(pydantic("2.5")).toContain("Root = float");
  });

  it("emits unknown for empty arrays instead of guessing", () => {
    expect(zod("[]")).toContain("z.array(z.unknown())");
    expect(ts("[]")).toBe("export type Root = unknown[];\n");
    expect(pydantic("[]")).toContain("Root = List[Any]");
    expect(go("[]")).toContain("type Root = []any");
  });
});

describe("key casing and formatting", () => {
  it("preserves wire keys by default so TS types match res.json()", () => {
    const tsCode = ts('{"first-name": "Ada", "user age": 120}');
    expect(tsCode).toContain('"first-name": string;');
    expect(tsCode).toContain('"user age": number;');
    expect(tsCode).not.toContain("export const RootKeyMap");
  });

  it("camelCases hyphen and space keys for TS with a KeyMap when camel mode is on", () => {
    const tsCode = ts('{"first-name": "Ada", "user age": 120}', "Root", {
      keyCasing: "camel",
    });
    expect(tsCode).toContain("firstName: string;");
    expect(tsCode).toContain("userAge: number;");
    expect(tsCode).toContain("export const RootKeyMap = {");
    expect(tsCode).toContain('firstName: "first-name",');
    expect(tsCode).toContain('userAge: "user age",');
  });

  it("preserves original keys as Go json tags with PascalCase fields", () => {
    const goCode = go('{"first-name": "Ada", "user age": 120}');
    expect(goCode).toMatch(/FirstName\s+string\s+`json:"first-name"`/);
    expect(goCode).toMatch(/UserAge\s+int64\s+`json:"user age"`/);
  });

  it("validates raw keys in Zod by default and transforms them only in camel mode", () => {
    const preserveCode = zod('{"first-name": "Ada"}');
    expect(preserveCode).toContain('"first-name": z.string(),');
    expect(preserveCode).not.toContain(".transform(");
    const camelCode = zod('{"first-name": "Ada"}', "Root", {
      keyCasing: "camel",
    });
    expect(camelCode).toContain('"first-name": z.string(),');
    expect(camelCode).toContain('firstName: v["first-name"],');
  });

  it("aliases renamed keys in Pydantic with populate_by_name", () => {
    const pyCode = pydantic('{"first-name": "Ada", "user age": 120}');
    expect(pyCode).toContain('first_name: str = Field(alias="first-name")');
    expect(pyCode).toContain('user_age: int = Field(alias="user age")');
    expect(pyCode).toContain("model_config = ConfigDict(populate_by_name=True)");
  });

  it("keeps snake_case keys verbatim in TS/Zod and alias-free in Pydantic", () => {
    const raw = '{"created_at": "2024-10-21"}';
    expect(ts(raw)).toContain("created_at: string;");
    expect(zod(raw)).not.toContain(".transform(");
    expect(ts(raw, "Root", { keyCasing: "camel" })).toContain(
      "createdAt: string;",
    );
    expect(zod(raw, "Root", { keyCasing: "camel" })).toContain(
      "createdAt: v.created_at",
    );
    const pyCode = pydantic(raw);
    expect(pyCode).toContain("created_at: datetime");
    expect(pyCode).not.toContain("alias=");
  });

  it("disambiguates keys that collide after camelization", () => {
    const tsCode = ts('{"user_name": 1, "user-name": 2}', "Root", {
      keyCasing: "camel",
    });
    expect(tsCode).toContain("userName: number;");
    expect(tsCode).toContain("userName_2: number;");
    expect(tsCode).toContain('userName: "user_name",');
    expect(tsCode).toContain('userName_2: "user-name",');
  });

  it("quotes identifier-hostile keys verbatim in preserve mode and sanitizes them in camel mode", () => {
    expect(ts('{"123abc": "x"}')).toContain('"123abc": string;');
    expect(ts('{"123abc": "x"}', "Root", { keyCasing: "camel" })).toContain(
      "_123abc: string;",
    );
    expect(go('{"123abc": "x"}')).toMatch(/X123abc\s+string\s+`json:"123abc"`/);
  });

  it("splits camel, acronym, and separator boundaries correctly", () => {
    expect(toCamelCase("user_name")).toBe("userName");
    expect(toCamelCase("created-at")).toBe("createdAt");
    expect(toCamelCase("userID")).toBe("userID");
    expect(toCamelCase("HTTPServer")).toBe("httpServer");
    expect(toCamelCase("user age")).toBe("userAge");
  });
});

describe("watchdog hardening: recursion depth limit", () => {
  it("allows nesting up to the documented limit", () => {
    expect(() => inferJson(nestedArrays(MAX_INFERENCE_DEPTH))).not.toThrow();
    expect(ts(nestedArrays(MAX_INFERENCE_DEPTH))).toContain("number");
  });

  it("throws a clean typed error past the depth limit (50 levels)", () => {
    const error = captureInferenceError(nestedArrays(50));
    expect(error.name).toBe("JsonSchemaInferenceError");
    expect(error.message).toMatch(/nesting depth/i);
    expect(error.message).not.toMatch(/call stack/i);
  });

  it("throws a clean typed error for object nesting past the limit", () => {
    const error = captureInferenceError(nestedObjects(50));
    expect(error).toBeInstanceOf(JsonSchemaInferenceError);
    expect(error.message).toMatch(/nesting depth/i);
  });

  it("survives a 5000-level payload without a V8 stack overflow escaping", () => {
    const error = captureInferenceError(nestedArrays(5000));
    expect(error).toBeInstanceOf(JsonSchemaInferenceError);
    expect(error.message).not.toMatch(/Maximum call stack/);
  });

  it("bubbles the depth error through generateSchema for every target", () => {
    for (const target of ["zod", "ts", "pydantic", "go"] as const) {
      expect(() => generateSchema(nestedArrays(50), target)).toThrowError(
        JsonSchemaInferenceError,
      );
    }
  });

  it("reports malformed JSON as a clean parse error with the engine reason", () => {
    const error = captureInferenceError("{invalid");
    expect(error.message).toMatch(/Unable to parse JSON input/);
  });
});

describe("inference engine public surface", () => {
  it("round-trips every target for a representative payload", (): void => {
    const raw = JSON.stringify({
      id: 7,
      "display-name": "Ada",
      joined: "2024-10-21T18:42:00Z",
      tags: ["math", "pioneer"],
      friends: [{ id: 1, email: null }, { id: 2, email: "x@y.z" }],
    });
    const targets = ["zod", "ts", "pydantic", "go"] as const;
    for (const target of targets) {
      const code = generateSchema(raw, target, "person");
      expect(code.length).toBeGreaterThan(40);
    }
    const zodCode = zod(raw, "person");
    expect(zodCode).toContain("export const PersonSchema = z.object({");
    expect(ts(raw, "person")).toContain("export interface Person {");
    expect(pydantic(raw, "person")).toContain("class PersonFriendsItem(BaseModel):");
    expect(go(raw, "person")).toContain("type Person struct {");
  });

  it("exposes a structural type key for deduplication", (): TypeDef => inferJson("1"));
});
