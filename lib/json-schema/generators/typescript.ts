import { isIdentifier, toPascalCase } from "../casing";
import { typeKey } from "../infer";
import type { ObjectTypeDef, TypeDef } from "../infer";
import { resolveKeyCasing } from "../options";
import type { SchemaOptions } from "../options";

interface CollectedObject {
  name: string;
  def: ObjectTypeDef;
  keyMap: Array<[string, string]>;
}

export function generateTypeScriptTypes(
  def: TypeDef,
  rootName = "Root",
  options?: SchemaOptions,
): string {
  const keyCasing = resolveKeyCasing(options);
  const rootTypeName = toPascalCase(rootName) || "Root";
  const usedNames = new Set<string>();
  const shapeNames = new Map<string, string>();
  const objects: CollectedObject[] = [];

  const claimName = (hint: string): string => {
    const base = hint || "Value";
    let candidate = base;
    let suffix = 2;
    while (usedNames.has(candidate)) candidate = `${base}${suffix++}`;
    usedNames.add(candidate);
    return candidate;
  };

  const memberKey = (originalKey: string, camelKey: string): string =>
    keyCasing === "camel" ? camelKey : originalKey;

  const renderType = (node: TypeDef, hint: string): string => {
    switch (node.kind) {
      case "string":
      case "number":
      case "integer":
      case "boolean":
      case "null":
        return node.kind === "integer" ? "number" : node.kind;
      case "date":
        return "string";
      case "object": {
        const shape = typeKey(node);
        const known = shapeNames.get(shape);
        if (known) return known;
        const name = claimName(hint);
        shapeNames.set(shape, name);
        const keyMap: Array<[string, string]> = [];
        for (const property of node.properties) {
          renderType(
            property.type,
            `${name}${toPascalCase(property.originalKey)}`,
          );
          if (keyCasing === "camel" && property.key !== property.originalKey) {
            keyMap.push([property.key, property.originalKey]);
          }
        }
        objects.push({ name, def: node, keyMap });
        return name;
      }
      case "array": {
        const items = renderType(node.items, `${hint}Item`);
        const needsParens =
          node.items.kind === "union" && node.items.variants.length > 1;
        return needsParens ? `(${items})[]` : `${items}[]`;
      }
      case "union": {
        if (node.variants.length === 0) return "unknown";
        const hasNull = node.variants.some(
          (variant) => variant.kind === "null",
        );
        const parts = node.variants
          .filter((variant) => variant.kind !== "null")
          .map((variant) => renderType(variant, `${hint}Value`));
        if (hasNull) parts.push("null");
        return parts.join(" | ");
      }
    }
  };

  const blocks: string[] = [];
  const rootExpression = renderType(def, rootTypeName);

  for (const entry of objects) {
    const members = entry.def.properties.map((property) => {
      const type = renderType(
        property.type,
        `${entry.name}${toPascalCase(property.originalKey)}`,
      );
      const optionalMark = property.optional ? "?" : "";
      const name = isIdentifier(memberKey(property.originalKey, property.key))
        ? memberKey(property.originalKey, property.key)
        : JSON.stringify(property.originalKey);
      return `  ${name}${optionalMark}: ${type};`;
    });
    blocks.push(
      members.length > 0
        ? `export interface ${entry.name} {\n${members.join("\n")}\n}`
        : `export interface ${entry.name} {}`,
    );
    if (entry.keyMap.length > 0) {
      const mapName = claimName(`${entry.name}KeyMap`);
      const entries = entry.keyMap.map(
        ([key, original]) =>
          `  ${isIdentifier(key) ? key : JSON.stringify(key)}: ${JSON.stringify(original)},`,
      );
      blocks.push(
        `export const ${mapName} = {\n${entries.join("\n")}\n} as const;`,
      );
    }
  }

  if (def.kind !== "object") {
    blocks.unshift(`export type ${rootTypeName} = ${rootExpression};`);
  }

  return `${blocks.join("\n\n")}\n`;
}
