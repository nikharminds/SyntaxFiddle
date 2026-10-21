import { toPascalCase } from "../casing";
import { typeKey } from "../infer";
import type { ObjectTypeDef, TypeDef } from "../infer";

interface CollectedStruct {
  name: string;
  def: ObjectTypeDef;
}

interface StructField {
  name: string;
  type: string;
  tag: string;
}

function goFieldName(originalKey: string): string {
  let name = toPascalCase(originalKey);
  if (name === "") name = "Field";
  if (/^[0-9]/.test(name)) name = `X${name}`;
  return name;
}

function isNilable(type: string): boolean {
  return (
    type.startsWith("[]") ||
    type.startsWith("*") ||
    type.startsWith("map[") ||
    type === "any"
  );
}

export function generateGoStructs(def: TypeDef, rootName = "Root"): string {
  const rootTypeName = toPascalCase(rootName) || "Root";
  const usedNames = new Set<string>();
  const shapeNames = new Map<string, string>();
  const structs: CollectedStruct[] = [];
  let usesTime = false;

  const claimName = (hint: string): string => {
    const base = hint || "Value";
    let candidate = base;
    let suffix = 2;
    while (usedNames.has(candidate)) candidate = `${base}${suffix++}`;
    usedNames.add(candidate);
    return candidate;
  };

  const renderType = (node: TypeDef, hint: string): string => {
    switch (node.kind) {
      case "string":
        return "string";
      case "number":
        return "float64";
      case "boolean":
        return "bool";
      case "null":
        return "any";
      case "date":
        usesTime = true;
        return "time.Time";
      case "object": {
        const shape = typeKey(node);
        const known = shapeNames.get(shape);
        if (known) return known;
        const name = claimName(hint);
        shapeNames.set(shape, name);
        for (const property of node.properties) {
          renderType(
            property.type,
            `${name}${toPascalCase(property.originalKey)}`,
          );
        }
        structs.push({ name, def: node });
        return name;
      }
      case "array":
        return `[]${renderType(node.items, `${hint}Item`)}`;
      case "union": {
        if (node.variants.length === 0) return "any";
        const rest = node.variants.filter(
          (variant) => variant.kind !== "null",
        );
        for (const variant of rest) {
          renderType(variant, `${hint}Value`);
        }
        if (rest.length === 1 && node.variants.length === 2) {
          return `*${renderType(rest[0] as TypeDef, `${hint}Value`)}`;
        }
        return "any";
      }
    }
  };

  const blocks: string[] = [];
  const rootExpression = renderType(def, rootTypeName);

  for (const entry of structs) {
    if (entry.def.properties.length === 0) {
      blocks.push(`type ${entry.name} struct{}`);
      continue;
    }
    const fields: StructField[] = entry.def.properties.map((property) => {
      let type = renderType(
        property.type,
        `${entry.name}${toPascalCase(property.originalKey)}`,
      );
      if (property.optional && !isNilable(type)) type = `*${type}`;
      const tagName = property.optional
        ? `${property.originalKey},omitempty`
        : property.originalKey;
      return {
        name: goFieldName(property.originalKey),
        type,
        tag: `\`json:"${tagName}"\``,
      };
    });
    const nameWidth = Math.max(
      ...fields.map((field) => field.name.length),
    );
    const typeWidth = Math.max(
      ...fields.map((field) => field.type.length),
    );
    const lines = fields.map(
      (field) =>
        `\t${field.name.padEnd(nameWidth)} ${field.type.padEnd(typeWidth)} ${field.tag}`,
    );
    blocks.push(
      `type ${entry.name} struct {\n${lines.join("\n")}\n}`,
    );
  }

  if (def.kind !== "object") {
    blocks.unshift(`type ${rootTypeName} = ${rootExpression}`);
  }

  const header = usesTime
    ? "package generated\n\nimport \"time\"\n\n"
    : "package generated\n\n";
  return `${header}${blocks.join("\n\n")}\n`;
}
