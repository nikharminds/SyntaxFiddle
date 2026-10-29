import type { ObjectPropertyDef, ObjectTypeDef, TypeDef } from "../json-schema/infer";
import { apexClassName, apexPropertyName, uniqueApexName } from "./naming";

/**
 * TypeDef → Apex emitter. Deterministic: same input JSON and options always
 * produce byte-identical Apex.
 *
 * Type mapping:
 *   string | null → String      (nulls absorb into String — no NPE surface)
 *   date          → DateTime    (System.DateTime parses ISO 8601 natively)
 *   number        → Decimal     (only type that round-trips every JSON
 *                                number through JSON.deserialize)
 *   boolean       → Boolean
 *   array         → List<T>     (empty array → List<Object>)
 *   object        → inner class (Pascal of the JSON key, recursive)
 *   union         → single surviving primitive, otherwise Object
 */

export interface ApexEmitOptions {
  readonly auraEnabled: boolean;
  readonly includeParse: boolean;
  readonly includeSerialize: boolean;
  /** parse() ships @AuraEnabled(cacheable=true) — callable from @wire. */
  readonly cacheableParse: boolean;
  /** Emit static fromHttpResponse(HttpResponse) delegating to parse(). */
  readonly includeCalloutHelper: boolean;
  readonly rootIsArray: boolean;
}

interface MemberSpec {
  readonly name: string;
  readonly apexType: string;
}

interface ClassSpec {
  readonly name: string;
  readonly members: readonly MemberSpec[];
  readonly innerClasses: readonly ClassSpec[];
}

/** Per-scope collection used while folding a TypeDef into class specs. */
class Scope {
  readonly usedMemberNames = new Set<string>();
  readonly usedClassNames = new Set<string>();
  constructor(readonly innerClasses: ClassSpec[]) {}
}

function primitiveType(def: TypeDef): string | null {
  switch (def.kind) {
    case "string":
    case "null":
      return "String";
    case "date":
      return "DateTime";
    case "number":
    case "integer":
      // Apex models all JSON numbers as Decimal; Integer is reserved for
      // loop counters and would change unmarshalling semantics.
      return "Decimal";
    case "boolean":
      return "Boolean";
    default:
      return null;
  }
}

function unionType(def: Extract<TypeDef, { kind: "union" }>, key: string, scope: Scope): string {
  const variants = def.variants.filter((variant) => variant.kind !== "null");
  if (variants.length === 0) return "Object";
  if (variants.length === 1) {
    return typeOf(variants[0] as TypeDef, key, scope);
  }
  const primitives = variants.map(primitiveType);
  if (primitives.every((name) => name !== null)) {
    const unique = new Set(primitives as string[]);
    if (unique.size === 1) return unique.values().next().value as string;
  }
  // Heterogeneous or object-bearing unions cannot be typed as one Apex
  // member without losing data — Object keeps deserialization honest.
  return "Object";
}

function typeOf(def: TypeDef, key: string, scope: Scope): string {
  const primitive = primitiveType(def);
  if (primitive) return primitive;
  switch (def.kind) {
    case "object":
      return addInnerClass(def, key, scope);
    case "array":
      return `List<${typeOf(def.items, key, scope)}>`;
    case "union":
      return unionType(def, key, scope);
    default:
      return "Object";
  }
}

function addInnerClass(def: ObjectTypeDef, key: string, scope: Scope): string {
  const className = uniqueApexName(apexClassName(key), scope.usedClassNames);
  const spec = buildClassSpec(className, def);
  scope.innerClasses.push(spec);
  return className;
}

function buildClassSpec(name: string, def: ObjectTypeDef): ClassSpec {
  const scope = new Scope([]);
  const members: MemberSpec[] = [];
  for (const property of def.properties) {
    const memberName = uniqueApexName(
      apexPropertyName(property.originalKey),
      scope.usedMemberNames,
    );
    members.push({
      name: memberName,
      apexType: typeOf(property.type, property.originalKey, scope),
    });
  }
  return { name, members, innerClasses: scope.innerClasses };
}

