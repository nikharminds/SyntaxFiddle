import { toCamelCase } from "./casing";

export interface StringTypeDef {
  readonly kind: "string";
}

export interface NumberTypeDef {
  readonly kind: "number";
}

export interface BooleanTypeDef {
  readonly kind: "boolean";
}

export interface NullTypeDef {
  readonly kind: "null";
}

export interface DateTypeDef {
  readonly kind: "date";
}

export interface ObjectPropertyDef {
  readonly originalKey: string;
  readonly key: string;
  readonly type: TypeDef;
  readonly optional: boolean;
}

export interface ObjectTypeDef {
  readonly kind: "object";
  readonly properties: readonly ObjectPropertyDef[];
}

export interface ArrayTypeDef {
  readonly kind: "array";
  readonly items: TypeDef;
}

export interface UnionTypeDef {
  readonly kind: "union";
  readonly variants: readonly TypeDef[];
}

export type TypeDef =
  | StringTypeDef
  | NumberTypeDef
  | BooleanTypeDef
  | NullTypeDef
  | DateTypeDef
  | ObjectTypeDef
  | ArrayTypeDef
  | UnionTypeDef;

export class JsonSchemaInferenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JsonSchemaInferenceError";
  }
}

export const MAX_INFERENCE_DEPTH = 32;

export function isJsonSchemaInferenceError(
  error: unknown,
): error is JsonSchemaInferenceError {
  return error instanceof Error && error.name === "JsonSchemaInferenceError";
}

const ISO_8601_PATTERN =
  /^\d{4}-\d{2}-\d{2}(?:[Tt]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:[Zz]|[+-]\d{2}:?\d{2})?)?$/;

export function isIso8601(value: string): boolean {
  if (!ISO_8601_PATTERN.test(value)) return false;
  return !Number.isNaN(Date.parse(value));
}

export function typeKey(def: TypeDef): string {
  switch (def.kind) {
    case "string":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "null":
      return "null";
    case "date":
      return "date";
    case "object":
      return `object{${def.properties
        .map(
          (property) =>
            `${property.optional ? "?" : ""}${JSON.stringify(property.originalKey)}:${typeKey(property.type)}`,
        )
        .sort()
        .join(",")}}`;
    case "array":
      return `array<${typeKey(def.items)}>`;
    case "union":
      return def.variants
        .map(typeKey)
        .sort()
        .join("|");
  }
}

function sanitizeCamelKey(key: string): string {
  if (key === "") return "_";
  if (/^[0-9]/.test(key)) return `_${key}`;
  return key;
}

function inferObject(value: Record<string, unknown>, depth: number): ObjectTypeDef {
  const properties: ObjectPropertyDef[] = [];
  const usedKeys = new Set<string>();
  for (const [originalKey, propertyValue] of Object.entries(value)) {
    let key = sanitizeCamelKey(toCamelCase(originalKey));
    if (usedKeys.has(key)) {
      let suffix = 2;
      while (usedKeys.has(`${key}_${suffix}`)) suffix++;
      key = `${key}_${suffix}`;
    }
    usedKeys.add(key);
    properties.push({
      originalKey,
      key,
      type: inferValue(propertyValue, depth + 1),
      optional: false,
    });
  }
  return { kind: "object", properties };
}

function inferArrayItems(items: readonly unknown[], depth: number): TypeDef {
  if (items.length === 0) return { kind: "union", variants: [] };
  let accumulator = inferValue(items[0] as unknown, depth + 1);
  for (let i = 1; i < items.length; i++) {
    accumulator = mergeTypes(
      accumulator,
      inferValue(items[i] as unknown, depth + 1),
    );
  }
  return accumulator;
}

function inferValue(value: unknown, depth: number): TypeDef {
  if (depth > MAX_INFERENCE_DEPTH) {
    throw new JsonSchemaInferenceError(
      `JSON exceeds the maximum supported nesting depth of ${MAX_INFERENCE_DEPTH} levels — split the payload or flatten its deepest structures and try again.`,
    );
  }
  if (value === null) return { kind: "null" };
  switch (typeof value) {
    case "boolean":
      return { kind: "boolean" };
    case "number":
      return { kind: "number" };
    case "string":
      return isIso8601(value) ? { kind: "date" } : { kind: "string" };
    case "object":
      if (Array.isArray(value)) {
        return { kind: "array", items: inferArrayItems(value, depth) };
      }
      return inferObject(value as Record<string, unknown>, depth);
    default:
      throw new JsonSchemaInferenceError(
        `Unsupported value of type "${typeof value}" in JSON input.`,
      );
  }
}

export function inferJson(raw: string): TypeDef {
  if (typeof raw !== "string") {
    throw new JsonSchemaInferenceError(
      "Input must be a raw JSON string to parse and infer.",
    );
  }
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new JsonSchemaInferenceError(`Unable to parse JSON input: ${reason}`);
  }
  return inferValue(value, 0);
}

function unfold(def: TypeDef): readonly TypeDef[] {
  return def.kind === "union" ? def.variants : [def];
}

function makeUnion(variants: readonly TypeDef[]): TypeDef {
  const unique: TypeDef[] = [];
  for (const variant of variants) {
    if (!unique.some((existing) => typeKey(existing) === typeKey(variant))) {
      unique.push(variant);
    }
  }
  if (unique.some((variant) => variant.kind === "string")) {
    for (let i = unique.length - 1; i >= 0; i--) {
      if ((unique[i] as TypeDef).kind === "date") unique.splice(i, 1);
    }
  }
  if (unique.length === 1) return unique[0] as TypeDef;
  return { kind: "union", variants: unique };
}

function mergeObjects(a: ObjectTypeDef, b: ObjectTypeDef): ObjectTypeDef {
  const merged: ObjectPropertyDef[] = [];
  const byOriginalKey = new Map(
    b.properties.map((property) => [property.originalKey, property]),
  );
  const seen = new Set<string>();
  for (const left of a.properties) {
    seen.add(left.originalKey);
    const right = byOriginalKey.get(left.originalKey);
    if (!right) {
      merged.push({ ...left, optional: true });
      continue;
    }
    merged.push({
      ...left,
      type: mergeTypes(left.type, right.type),
      optional: left.optional || right.optional,
    });
  }
  for (const right of b.properties) {
    if (!seen.has(right.originalKey)) {
      merged.push({ ...right, optional: true });
    }
  }
  return { kind: "object", properties: merged };
}

function tryMerge(a: TypeDef, b: TypeDef): TypeDef | null {
  if (typeKey(a) === typeKey(b)) return a;
  if (a.kind === "object" && b.kind === "object") return mergeObjects(a, b);
  if (a.kind === "array" && b.kind === "array") {
    return { kind: "array", items: mergeTypes(a.items, b.items) };
  }
  if (
    (a.kind === "string" && b.kind === "date") ||
    (a.kind === "date" && b.kind === "string")
  ) {
    return { kind: "string" };
  }
  return null;
}

export function mergeTypes(a: TypeDef, b: TypeDef): TypeDef {
  const direct = tryMerge(a, b);
  if (direct) return direct;
  const accumulator: TypeDef[] = [];
  for (const variant of [...unfold(a), ...unfold(b)]) {
    let absorbed = false;
    for (let i = 0; i < accumulator.length; i++) {
      const combined = tryMerge(accumulator[i] as TypeDef, variant);
      if (combined) {
        accumulator[i] = combined;
        absorbed = true;
        break;
      }
    }
    if (!absorbed) accumulator.push(variant);
  }
  return makeUnion(accumulator);
}
