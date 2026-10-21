import { toPascalCase, toSnakeCase } from "../casing";
import { typeKey } from "../infer";
import type { ObjectTypeDef, TypeDef } from "../infer";

const PYTHON_KEYWORDS = new Set([
  "and", "as", "assert", "async", "await", "break", "class", "continue",
  "def", "del", "elif", "else", "except", "false", "finally", "for",
  "from", "global", "if", "import", "in", "is", "lambda", "none",
  "nonlocal", "not", "or", "pass", "raise", "return", "true", "try",
  "while", "with", "yield",
]);

interface CollectedClass {
  name: string;
  def: ObjectTypeDef;
  hasAliases: boolean;
}

interface ImportUsage {
  any: boolean;
  list: boolean;
  optional: boolean;
  union: boolean;
  datetime: boolean;
  aliases: boolean;
}

function pythonFieldName(originalKey: string): { name: string; aliased: boolean } {
  let name = toSnakeCase(originalKey);
  if (name === "") name = "field";
  if (/^[0-9]/.test(name)) name = `_${name}`;
  if (PYTHON_KEYWORDS.has(name)) name = `${name}_`;
  return { name, aliased: name !== originalKey };
}

export function generatePydanticModels(def: TypeDef, rootName = "Root"): string {
  const rootModelName = toPascalCase(rootName) || "Root";
  const usedNames = new Set<string>();
  const shapeNames = new Map<string, string>();
  const classes: CollectedClass[] = [];
  const imports: ImportUsage = {
    any: false,
    list: false,
    optional: false,
    union: false,
    datetime: false,
    aliases: false,
  };

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
        return "str";
      case "number":
        return "float";
      case "boolean":
        return "bool";
      case "null":
        imports.any = true;
        return "Any";
      case "date":
        imports.datetime = true;
        return "datetime";
      case "object": {
        const shape = typeKey(node);
        const known = shapeNames.get(shape);
        if (known) return known;
        const name = claimName(hint);
        shapeNames.set(shape, name);
        let hasAliases = false;
        for (const property of node.properties) {
          renderType(
            property.type,
            `${name}${toPascalCase(property.originalKey)}`,
          );
          if (pythonFieldName(property.originalKey).aliased) hasAliases = true;
        }
        if (hasAliases) imports.aliases = true;
        classes.push({ name, def: node, hasAliases });
        return name;
      }
      case "array":
        imports.list = true;
        return `List[${renderType(node.items, `${hint}Item`)}]`;
      case "union": {
        if (node.variants.length === 0) {
          imports.any = true;
          return "Any";
        }
        const hasNull = node.variants.some(
          (variant) => variant.kind === "null",
        );
        const parts = node.variants
          .filter((variant) => variant.kind !== "null")
          .map((variant) => renderType(variant, `${hint}Value`));
        let core: string;
        if (parts.length === 0) {
          imports.any = true;
          core = "Any";
        } else if (parts.length === 1) {
          core = parts[0] as string;
        } else {
          imports.union = true;
          core = `Union[${parts.join(", ")}]`;
        }
        if (hasNull) {
          imports.optional = true;
          return `Optional[${core}]`;
        }
        return core;
      }
    }
  };

  const blocks: string[] = [];
  const rootExpression = renderType(def, rootModelName);

  for (const entry of classes) {
    const lines: string[] = [];
    if (entry.hasAliases) {
      lines.push("    model_config = ConfigDict(populate_by_name=True)");
    }
    for (const property of entry.def.properties) {
      const { name, aliased } = pythonFieldName(property.originalKey);
      const type = renderType(
        property.type,
        `${entry.name}${toPascalCase(property.originalKey)}`,
      );
      const declared = property.optional
        ? ((imports.optional = true), `Optional[${type}]`)
        : type;
      let assignment = "";
      if (aliased) {
        const fieldArgs = [
          ...(property.optional ? ["None"] : []),
          `alias=${JSON.stringify(property.originalKey)}`,
        ];
        assignment = ` = Field(${fieldArgs.join(", ")})`;
      } else if (property.optional) {
        assignment = " = None";
      }
      lines.push(`    ${name}: ${declared}${assignment}`);
    }
    if (lines.length === 0) lines.push("    pass");
    blocks.push(`class ${entry.name}(BaseModel):\n${lines.join("\n")}`);
  }

  if (def.kind !== "object") {
    blocks.push(`${rootModelName} = ${rootExpression}`);
  }

  const importLines: string[] = [];
  if (imports.datetime) importLines.push("from datetime import datetime");
  const typingNames = [
    imports.any ? "Any" : null,
    imports.list ? "List" : null,
    imports.optional ? "Optional" : null,
    imports.union ? "Union" : null,
  ].filter((name): name is string => name !== null);
  if (typingNames.length > 0) {
    importLines.push(`from typing import ${typingNames.join(", ")}`);
  }
  if (importLines.length > 0) importLines.push("");
  const pydanticNames = [
    "BaseModel",
    imports.aliases ? "ConfigDict" : null,
    imports.aliases ? "Field" : null,
  ].filter((name): name is string => name !== null);
  importLines.push(`from pydantic import ${pydanticNames.join(", ")}`);

  return `${importLines.join("\n")}\n\n\n${blocks.join("\n\n\n")}\n`;
}
