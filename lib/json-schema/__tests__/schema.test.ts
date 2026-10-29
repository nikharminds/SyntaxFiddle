import { describe, expect, it } from "vitest";
import {
  generateSchema,
  inferJson,
  isIso8601,
  toCamelCase,
  toPascalCase,
  toSnakeCase,
} from "../index";

const SAMPLE = JSON.stringify({
  id: 1,
  user_name: "harshal",
  "created-at": "2024-01-15T10:30:00Z",
  is_active: true,
  score: 3.14,
  tags: ["a", "b"],
  mixed: [1, "a", true, null],
  friends: [
    { id: 2, display_name: "Bob" },
    { id: 3, email: "x@y.z" },
  ],
  meta: { "nested-key": { deep: [[1, 2], ["a"]] } },
  empty_arr: [],
  nothing: null,
});

describe("casing", () => {
  it("splits and re-joins key styles", () => {
    expect(toCamelCase("user_name")).toBe("userName");
    expect(toCamelCase("created-at")).toBe("createdAt");
    expect(toCamelCase("userID")).toBe("userID");
    expect(toCamelCase("HTTPServer")).toBe("httpServer");
    expect(toPascalCase("user_name")).toBe("UserName");
    expect(toSnakeCase("createdAt")).toBe("created_at");
    expect(toSnakeCase("created-at")).toBe("created_at");
  });
});

describe("inference engine", () => {
  it("merges mixed arrays into unions", () => {
    const def = inferJson('[1, "a"]');
    expect(def).toEqual({
      kind: "array",
      items: { kind: "union", variants: [{ kind: "integer" }, { kind: "string" }] },
    });
  });

  it("deduplicates identical array element types", () => {
    const def = inferJson("[1, 2, 3]");
    expect(def).toEqual({ kind: "array", items: { kind: "integer" } });
  });

  it("merges objects across arrays and marks missing keys optional", () => {
    const def = inferJson('[{"a": 1}, {"b": "x"}]');
    expect(def).toMatchObject({
      kind: "array",
      items: {
        kind: "object",
        properties: [
          { originalKey: "a", key: "a", optional: true, type: { kind: "integer" } },
          { originalKey: "b", key: "b", optional: true, type: { kind: "string" } },
        ],
      },
    });
  });

  it("types whole numbers as integer and widens on fractional evidence", () => {
    expect(inferJson('{"id": 1}')).toMatchObject({
      kind: "object",
      properties: [
        { originalKey: "id", key: "id", optional: false, type: { kind: "integer" } },
      ],
    });
    expect(inferJson("[1, 2.5]")).toEqual({ kind: "array", items: { kind: "number" } });
    expect(inferJson("[2.5, 1]")).toEqual({ kind: "array", items: { kind: "number" } });
    expect(inferJson("3.14")).toEqual({ kind: "number" });
  });

  it("detects ISO 8601 strings as dates and rejects lookalikes", () => {
    expect(isIso8601("2024-01-15")).toBe(true);
    expect(isIso8601("2024-01-15T10:30:00Z")).toBe(true);
    expect(isIso8601("2024-01-15T10:30:00+05:30")).toBe(true);
    expect(isIso8601("2024-13-01")).toBe(false);
    expect(isIso8601("not a date")).toBe(false);
    expect(isIso8601("12345")).toBe(false);
  });

  it("collapses date+string unions into string", () => {
    const def = inferJson('["2024-01-15T10:30:00Z", "hello"]');
    expect(def).toEqual({ kind: "array", items: { kind: "string" } });
  });

  it("merges nested arrays element-wise", () => {
    const def = inferJson("[[1, 2], [\"a\"]]");
    expect(def).toEqual({
      kind: "array",
      items: {
        kind: "array",
        items: { kind: "union", variants: [{ kind: "integer" }, { kind: "string" }] },
      },
    });
  });

  it("throws a typed error on invalid JSON", () => {
    expect(() => inferJson("{nope")).toThrowError(/Unable to parse JSON input/);
    expect(() => generateSchema("{nope", "zod")).toThrowError(
      /Unable to parse JSON input/,
    );
  });
});

