import { inferJson, isJsonSchemaInferenceError } from "../json-schema/infer";
import type { ObjectTypeDef, TypeDef } from "../json-schema/infer";
import { apexClassName } from "./naming";
import { buildClassSpec, countInnerClasses, emitApexClass } from "./generator";

/**
 * JSON → Salesforce Apex wrapper-class generator.
 *
 * 100% deterministic and client-side: parse + infer with the shared
 * TypeDef engine, then emit one outer class containing inner classes for
 * every nested object, a static parse() helper built on JSON.deserialize,
 * and an instance serialize() helper built on JSON.serialize.
 */

export interface ApexGenerationOptions {
  /** Outer class name (sanitized to PascalCase Apex identifier). */
  readonly rootName: string;
  /** Emit @AuraEnabled on members and helpers — LWC/Aura-ready output. */
  readonly auraEnabled: boolean;
  /** Emit static parse(String) via JSON.deserialize. */
  readonly includeParse: boolean;
  /** Emit instance serialize() via JSON.serialize. */
  readonly includeSerialize: boolean;
  /** parse() ships @AuraEnabled(cacheable=true) — @wire-compatible. */
  readonly cacheableParse: boolean;
  /** Emit static fromHttpResponse(HttpResponse) delegating to parse(). */
  readonly includeCalloutHelper: boolean;
}

export const DEFAULT_APEX_OPTIONS: ApexGenerationOptions = {
  rootName: "JsonResponse",
  auraEnabled: true,
  includeParse: true,
  includeSerialize: true,
  cacheableParse: false,
  includeCalloutHelper: false,
};

/** Page presets — all modes ship on the single /json-to-apex/ page as toggles. */
export const APEX_PRESETS = {
  /** The general-purpose generator: everything on. */
  hub: DEFAULT_APEX_OPTIONS,
  /**
   * LWC mode — @AuraEnabled members plus a cacheable parse()
   * (@AuraEnabled(cacheable=true)) that @wire can call directly;
   * LWC rarely serializes back.
   */
  lwc: {
    ...DEFAULT_APEX_OPTIONS,
    includeSerialize: false,
    cacheableParse: true,
  },
  /**
   * Callout-wrapper mode — plain members for server-side Apex, both
   * parse()/serialize() round-trip helpers, and a fromHttpResponse()
   * helper for one-line callout-body parsing.
   */
  wrapper: {
    ...DEFAULT_APEX_OPTIONS,
    auraEnabled: false,
    includeCalloutHelper: true,
  },
} as const;

export type ApexPreset = keyof typeof APEX_PRESETS;

export interface ApexGenerationResult {
  readonly apex: string;
  readonly className: string;
  readonly innerClassCount: number;
  readonly lineCount: number;
}

export class ApexGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApexGenerationError";
  }
}

export function isApexGenerationError(error: unknown): error is ApexGenerationError {
  return error instanceof Error && error.name === "ApexGenerationError";
}

function objectVariant(def: TypeDef): ObjectTypeDef | null {
  if (def.kind === "object") return def;
  if (def.kind === "union") {
    for (const variant of def.variants) {
      if (variant.kind === "object") return variant;
    }
  }
  return null;
}

function resolveRootObject(root: TypeDef): { def: ObjectTypeDef; isArray: boolean } {
  if (root.kind === "object") return { def: root, isArray: false };
  if (root.kind === "array") {
    const variant = objectVariant(root.items);
    if (variant) return { def: variant, isArray: true };
    const empty =
      (root.items.kind === "union" && root.items.variants.length === 0);
    if (empty) {
      throw new ApexGenerationError(
        "The pasted JSON is an empty array — paste an array with at least one object so the generator can infer fields.",
      );
    }
    throw new ApexGenerationError(
      "The JSON array contains no objects — the root must be an object or an array of objects to build Apex classes from.",
    );
  }
  throw new ApexGenerationError(
    "The root JSON value must be an object or an array of objects — scalar values have no fields to map into an Apex class.",
  );
}

export function generateApexClasses(
  raw: string,
  overrides?: Partial<ApexGenerationOptions>,
): ApexGenerationResult {
  const options: ApexGenerationOptions = { ...DEFAULT_APEX_OPTIONS, ...overrides };

  if (typeof raw !== "string" || raw.trim() === "") {
    throw new ApexGenerationError(
      "The pasted JSON appears to be empty — paste a JSON object or an array of objects to generate Apex wrapper classes.",
    );
  }

  let root: TypeDef;
  try {
    root = inferJson(raw);
  } catch (error) {
    if (isJsonSchemaInferenceError(error)) {
      throw new ApexGenerationError(error.message);
    }
    throw error;
  }

  const { def: rootObject, isArray: rootIsArray } = resolveRootObject(root);
  const className = apexClassName(options.rootName || "Root");
  const spec = buildClassSpec(className, rootObject);
  const apex = emitApexClass(spec, {
    auraEnabled: options.auraEnabled,
    includeParse: options.includeParse,
    includeSerialize: options.includeSerialize,
    cacheableParse: options.cacheableParse,
    includeCalloutHelper: options.includeCalloutHelper,
    rootIsArray,
  });

  return {
    apex,
    className,
    innerClassCount: countInnerClasses(spec),
    lineCount: apex.split("\n").length,
  };
}

export { apexClassName, apexPropertyName, isApexReservedWord, isApexSystemTypeName } from "./naming";
export type { ApexEmitOptions } from "./generator";
