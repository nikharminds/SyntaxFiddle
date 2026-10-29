import { isIdentifier, toPascalCase } from "../casing";
import type { ObjectTypeDef, TypeDef, UnionTypeDef } from "../infer";
import { resolveKeyCasing } from "../options";
import type { SchemaOptions } from "../options";

function pad(level: number): string {
  return "  ".repeat(level);
}

function propertyKey(key: string): string {
  return isIdentifier(key) ? key : JSON.stringify(key);
}

function propertyAccess(receptor: string, key: string): string {
  return isIdentifier(key) ? `${receptor}.${key}` : `${receptor}[${JSON.stringify(key)}]`;
}

function objectExpression(
  def: ObjectTypeDef,
  level: number,
  renameToCamel: boolean,
): string {
  if (def.properties.length === 0) return "z.object({})";
  const propertyLines = def.properties.map((property) => {
    const value = expression(property.type, level + 1, renameToCamel);
    const optional = property.optional ? ".optional()" : "";
    return `${pad(level + 1)}${propertyKey(property.originalKey)}: ${value}${optional},`;
  });
  let result = `z.object({\n${propertyLines.join("\n")}\n${pad(level)}})`;
  if (
    renameToCamel &&
    def.properties.some((property) => property.key !== property.originalKey)
  ) {
    const mapped = def.properties
      .map(
        (property) =>
          `${pad(level + 1)}${property.key}: ${propertyAccess("v", property.originalKey)},`,
      )
      .join("\n");
    result += `\n${pad(level)}.transform((v) => ({\n${mapped}\n${pad(level)}}))`;
  }
  return result;
}

function expression(def: TypeDef, level: number, renameToCamel: boolean): string {
  switch (def.kind) {
    case "string":
      return "z.string()";
    case "number":
      return "z.number()";
    case "integer":
      return "z.number().int()";
    case "boolean":
      return "z.boolean()";
    case "null":
      return "z.null()";
    case "date":
      return "z.coerce.date()";
    case "array":
      return `z.array(${expression(def.items, level, renameToCamel)})`;
    case "union":
      return unionExpression(def, level, renameToCamel);
    case "object":
      return objectExpression(def, level, renameToCamel);
  }
}

function unionExpression(
  def: UnionTypeDef,
  level: number,
  renameToCamel: boolean,
): string {
  const nonNull = def.variants.filter((variant) => variant.kind !== "null");
  const hasNull = nonNull.length !== def.variants.length;
  if (nonNull.length === 0) {
    return hasNull ? "z.null()" : "z.unknown()";
  }
  const base =
    nonNull.length === 1
      ? expression(nonNull[0] as TypeDef, level, renameToCamel)
      : `z.union([\n${nonNull
          .map(
            (variant) =>
              `${pad(level + 1)}${expression(variant, level + 1, renameToCamel)},`,
          )
          .join("\n")}\n${pad(level)}])`;
  return hasNull ? `${base}.nullable()` : base;
}

export function generateZodSchema(
  def: TypeDef,
  rootName = "Root",
  options?: SchemaOptions,
): string {
  const renameToCamel = resolveKeyCasing(options) === "camel";
  const schemaName = `${toPascalCase(rootName) || "Root"}Schema`;
  return `import { z } from "zod";\n\nexport const ${schemaName} = ${expression(
    def,
    0,
    renameToCamel,
  )};\n`;
}