describe("zod generator", () => {
  it("emits a parseable schema with raw keys, ints, and dates by default", () => {
    const code = generateSchema(SAMPLE, "zod", "user-profile");
    expect(code).toContain('import { z } from "zod";');
    expect(code).toContain("export const UserProfileSchema = z.object({");
    expect(code).toContain("id: z.number().int(),");
    expect(code).toContain("user_name: z.string(),");
    expect(code).toContain('"created-at": z.coerce.date(),');
    expect(code).toContain("score: z.number(),");
    expect(code).not.toContain(".transform(");
    expect(code).toContain("z.array(z.unknown())");
    expect(code).toContain(".nullable()");
    expect(code).toContain("display_name: z.string().optional()");
  });

  it("chains a camelCase .transform() only when key renaming is enabled", () => {
    const code = generateSchema(SAMPLE, "zod", "user-profile", {
      keyCasing: "camel",
    });
    expect(code).toContain("userName: v.user_name,");
    expect(code).toContain("createdAt: v[\"created-at\"],");
  });

  it("handles top-level primitives and null-only unions", () => {
    expect(generateSchema("42", "zod")).toContain(
      "export const RootSchema = z.number().int();",
    );
    expect(generateSchema("3.5", "zod")).toContain(
      "export const RootSchema = z.number();",
    );
    expect(generateSchema("[null]", "zod")).toContain("z.array(z.null())");
  });
});

describe("typescript generator", () => {
  it("preserves wire keys by default so types match res.json()", () => {
    const code = generateSchema(SAMPLE, "ts", "user-profile");
    expect(code).toContain("export interface UserProfile {");
    expect(code).toContain("  user_name: string;");
    expect(code).toContain('  "created-at": string;');
    expect(code).toContain("  mixed: (number | string | boolean | null)[];");
    expect(code).toContain("  email?: string;");
    expect(code).toContain("  empty_arr: unknown[];");
    expect(code).toContain("  nothing: null;");
    expect(code).not.toContain("KeyMap");
  });

  it("renames keys to camelCase with a KeyMap when camel mode is on", () => {
    const code = generateSchema(SAMPLE, "ts", "user-profile", {
      keyCasing: "camel",
    });
    expect(code).toContain("  userName: string;");
    expect(code).toContain("  createdAt: string;");
    expect(code).toContain("  emptyArr: unknown[];");
    expect(code).toContain("export const UserProfileKeyMap = {");
    expect(code).toContain('userName: "user_name",');
  });

  it("handles top-level arrays and empty objects", () => {
    expect(generateSchema('[1, "a"]', "ts")).toContain(
      "export type Root = (number | string)[];",
    );
    expect(generateSchema("{}", "ts")).toContain("export interface Root {}");
  });
});

describe("pydantic generator", () => {
  it("emits models with aliases, optionals, ints, and datetimes", () => {
    const code = generateSchema(SAMPLE, "pydantic", "user-profile");
    expect(code).toContain("class UserProfile(BaseModel):");
    expect(code).toContain("id: int");
    expect(code).toContain("user_name: str");
    expect(code).toContain('created_at: datetime = Field(alias="created-at")');
    expect(code).toContain("model_config = ConfigDict(populate_by_name=True)");
    expect(code).toContain("display_name: Optional[str] = None");
    expect(code).toContain("mixed: List[Optional[Union[int, str, bool]]]");
    expect(code).toContain("nothing: Any");
  });
});

describe("go generator", () => {
  it("emits structs with json tags, int64 for whole numbers, and time.Time", () => {
    const code = generateSchema(SAMPLE, "go", "user-profile");
    expect(code).toContain('import "time"');
    expect(code).toContain("type UserProfile struct {");
    expect(code).toMatch(/Id\s+int64\s+`json:"id"`/);
    expect(code).toMatch(/Score\s+float64\s+`json:"score"`/);
    expect(code).toMatch(/UserName\s+string\s+`json:"user_name"`/);
    expect(code).toMatch(/CreatedAt\s+time\.Time\s+`json:"created-at"`/);
    expect(code).toContain("[]UserProfileFriendsItem");
    expect(code).toMatch(/Email\s+\*string\s+`json:"email,omitempty"`/);
    expect(code).toContain("[]any");
  });

  it("types every-whole-number fields as int64 in Go and int in Pydantic", () => {
    const raw = '{"id": 42, "count": 7, "ratio": 0.5}';
    const goCode = generateSchema(raw, "go");
    expect(goCode).toMatch(/Id\s+int64\s+`json:"id"`/);
    expect(goCode).toMatch(/Count\s+int64\s+`json:"count"`/);
    expect(goCode).toMatch(/Ratio\s+float64\s+`json:"ratio"`/);
    const pyCode = generateSchema(raw, "pydantic");
    expect(pyCode).toContain("id: int");
    expect(pyCode).toContain("count: int");
    expect(pyCode).toContain("ratio: float");
  });
});
