import { isIdentifier, toPascalCase } from "../casing";
import type { ObjectTypeDef, TypeDef, UnionTypeDef } from "../infer";

function pad(level: number): string {
  return "  ".repeat(level);
}

function propertyKey(key: string): string {
  return isIdentifier(key) ? key : JSON.stringify(key);
}

function propertyAccess(receptor: string, key: string): string {
  return isIdentifier(key) ? `${receptor}.${key}` : `${receptor}[${JSON.stringify(key)}]`;
}

function unionExpression(def: UnionTypeDef, level: number): string {
  const nonNull = def.variants.filter((variant) => variant.kind !== "null");
  const hasNull = nonNull.length !== def.variants.length;
  if (nonNull.length === 0) {
    return hasNull ? "z.null()" : "z.unknown()";
  }
  const base =
    nonNull.length === 1
      ? expression(nonNull[0] as TypeDef, level)
      : `z.union([\n${nonNull
          .map(
            (variant) =>
              `${pad(level + 1)}${expression(variant, level + 1)},`,
          )
          .join("\n")}\n${pad(level)}])`;
  return hasNull ? `${base}.nullable()` : base;
}

function objectExpression(def: ObjectTypeDef, level: number): string {
  if (def.properties.length === 0) return "z.object({})";
  const propertyLines = def.properties.map((property) => {
    const value = expression(property.type, level + 1);
    const optional = property.optional ? ".optional()" : "";
    return `${pad(level + 1)}${propertyKey(property.originalKey)}: ${value}${optional},`;
  });
  let result = `z.object({\n${propertyLines.join("\n")}\n${pad(level)}})`;
  if (def.properties.some((property) => property.key !== property.originalKey)) {
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

function expression(def: TypeDef, level: number): string {
  switch (def.kind) {
    case "string":
      return "z.string()";
    case "number":
      return "z.number()";
    case "boolean":
      return "z.boolean()";
    case "null":
      return "z.null()";
    case "date":
      return "z.coerce.date()";
    case "array":
      return `z.array(${expression(def.items, level)})`;
    case "union":
      return unionExpression(def, level);
    case "object":
      return objectExpression(def, level);
  }
}

export function generateZodSchema(def: TypeDef, rootName = "Root"): string {
  const schemaName = `${toPascalCase(rootName) || "Root"}Schema`;
  return `import { z } from "zod";\n\nexport const ${schemaName} = ${expression(def, 0)};\n`;
}
