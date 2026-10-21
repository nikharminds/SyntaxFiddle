import { toPascalCase } from "./casing";
import { inferJson } from "./infer";
import type { TypeDef } from "./infer";
import { generateZodSchema } from "./generators/zod";
import { generateTypeScriptTypes } from "./generators/typescript";
import { generatePydanticModels } from "./generators/pydantic";
import { generateGoStructs } from "./generators/go";

export type SchemaTarget = "zod" | "ts" | "pydantic" | "go";

export function generateSchema(
  jsonString: string,
  target: SchemaTarget,
  rootName?: string,
): string {
  const definition: TypeDef = inferJson(jsonString);
  const name = toPascalCase(rootName ?? "Root") || "Root";
  switch (target) {
    case "zod":
      return generateZodSchema(definition, name);
    case "ts":
      return generateTypeScriptTypes(definition, name);
    case "pydantic":
      return generatePydanticModels(definition, name);
    case "go":
      return generateGoStructs(definition, name);
    default: {
      const exhausted: never = target;
      throw new Error(`Unsupported schema target: ${String(exhausted)}`);
    }
  }
}

export {
  inferJson,
  mergeTypes,
  typeKey,
  isIso8601,
  MAX_INFERENCE_DEPTH,
  JsonSchemaInferenceError,
  isJsonSchemaInferenceError,
} from "./infer";
export type {
  TypeDef,
  StringTypeDef,
  NumberTypeDef,
  BooleanTypeDef,
  NullTypeDef,
  DateTypeDef,
  ObjectTypeDef,
  ObjectPropertyDef,
  ArrayTypeDef,
  UnionTypeDef,
} from "./infer";
export { generateZodSchema } from "./generators/zod";
export { generateTypeScriptTypes } from "./generators/typescript";
export { generatePydanticModels } from "./generators/pydantic";
export { generateGoStructs } from "./generators/go";
export { toCamelCase, toPascalCase, toSnakeCase, isIdentifier } from "./casing";