function countInnerClasses(spec: ClassSpec): number {
  return spec.innerClasses.reduce(
    (total, inner) => total + 1 + countInnerClasses(inner),
    0,
  );
}

function parseMethodLines(
  className: string,
  rootIsArray: boolean,
  indent: number,
  auraEnabled: boolean,
  cacheable: boolean,
): string[] {
  const pad = "    ".repeat(indent);
  const lines: string[] = [];
  if (cacheable) {
    // cacheable implies AuraEnabled — this is what makes the method
    // callable through @wire in Lightning Web Components.
    lines.push(`${pad}@AuraEnabled(cacheable=true)`);
  } else if (auraEnabled) {
    lines.push(`${pad}@AuraEnabled`);
  }
  if (rootIsArray) {
    lines.push(
      `${pad}public static List<${className}> parse(String json) {`,
      `${pad}    return (List<${className}>) JSON.deserialize(json, List<${className}>.class);`,
      `${pad}}`,
    );
  } else {
    lines.push(
      `${pad}public static ${className} parse(String json) {`,
      `${pad}    return (${className}) JSON.deserialize(json, ${className}.class);`,
      `${pad}}`,
    );
  }
  return lines;
}

function calloutHelperLines(
  className: string,
  rootIsArray: boolean,
  indent: number,
): string[] {
  const pad = "    ".repeat(indent);
  const returnType = rootIsArray ? `List<${className}>` : className;
  return [
    `${pad}public static ${returnType} fromHttpResponse(HttpResponse response) {`,
    `${pad}    return parse(response.getBody());`,
    `${pad}}`,
  ];
}

function serializeMethodLines(indent: number, auraEnabled: boolean): string[] {
  const pad = "    ".repeat(indent);
  const lines: string[] = [];
  if (auraEnabled) lines.push(`${pad}@AuraEnabled`);
  lines.push(
    `${pad}public String serialize() {`,
    `${pad}    return JSON.serialize(this);`,
    `${pad}}`,
  );
  return lines;
}

function renderClass(spec: ClassSpec, options: ApexEmitOptions, indent: number, isRoot: boolean): string[] {
  const pad = "    ".repeat(indent);
  const blocks: string[][] = [];

  for (const member of spec.members) {
    const lines: string[] = [];
    if (options.auraEnabled) lines.push(`${pad}    @AuraEnabled`);
    lines.push(`${pad}    public ${member.apexType} ${member.name} { get; set; }`);
    blocks.push(lines);
  }

  for (const inner of spec.innerClasses) {
    blocks.push(renderClass(inner, options, indent + 1, false));
  }

  if (isRoot && options.includeParse) {
    blocks.push(
      parseMethodLines(
        spec.name,
        options.rootIsArray,
        indent + 1,
        options.auraEnabled,
        options.cacheableParse,
      ),
    );
  }
  if (isRoot && options.includeSerialize) {
    blocks.push(serializeMethodLines(indent + 1, options.auraEnabled));
  }
  // The callout helper delegates to parse(), so it only exists when the
  // parse() helper does.
  if (isRoot && options.includeCalloutHelper && options.includeParse) {
    blocks.push(
      calloutHelperLines(spec.name, options.rootIsArray, indent + 1),
    );
  }

  const lines: string[] = [`${pad}public class ${spec.name} {`];
  if (blocks.length > 0) {
    for (const block of blocks) lines.push(...block, "");
    while (lines[lines.length - 1] === "") lines.pop();
  }
  lines.push(`${pad}}`);
  return lines;
}

export function emitApexClass(spec: ClassSpec, options: ApexEmitOptions): string {
  const header = [
    "// Generated by SyntaxFiddle — JSON to Apex Class Generator",
    "// https://syntaxfiddle.com/json-to-apex/",
    "",
  ];
  const body = renderClass(spec, options, 0, true);
  return [...header, ...body, ""].join("\n");
}

export { buildClassSpec, countInnerClasses };
